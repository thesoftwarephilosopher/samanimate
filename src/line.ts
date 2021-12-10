import { getPoint, Point } from "./helpers";

export class Line {

  segments: { pressure: number, path: Path2D }[] = [];

  lastPoint: Point;

  constructor(
    private ctx: CanvasRenderingContext2D,
    public canvas: HTMLCanvasElement,
    e: PointerEvent,
  ) {
    this.lastPoint = getPoint(e, this.canvas);
  }

  addPoint(e: PointerEvent) {
    const newPoint = getPoint(e, this.canvas);

    const path = new Path2D();
    path.moveTo(this.lastPoint.x, this.lastPoint.y);
    path.lineTo(newPoint.x, newPoint.y);

    this.segments.push({
      pressure: e.pressure,
      path,
    });

    this.lastPoint = newPoint;
  }

  inStroke({ x, y }: Point) {
    return this.segments.some(s =>
      this.ctx.isPointInStroke(s.path, x, y));
  }

  draw() {
    for (const s of this.segments) {
      this.ctx.lineCap = 'round'
      this.ctx.lineWidth = s.pressure * 10;
      this.ctx.stroke(s.path);
    }
  }

}
