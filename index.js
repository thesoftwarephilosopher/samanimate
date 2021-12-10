const canvas2 = document.getElementsByTagName('canvas')[0];
const canvas = document.getElementsByTagName('canvas')[1];

const [undoButton, redoButton] = document.getElementsByTagName('button');

const ctx2 = canvas2.getContext('2d');

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

  redraw() {
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const line of this.allLines.slice(0, this.historyPoint)) {
      line.draw(this.ctx);
    }
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

  lineStack.startNew(new FancyLine(canvas, e));

  console.log('start')

  canvas.onpointermove = (/** @type {PointerEvent} */ e) => {

    console.log(e.buttons);

    lineStack.currentLine.addPoint(e);
    lineStack.currentLine.draw(ctx);
  };

  canvas.onpointerup = (/** @type {PointerEvent} */ e) => {
    lineStack.finishLine();
    canvas.onpointermove = null;
    canvas.onpointerup = null;
  };

};

class FancyLine {

  constructor(/** @type {HTMLCanvasElement} */ canvas, /** @type {PointerEvent} */ e) {
    this.canvas = canvas;
    this.lastPoint = this.getPoint(e);
    this.segments = [];
  }

  addPoint(/** @type {PointerEvent} */ e) {
    const newPoint = this.getPoint(e);

    this.segments.push({
      from: this.lastPoint,
      to: newPoint,
      pressure: e.pressure,
    });

    this.lastPoint = newPoint;
  }

  draw(ctx) {
    for (const s of this.segments) {
      ctx.beginPath();
      ctx.lineCap = 'round'
      ctx.lineWidth = s.pressure * 10;
      ctx.moveTo(s.from.x, s.from.y);
      ctx.lineTo(s.to.x, s.to.y);
      ctx.stroke();
    }
  }

  getPoint(/** @type {PointerEvent} */ e) {
    return {
      x: e.clientX - this.canvas.getBoundingClientRect().left,
      y: e.clientY - this.canvas.getBoundingClientRect().top,
    };
  }

}
