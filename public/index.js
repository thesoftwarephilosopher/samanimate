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
define("index", ["require", "exports", "helpers", "line", "line-stack"], function (require, exports, helpers_2, line_1, line_stack_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const canvas2 = document.getElementsByTagName('canvas')[0];
    const canvas = document.getElementsByTagName('canvas')[1];
    const undoButton = document.getElementsByTagName('button')[0];
    const redoButton = document.getElementsByTagName('button')[1];
    const ctx2 = canvas2.getContext('2d');
    ctx2.lineWidth = 2;
    ctx2.strokeStyle = '#000';
    ctx2.lineTo(100, 200);
    ctx2.lineTo(200, 280);
    ctx2.stroke();
    const ctx = canvas.getContext('2d');
    const lineStack = new line_stack_1.LineStack(ctx);
    undoButton.onclick = (/** @type {MouseEvent} */ e) => {
        e.preventDefault();
        lineStack.undo();
    };
    redoButton.onclick = (/** @type {MouseEvent} */ e) => {
        e.preventDefault();
        lineStack.redo();
    };
    canvas.onpointerdown = (/** @type {PointerEvent} */ e) => {
        canvas.setPointerCapture(e.pointerId);
        lineStack.startNew(new line_1.FancyLine(ctx, canvas, e));
        canvas.onpointermove = (/** @type {PointerEvent} */ e) => {
            if (e.buttons === 32) {
                const p = (0, helpers_2.getPoint)(e, canvas);
                const toDelete = lineStack.visibleLines.filter(l => l.inStroke(p));
                lineStack.removeLines(toDelete);
            }
            else {
                lineStack.currentLine.addPoint(e);
                lineStack.currentLine.draw();
            }
        };
        canvas.onpointerup = (/** @type {PointerEvent} */ e) => {
            lineStack.finishLine();
            canvas.onpointermove = null;
            canvas.onpointerup = null;
        };
    };
});
//# sourceMappingURL=index.js.map