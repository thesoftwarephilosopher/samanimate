import { getPoint } from "./helpers";
import { FancyLine } from "./line";
import { LineStack } from "./line-stack";


const canvas2 = document.getElementsByTagName('canvas')[0]!;
const canvas = document.getElementsByTagName('canvas')[1]!;

const undoButton = document.getElementsByTagName('button')[0]!;
const redoButton = document.getElementsByTagName('button')[1]!;

const ctx2 = canvas2.getContext('2d')!;

ctx2.lineWidth = 2;
ctx2.strokeStyle = '#000';

ctx2.lineTo(100, 200);
ctx2.lineTo(200, 280);
ctx2.stroke();

const ctx = canvas.getContext('2d')!;

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
      lineStack.currentLine!.addPoint(e);
      lineStack.currentLine!.draw();
    }
  };

  canvas.onpointerup = (/** @type {PointerEvent} */ e) => {
    lineStack.finishLine();
    canvas.onpointermove = null;
    canvas.onpointerup = null;
  };

};
