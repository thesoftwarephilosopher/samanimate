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
                path,
            });
            this.lastPoint = newPoint;
        }
        inStroke(ctx, { x, y }) {
            return this.segments.some(s => ctx.isPointInStroke(s.path, x, y));
        }
        draw(ctx) {
            for (const s of this.segments) {
                ctx.lineCap = 'round';
                ctx.lineWidth = s.pressure * 10;
                ctx.stroke(s.path);
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
        }
        startNew(line) {
            this.allLines.length = this.historyPoint;
            this.currentLine = line;
        }
        finishLine() {
            this.allLines.push(this.currentLine);
            this.currentLine = undefined;
            this.historyPoint++;
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
        redraw(ctx) {
            for (const line of this.visibleLines) {
                line.draw(ctx);
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
            this.animateTick = this.showNextPicture.bind(this);
            this.ctx = this.canvas.getContext('2d');
            this.canvas.onpointerdown = (e) => {
                this.canvas.setPointerCapture(e.pointerId);
                this.picture.startNew(new line_1.Line(getPoint(e, this.canvas)));
                this.canvas.onpointermove = (e) => {
                    if (e.buttons === 32) {
                        const p = getPoint(e, this.canvas);
                        const toDelete = this.picture.visibleLines.filter(l => l.inStroke(this.ctx, p));
                        this.picture.removeLines(toDelete);
                        this.redraw();
                    }
                    else {
                        this.picture.currentLine.addPoint(getPoint(e, this.canvas), e.pressure);
                        this.picture.currentLine.draw(this.ctx);
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
                this.timer = setInterval(this.animateTick, 200);
            }
            else {
                clearInterval(this.timer);
                this.timer = undefined;
                this.selectPicture(this.picture.index);
            }
        }
        showNextPicture() {
            let next = this.picture.index + 1;
            if (next >= this.pictures.length) {
                next = 0;
                if (this.rec) {
                    this.rec.stop();
                    this.toggleAnimating();
                }
            }
            this.selectPicture(next);
        }
        addPicture() {
            const index = this.pictures.length;
            const thumbnail = document.createElement('button');
            thumbnail.classList.add('thumbnail');
            thumbnail.innerText = `#${index + 1}`;
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
            this.redraw();
        }
        redo() {
            this.picture.undo();
            this.redraw();
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
        animateAndSave() {
            this.rec = new MediaRecorder(this.canvas.captureStream());
            const blobParts = [];
            this.rec.ondataavailable = e => {
                blobParts.push(e.data);
            };
            this.rec.onstop = e => {
                const blob = new Blob(blobParts, { type: 'video/mp4' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'myanimation.mp4';
                link.click();
                this.rec = undefined;
            };
            this.rec.start();
            this.selectPicture(0);
            this.toggleAnimating();
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
        e.preventDefault();
        reel.undo();
    };
    document.getElementById('redo-button').onclick = e => {
        e.preventDefault();
        reel.redo();
    };
    document.getElementById('animate').onclick = e => {
        e.preventDefault();
        reel.toggleAnimating();
    };
    document.getElementById('add-picture').onclick = e => {
        e.preventDefault();
        reel.addPicture();
    };
    document.getElementById('save-animation').onclick = e => {
        e.preventDefault();
        reel.animateAndSave();
    };
});
