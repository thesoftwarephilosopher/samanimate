define("line", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Line = void 0;
    class Line {
        constructor(lastPoint) {
            this.lastPoint = lastPoint;
            this.segments = [];
        }
        addPoint(newPoint, pressure) {
            const path = new Path2D();
            path.moveTo(this.lastPoint.x, this.lastPoint.y);
            path.lineTo(newPoint.x, newPoint.y);
            this.segments.push({
                pressure,
                from: this.lastPoint,
                to: newPoint,
                path,
            });
            this.lastPoint = newPoint;
        }
        inStroke(ctx, { x, y }) {
            return this.segments.some(s => ctx.isPointInStroke(s.path, x, y));
        }
        draw(ctx, scale) {
            ctx.lineCap = 'round';
            for (const s of this.segments) {
                ctx.beginPath();
                ctx.lineWidth = s.pressure * scale;
                ctx.moveTo(Math.round(s.from.x * scale), Math.round(s.from.y * scale));
                ctx.lineTo(Math.round(s.to.x * scale), Math.round(s.to.y * scale));
                ctx.stroke();
            }
        }
    }
    exports.Line = Line;
});
define("picture", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Picture = void 0;
    class Picture {
        constructor(index, thumbnail) {
            this.index = index;
            this.thumbnail = thumbnail;
            this.historyPoint = 0;
            this.allLines = [];
            this.thumbnailCtx = thumbnail.getContext('2d');
        }
        startNew(line) {
            this.allLines.length = this.historyPoint;
            this.currentLine = line;
            this.allLines.push(this.currentLine);
            this.historyPoint++;
        }
        addPoint(newPoint, pressure) {
            this.currentLine.addPoint(newPoint, pressure);
        }
        drawCurrentLine(ctx) {
            this.currentLine.draw(ctx, 1);
        }
        finishLine() {
            this.currentLine = undefined;
        }
        undo() {
            this.historyPoint = Math.max(this.historyPoint - 1, 0);
        }
        redo() {
            this.historyPoint = Math.min(this.historyPoint + 1, this.allLines.length);
        }
        get visibleLines() {
            return this.allLines.slice(0, this.historyPoint);
        }
        redraw(ctx, scale = 1) {
            for (const line of this.visibleLines) {
                line.draw(ctx, scale);
            }
        }
        removeLines(lines) {
            this.allLines = this.allLines.filter(l => !lines.includes(l));
            this.historyPoint = this.allLines.length;
        }
    }
    exports.Picture = Picture;
});
define("reel", ["require", "exports", "line", "picture"], function (require, exports, line_1, picture_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Reel = void 0;
    class Reel {
        constructor(canvas, thumbnailsContainer) {
            this.canvas = canvas;
            this.thumbnailsContainer = thumbnailsContainer;
            this.pictures = [];
            this.animating = false;
            this.thickness = 10;
            this.loops = true;
            this.speed = 10;
            this.ctx = this.canvas.getContext('2d');
            this.canvas.onpointerdown = (e) => {
                this.canvas.setPointerCapture(e.pointerId);
                this.picture.startNew(new line_1.Line(getPoint(e, this.canvas)));
                this.canvas.onpointermove = (e) => {
                    if (e.buttons === 32) {
                        const p = getPoint(e, this.canvas);
                        const toDelete = this.picture.visibleLines.filter(l => l.inStroke(this.ctx, p));
                        if (toDelete.length > 0) {
                            this.picture.removeLines(toDelete);
                            this.redrawThumbnail();
                            this.redraw();
                        }
                    }
                    else {
                        this.picture.addPoint(getPoint(e, this.canvas), e.pressure * this.thickness);
                        this.redraw();
                        this.redrawThumbnail();
                    }
                };
                this.canvas.onpointerup = (e) => {
                    this.picture.finishLine();
                    this.canvas.onpointermove = null;
                    this.canvas.onpointerup = null;
                };
            };
        }
        toggleAnimating() {
            this.animating = !this.animating;
            if (this.animating) {
                this.animateTick();
            }
            else {
                if (this.timer !== undefined) {
                    clearTimeout(this.timer);
                    this.timer = undefined;
                }
                this.selectPicture(this.picture.index);
            }
        }
        animateTick() {
            this.timer = undefined;
            let next = this.picture.index + 1;
            if (next == this.pictures.length) {
                if (!this.loops) {
                    this.animating = false;
                    return;
                }
                next = 0;
            }
            this.selectPicture(next);
            if (this.animating) {
                this.timer = setTimeout(() => {
                    this.animateTick();
                }, this.speed);
            }
        }
        addPicture() {
            const index = this.pictures.length;
            const thumbnail = document.createElement('canvas');
            thumbnail.width = 120;
            thumbnail.height = 70;
            thumbnail.classList.add('thumbnail');
            thumbnail.onclick = e => {
                e.preventDefault();
                this.selectPicture(index);
            };
            const newPicture = new picture_1.Picture(index, thumbnail);
            this.picture = newPicture;
            if (this.pictures.length > 0) {
                const firstPicture = this.pictures[this.pictures.length - 1];
                firstPicture.thumbnail.insertAdjacentElement('afterend', thumbnail);
            }
            else {
                this.thumbnailsContainer.insertAdjacentElement('afterbegin', thumbnail);
            }
            this.pictures.push(this.picture);
            this.selectPicture(index);
            this.thumbnailsContainer.scrollTo({
                left: this.thumbnailsContainer.clientWidth,
                behavior: 'smooth',
            });
        }
        selectPicture(pictureIndex) {
            for (const picture of this.pictures) {
                picture.thumbnail.classList.remove('current');
            }
            this.picture = this.pictures[pictureIndex];
            this.picture.thumbnail.classList.add('current');
            this.redraw();
            console.log('focusing picture', pictureIndex);
        }
        undo() {
            this.picture.undo();
            this.redrawThumbnail();
            this.redraw();
        }
        redo() {
            this.picture.redo();
            this.redrawThumbnail();
            this.redraw();
        }
        redrawThumbnail() {
            const thumbnail = this.picture.thumbnail;
            const thumbnailCtx = this.picture.thumbnailCtx;
            thumbnailCtx.clearRect(0, 0, thumbnail.width, thumbnail.height);
            this.ctx.strokeStyle = '#000';
            this.picture.redraw(thumbnailCtx, 0.1);
        }
        redraw() {
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            if (!this.animating) {
                const SHADOWS = 3;
                const GAP = 35;
                const BASE = 255 - (GAP * (SHADOWS + 1));
                const first = Math.max(0, this.picture.index - SHADOWS);
                for (let i = first; i < this.picture.index; i++) {
                    const picture = this.pictures[i];
                    const distance = this.picture.index - i;
                    const grey = BASE + (distance * GAP);
                    const style = '#' + grey.toString(16).padStart(2, '0').repeat(3);
                    this.ctx.strokeStyle = style;
                    picture.redraw(this.ctx);
                }
            }
            this.ctx.strokeStyle = '#000';
            this.picture.redraw(this.ctx);
        }
        toggleRecording() {
            if (this.rec) {
                this.rec.stop();
                this.rec = undefined;
            }
            else {
                this.rec = new MediaRecorder(this.canvas.captureStream(25));
                const blobParts = [];
                this.rec.ondataavailable = e => {
                    blobParts.push(e.data);
                };
                this.rec.onstop = () => {
                    const blob = new Blob(blobParts, { type: 'video/mp4' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'drawing.mp4';
                    link.click();
                };
                this.rec.start(100);
            }
        }
    }
    exports.Reel = Reel;
    function getPoint(e, canvas) {
        return {
            x: e.clientX - canvas.getBoundingClientRect().left,
            y: e.clientY - canvas.getBoundingClientRect().top,
        };
    }
});
define("index", ["require", "exports", "reel"], function (require, exports, reel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const reel = new reel_1.Reel(document.getElementById('canvas'), document.getElementById('thumbnails'));
    reel.addPicture();
    document.getElementById('undo-button').onclick = e => {
        reel.undo();
    };
    document.getElementById('redo-button').onclick = e => {
        reel.redo();
    };
    document.getElementById('add-picture').onclick = e => {
        reel.addPicture();
    };
    document.getElementById('animate').onclick = e => {
        toggleStartStop(e.target);
        reel.toggleAnimating();
    };
    document.getElementById('record').onclick = e => {
        toggleStartStop(e.target);
        reel.toggleRecording();
    };
    persistedElement({
        key: 'loop',
        value: 'checked',
        set: (loops) => { reel.loops = loops; },
    });
    persistedElement({
        key: 'thickness',
        value: 'value',
        set: (thickness) => { reel.thickness = +thickness; },
    });
    persistedElement({
        key: 'speed',
        value: 'value',
        set: (speed) => { reel.speed = +speed; },
    });
    function toggleStartStop(button) {
        if (button.innerText.includes('Start')) {
            button.innerText = button.innerText.replace('Start', 'Stop');
            button.classList.toggle('active');
        }
        else {
            button.innerText = button.innerText.replace('Stop', 'Start');
            button.classList.toggle('active');
        }
    }
    function persistedElement(opts) {
        const input = document.getElementById(opts.key);
        const savedValue = localStorage.getItem(opts.key);
        if (savedValue !== null) {
            input[opts.value] = JSON.parse(savedValue);
            opts.set(input[opts.value]);
        }
        input.oninput = e => {
            localStorage.setItem(opts.key, String(input[opts.value]));
            opts.set(input[opts.value]);
        };
    }
});
