import { FancyLine } from "./line";

export class LineStack {

  currentLine: FancyLine | undefined;
  historyPoint = 0;
  allLines: FancyLine[] = [];

  constructor(private ctx: CanvasRenderingContext2D) { }

  startNew(line: FancyLine) {
    this.allLines.length = this.historyPoint;
    this.currentLine = line;
  }

  finishLine() {
    this.allLines.push(this.currentLine!);
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

  removeLines(lines: FancyLine[]) {
    this.allLines = this.allLines.filter(l => !lines.includes(l));
    this.historyPoint = this.allLines.length;
    this.redraw();
  }

}
