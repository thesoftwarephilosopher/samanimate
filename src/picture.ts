import { getPoint } from "./helpers";
import { FancyLine } from "./line";
import { LineStack } from "./line-stack";

export class Picture {

  canvas = document.createElement('canvas');
  ctx = this.canvas.getContext('2d')!;
  lineStack = new LineStack(this.ctx);

  constructor(
    public container: HTMLDivElement,
  ) {
    this.canvas.width = 600;
    this.canvas.height = 700;

    this.canvas.onpointerdown = (/** @type {PointerEvent} */ e) => {

      this.canvas.setPointerCapture(e.pointerId);
      this.lineStack.startNew(new FancyLine(this.ctx, this.canvas, e));

      this.canvas.onpointermove = (/** @type {PointerEvent} */ e) => {
        if (e.buttons === 32) {
          const p = getPoint(e, this.canvas);
          const toDelete = this.lineStack.visibleLines.filter(l => l.inStroke(p));
          this.lineStack.removeLines(toDelete);
        }
        else {
          this.lineStack.currentLine!.addPoint(e);
          this.lineStack.currentLine!.draw();
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
