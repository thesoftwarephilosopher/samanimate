import { Line, Point, SerializedLine } from "./line";

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

  redrawThumbnail() {
    const thumbnail = this.thumbnail;
    const thumbnailCtx = this.thumbnailCtx;
    thumbnailCtx.clearRect(0, 0, thumbnail.width, thumbnail.height);
    thumbnailCtx.strokeStyle = '#000';
    this.redraw(thumbnailCtx, 0.1);
  }

  removeLines(lines: Line[]) {
    this.allLines = this.allLines.filter(l => !lines.includes(l));
    this.historyPoint = this.allLines.length;
  }

  serialize(): SerializedPicture {
    return {
      historyPoint: this.historyPoint,
      allLines: this.allLines.map(line =>
        line.serialize())
    };
  }

  load(data: SerializedPicture) {
    this.allLines = data.allLines.map(d => Line.load(d));
    this.historyPoint = data.historyPoint;
  }

}

export type SerializedPicture = {
  historyPoint: number,
  allLines: SerializedLine[],
};
