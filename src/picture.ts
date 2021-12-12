import { Line, SerializedLine } from "./line";

export class Picture {

  historyPoint = 0;
  allLines: Line[] = [];

  constructor(
    public index: number,
    public thumbnail: HTMLCanvasElement,
  ) { }

  startNew(line: Line) {
    this.allLines.length = this.historyPoint;
    this.allLines.push(line);
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

  redraw(ctx: CanvasRenderingContext2D, scale = 1) {
    for (const line of this.visibleLines) {
      line.draw(ctx, scale);
    }
  }

  redrawThumbnail() {
    const thumbnailCtx = this.thumbnail.getContext('2d')!;
    thumbnailCtx.clearRect(0, 0, this.thumbnail.width, this.thumbnail.height);
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
