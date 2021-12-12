import { Line, Point } from "./line";

export class Picture {

  private currentLine: Line | undefined;
  historyPoint = 0;
  allLines: Line[] = [];
  thumbnailCtx;

  constructor(
    public index: number,
    public thumbnail: HTMLCanvasElement,
  ) {
    this.thumbnailCtx = thumbnail.getContext('2d')!;
  }

  startNew(line: Line) {
    this.allLines.length = this.historyPoint;
    this.currentLine = line;

    this.allLines.push(this.currentLine!);
    this.historyPoint++;
  }

  addPoint(newPoint: Point, pressure: number) {
    this.currentLine!.addPoint(newPoint, pressure);
  }

  drawCurrentLine(ctx: CanvasRenderingContext2D) {
    this.currentLine!.draw(ctx, 1);
  }

  finishLine() {
    this.currentLine = undefined;
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

  redraw(ctx: CanvasRenderingContext2D, scale = 1) {
    for (const line of this.visibleLines) {
      line.draw(ctx, scale);
    }
  }

  removeLines(lines: Line[]) {
    this.allLines = this.allLines.filter(l => !lines.includes(l));
    this.historyPoint = this.allLines.length;
  }

}
