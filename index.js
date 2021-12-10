const canvas = document.getElementsByTagName('canvas')[0];

const ctx = canvas.getContext('2d');

ctx.lineWidth = 2;
ctx.strokeStyle = '#000';

ctx.lineTo(100, 200);
ctx.lineTo(200, 280);
ctx.stroke();

canvas.onpointerdown = (/** @type {PointerEvent} */ e) => {

  canvas.setPointerCapture(e.pointerId);

  let x = e.clientX;
  let y = e.clientY;

  console.log('start')

  canvas.onpointermove = (/** @type {PointerEvent} */ e) => {

    console.log(e.buttons);

    ctx.beginPath();
    ctx.lineCap = 'round'
    ctx.lineWidth = e.pressure * 20;
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
