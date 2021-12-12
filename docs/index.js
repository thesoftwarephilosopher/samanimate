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
        serialize() {
            return [
                this.segments.map(s => [s.from.x, s.from.y, s.to.x, s.to.y, s.pressure]),
                [this.lastPoint.x, this.lastPoint.y],
            ];
        }
        static load(d) {
            const [segments, [x, y]] = d;
            const line = new Line({ x, y });
            line.segments = segments.map(seg => {
                const [fromX, fromY, toX, toY, pressure] = seg;
                const path = new Path2D();
                return {
                    path,
                    from: { x: fromX, y: fromY },
                    to: { x: toX, y: toY },
                    pressure,
                };
            });
            return line;
        }
    }
    exports.Line = Line;
});
define("picture", ["require", "exports", "line"], function (require, exports, line_1) {
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
        redrawThumbnail() {
            const thumbnail = this.thumbnail;
            const thumbnailCtx = this.thumbnailCtx;
            thumbnailCtx.clearRect(0, 0, thumbnail.width, thumbnail.height);
            thumbnailCtx.strokeStyle = '#000';
            this.redraw(thumbnailCtx, 0.1);
        }
        removeLines(lines) {
            this.allLines = this.allLines.filter(l => !lines.includes(l));
            this.historyPoint = this.allLines.length;
        }
        serialize() {
            return {
                historyPoint: this.historyPoint,
                allLines: this.allLines.map(line => line.serialize())
            };
        }
        load(data) {
            this.allLines = data.allLines.map(d => line_1.Line.load(d));
            this.historyPoint = data.historyPoint;
        }
    }
    exports.Picture = Picture;
});
define("reel", ["require", "exports", "line", "picture"], function (require, exports, line_2, picture_1) {
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
            this._shadows = 3;
            this.loops = true;
            this.speed = 10;
            this.ctx = this.canvas.getContext('2d');
            this.canvas.onpointerdown = (e) => {
                this.canvas.setPointerCapture(e.pointerId);
                this.picture.startNew(new line_2.Line(getPoint(e, this.canvas)));
                this.canvas.onpointermove = (e) => {
                    if (e.buttons === 32) {
                        const p = getPoint(e, this.canvas);
                        const toDelete = this.picture.visibleLines.filter(l => l.inStroke(this.ctx, p));
                        if (toDelete.length > 0) {
                            this.picture.removeLines(toDelete);
                            this.redrawThumbnail();
                            this.redraw();
                            this.saveToLocalStorageSoon();
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
                    this.saveToLocalStorageSoon();
                };
            };
        }
        toggleAnimating() {
            this.animating = !this.animating;
            if (this.animating) {
                this.animateTick(true);
            }
            else {
                if (this.timer !== undefined) {
                    clearTimeout(this.timer);
                    this.timer = undefined;
                }
                this.selectPicture(this.picture.index);
            }
        }
        animateTick(ignoreLoops) {
            this.timer = undefined;
            let next = this.picture.index + 1;
            if (next == this.pictures.length) {
                if (!this.loops && !ignoreLoops) {
                    this.animating = false;
                    this.stoppedAnimating();
                    return;
                }
                next = 0;
            }
            this.selectPicture(next);
            if (this.animating) {
                this.timer = setTimeout(() => {
                    this.animateTick(false);
                }, this.speed);
            }
        }
        addPicture(data) {
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
            if (data) {
                newPicture.load(data);
                newPicture.redrawThumbnail();
            }
            else {
                this.selectPicture(index);
                this.thumbnailsContainer.scrollTo({
                    left: this.thumbnailsContainer.clientWidth,
                    behavior: 'smooth',
                });
            }
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
            this.saveToLocalStorageSoon();
        }
        redo() {
            this.picture.redo();
            this.redrawThumbnail();
            this.redraw();
            this.saveToLocalStorageSoon();
        }
        redrawThumbnail() {
            this.picture.redrawThumbnail();
        }
        redraw() {
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            if (!this.animating) {
                const shadows = Math.min(this.picture.index, this._shadows);
                const GAP = 35;
                const BASE = 255 - (GAP * (shadows + 1));
                for (let i = this.picture.index - shadows; i < this.picture.index; i++) {
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
        set shadows(n) {
            this._shadows = n;
            this.redraw();
        }
        saveToLocalStorageSoon() {
            if (this.saveTimer === undefined) {
                this.saveTimer = setTimeout(() => {
                    this.saveTimer = undefined;
                    this.saveToLocalStorageNow();
                }, 1000 * 10);
            }
        }
        saveToLocalStorageNow() {
            console.log('Serializing...');
            const data = this.serialize();
            console.log('Storing...');
            localStorage.setItem('saved1', data);
            console.log('Done');
        }
        serialize() {
            return JSON.stringify({
                pictures: this.pictures.map(pic => pic.serialize())
            });
        }
        loadFromLocalStorage(data) {
            console.log("Loading...");
            data.pictures.forEach((d) => this.addPicture(d));
            this.selectPicture(0);
            console.log("Done");
        }
        saveToFile() {
            const data = this.serialize();
            const blob = new Blob([data], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'animation.json';
            link.click();
        }
        loadFromFile() {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = false;
            input.accept = 'application/json';
            input.oninput = async () => {
                const file = input.files?.[0];
                const text = await file?.text();
                if (text) {
                    localStorage.setItem('saved1', text);
                    location.reload();
                }
            };
            input.click();
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
    const saved = localStorage.getItem('saved1');
    if (saved) {
        const data = JSON.parse(saved);
        reel.loadFromLocalStorage(data);
    }
    else {
        reel.addPicture();
    }
    document.getElementById('undo-button').onclick = e => {
        reel.undo();
    };
    document.getElementById('redo-button').onclick = e => {
        reel.redo();
    };
    document.getElementById('add-picture').onclick = e => {
        reel.addPicture();
    };
    document.getElementById('new').onclick = e => {
        localStorage.removeItem('saved1');
        location.reload();
    };
    document.getElementById('save').onclick = e => {
        reel.saveToFile();
    };
    document.getElementById('load').onclick = e => {
        reel.loadFromFile();
    };
    document.getElementById('animate').onclick = e => {
        toggleActive(e.target);
        reel.toggleAnimating();
    };
    reel.stoppedAnimating = () => {
        toggleActive(document.getElementById('animate'));
    };
    document.getElementById('record').onclick = e => {
        toggleActive(e.target);
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
        key: 'shadows',
        value: 'value',
        set: (shadows) => { reel.shadows = +shadows; },
    });
    persistedElement({
        key: 'speed',
        value: 'value',
        set: (speed) => { reel.speed = +speed; },
    });
    function toggleActive(button) {
        button.classList.toggle('active');
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
