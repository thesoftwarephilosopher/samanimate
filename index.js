const canvas2 = document.getElementsByTagName('canvas')[0];
const canvas = document.getElementsByTagName('canvas')[1];

const ctx2 = canvas2.getContext('2d');

ctx2.lineWidth = 2;
ctx2.strokeStyle = '#000';

ctx2.lineTo(100, 200);
ctx2.lineTo(200, 280);
ctx2.stroke();

const ctx = canvas.getContext('2d');

canvas.onpointerdown = (/** @type {PointerEvent} */ e) => {

  canvas.setPointerCapture(e.pointerId);

  let x = e.clientX;
  let y = e.clientY;

  console.log('start')

  canvas.onpointermove = (/** @type {PointerEvent} */ e) => {

    console.log(e.buttons);

    ctx.beginPath();
    ctx.lineCap = 'round'
    ctx.lineWidth = e.pressure * 10;
    ctx.moveTo(x, y);
    ctx.lineTo(e.clientX, e.clientY);
    ctx.stroke();

    x = e.clientX;
    y = e.clientY;

  };

  canvas.onpointerup = (/** @type {PointerEvent} */ e) => {
    canvas.onpointermove = null;
    canvas.onpointerup = null;
  };

};
