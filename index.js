const canvas2 = document.getElementsByTagName('canvas')[0];
const canvas = document.getElementsByTagName('canvas')[1];

const ctx2 = canvas2.getContext('2d');

ctx2.lineWidth = 2;
ctx2.strokeStyle = '#000';

ctx2.lineTo(100, 200);
ctx2.lineTo(200, 280);
ctx2.stroke();

const ctx = canvas.getContext('2d');

let currentLine;

canvas.onpointerdown = (/** @type {PointerEvent} */ e) => {

  canvas.setPointerCapture(e.pointerId);

  currentLine = new FancyLine(e.clientX, e.clientY);

  console.log('start')

  canvas.onpointermove = (/** @type {PointerEvent} */ e) => {

    console.log(e.buttons);

    currentLine.addPoint(e.clientX, e.clientY, e.pressure);

    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    currentLine.draw(ctx);

  };

  canvas.onpointerup = (/** @type {PointerEvent} */ e) => {
    canvas.onpointermove = null;
    canvas.onpointerup = null;
  };

};

class FancyLine {

  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.segments = [];
  }

  addPoint(x, y, p) {
    this.segments.push({
      from: { x: this.x, y: this.y },
      to: { x, y },
      pressure: p,
    });

    this.x = x;
    this.y = y;
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

}
