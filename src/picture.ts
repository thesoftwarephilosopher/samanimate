import { Line } from "./line";

export class Picture {

  currentLine: Line | undefined;
  historyPoint = 0;
  allLines: Line[] = [];

  constructor(
    public index: number,
    public thumbnail: HTMLButtonElement,
  ) { }

  startNew(line: Line) {
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
  }

  redo() {
    this.historyPoint = Math.min(this.historyPoint + 1, this.allLines.length);
  }

  get visibleLines() {
    return this.allLines.slice(0, this.historyPoint);
  }

  redraw(ctx: CanvasRenderingContext2D) {
    for (const line of this.visibleLines) {
      line.draw(ctx);
    }
  }

  removeLines(lines: Line[]) {
    this.allLines = this.allLines.filter(l => !lines.includes(l));
    this.historyPoint = this.allLines.length;
  }

}
