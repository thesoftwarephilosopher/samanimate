const canvas2 = document.getElementsByTagName('canvas')[0]!;
const canvas = document.getElementsByTagName('canvas')[1]!;

const [undoButton, redoButton] = document.getElementsByTagName('button');

const ctx2 = canvas2.getContext('2d')!;

ctx2.lineWidth = 2;
ctx2.strokeStyle = '#000';

ctx2.lineTo(100, 200);
ctx2.lineTo(200, 280);
ctx2.stroke();

const ctx = canvas.getContext('2d');

class LineStack {

  constructor(ctx) {
    this.currentLine = null;
    this.historyPoint = 0;
    this.allLines = [];
    this.ctx = ctx;
  }

  startNew(line) {
    this.allLines.length = this.historyPoint;
    this.currentLine = line;
  }

  finishLine() {
    this.allLines.push(this.currentLine);
    this.currentLine = null;
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
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const line of this.visibleLines) {
      line.draw(this.ctx);
    }
  }

  removeLines(lines) {
    this.allLines = this.allLines.filter(l => !lines.includes(l));
    this.historyPoint = this.allLines.length;
    this.redraw();
  }

}

const lineStack = new LineStack(ctx);

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
  lineStack.startNew(new FancyLine(ctx, canvas, e));

  canvas.onpointermove = (/** @type {PointerEvent} */ e) => {
    if (e.buttons === 32) {
      const p = getPoint(e, canvas);
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

class FancyLine {

  constructor(/** @type {CanvasRenderingContext2D} */ ctx, /** @type {HTMLCanvasElement} */ canvas, /** @type {PointerEvent} */ e) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.lastPoint = getPoint(e, this.canvas);

    /** @type {{pressure:number, path:Path2D}[]} */
    this.segments = [];
  }

  addPoint(/** @type {PointerEvent} */ e) {
    const newPoint = getPoint(e, this.canvas);

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
    return this.segments.some(s =>
      this.ctx.isPointInStroke(s.path, x, y));
  }

  draw() {
    for (const s of this.segments) {
      this.ctx.lineCap = 'round'
      this.ctx.lineWidth = s.pressure * 10;
      this.ctx.stroke(s.path);
    }
  }

}

function getPoint(/** @type {PointerEvent} */ e, /** @type {HTMLCanvasElement} */ canvas) {
  return {
    x: e.clientX - canvas.getBoundingClientRect().left,
    y: e.clientY - canvas.getBoundingClientRect().top,
  };
}
