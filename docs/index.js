define("helpers", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getPoint = void 0;
    function getPoint(e, canvas) {
        return {
            x: e.clientX - canvas.getBoundingClientRect().left,
            y: e.clientY - canvas.getBoundingClientRect().top,
        };
    }
    exports.getPoint = getPoint;
});
define("line", ["require", "exports", "helpers"], function (require, exports, helpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FancyLine = void 0;
    class FancyLine {
        constructor(ctx, canvas, e) {
            this.ctx = ctx;
            this.canvas = canvas;
            this.segments = [];
            this.lastPoint = (0, helpers_1.getPoint)(e, this.canvas);
        }
        addPoint(e) {
            const newPoint = (0, helpers_1.getPoint)(e, this.canvas);
            const path = new Path2D();
            path.moveTo(this.lastPoint.x, this.lastPoint.y);
            path.lineTo(newPoint.x, newPoint.y);
            this.segments.push({
                pressure: e.pressure,
                path,
            });
            this.lastPoint = newPoint;
        }
        inStroke({ x, y }) {
            return this.segments.some(s => this.ctx.isPointInStroke(s.path, x, y));
        }
        draw() {
            for (const s of this.segments) {
                this.ctx.lineCap = 'round';
                this.ctx.lineWidth = s.pressure * 10;
                this.ctx.stroke(s.path);
            }
        }
    }
    exports.FancyLine = FancyLine;
});
define("line-stack", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LineStack = void 0;
    class LineStack {
        constructor(ctx) {
            this.ctx = ctx;
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
            this.redraw();
        }
        redo() {
            this.historyPoint = Math.min(this.historyPoint + 1, this.allLines.length);
            this.redraw();
        }
        get visibleLines() {
            return this.allLines.slice(0, this.historyPoint);
        }
        redraw() {
            const canvas = this.ctx.canvas;
            this.ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const line of this.visibleLines) {
                line.draw();
            }
        }
        removeLines(lines) {
            this.allLines = this.allLines.filter(l => !lines.includes(l));
            this.historyPoint = this.allLines.length;
            this.redraw();
        }
    }
    exports.LineStack = LineStack;
});
define("picture", ["require", "exports", "helpers", "line", "line-stack"], function (require, exports, helpers_2, line_1, line_stack_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Picture = void 0;
    class Picture {
        constructor(container) {
            this.container = container;
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.lineStack = new line_stack_1.LineStack(this.ctx);
            this.canvas.width = 600;
            this.canvas.height = 700;
            this.canvas.onpointerdown = (/** @type {PointerEvent} */ e) => {
                this.canvas.setPointerCapture(e.pointerId);
                this.lineStack.startNew(new line_1.FancyLine(this.ctx, this.canvas, e));
                this.canvas.onpointermove = (/** @type {PointerEvent} */ e) => {
                    if (e.buttons === 32) {
                        const p = (0, helpers_2.getPoint)(e, this.canvas);
                        const toDelete = this.lineStack.visibleLines.filter(l => l.inStroke(p));
                        this.lineStack.removeLines(toDelete);
                    }
                    else {
                        this.lineStack.currentLine.addPoint(e);
                        this.lineStack.currentLine.draw();
                    }
                };
                this.canvas.onpointerup = (/** @type {PointerEvent} */ e) => {
                    this.lineStack.finishLine();
                    this.canvas.onpointermove = null;
                    this.canvas.onpointerup = null;
                };
            };
            this.container.append(this.canvas);
        }
    }
    exports.Picture = Picture;
});
define("index", ["require", "exports", "picture"], function (require, exports, picture_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const canvasContainer = document.getElementById('canvases');
    const thumbnailContainer = document.getElementById('thumbnails');
    const pic0 = new picture_1.Picture(canvasContainer);
    const ctx2 = pic0.canvas.getContext('2d');
    ctx2.lineTo(100, 200);
    ctx2.lineTo(200, 280);
    ctx2.stroke();
    pic0.canvas.classList.add('under');
    const pic = new picture_1.Picture(canvasContainer);
    document.getElementById('undo-button').onclick = e => {
        e.preventDefault();
        pic.lineStack.undo();
    };
    document.getElementById('redo-button').onclick = e => {
        e.preventDefault();
        pic.lineStack.redo();
    };
});
//# sourceMappingURL=index.js.map