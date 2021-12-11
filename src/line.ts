type Point = { x: number, y: number };

export class Line {

  segments: {
    pressure: number,
    path: Path2D,
  }[] = [];

  constructor(
    private lastPoint: Point,
  ) { }

  addPoint(newPoint: Point, pressure: number) {
    const path = new Path2D();
    path.moveTo(this.lastPoint.x, this.lastPoint.y);
    path.lineTo(newPoint.x, newPoint.y);

    this.segments.push({
      pressure,
      path,
    });

    this.lastPoint = newPoint;
  }

  inStroke(ctx: CanvasRenderingContext2D, { x, y }: Point) {
    return this.segments.some(s =>
      ctx.isPointInStroke(s.path, x, y));
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const s of this.segments) {
      ctx.lineCap = 'round'
      ctx.lineWidth = s.pressure * 10;
      ctx.stroke(s.path);
    }
  }

}
