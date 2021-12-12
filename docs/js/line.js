export class Line {
    constructor(lastPoint) {
        this.lastPoint = lastPoint;
        this.segments = [];
    }
    addPoint(newPoint, pressure) {
        const path = new Path2D();
        path.moveTo(this.lastPoint.x, this.lastPoint.y);
        path.lineTo(newPoint.x, newPoint.y);
        this.segments.push({
            pressure,
            from: this.lastPoint,
            to: newPoint,
            path,
        });
        this.lastPoint = newPoint;
    }
    inStroke(ctx, { x, y }) {
        return this.segments.some(s => ctx.isPointInStroke(s.path, x, y));
    }
    draw(ctx, scale) {
        ctx.lineCap = 'round';
        for (const s of this.segments) {
            ctx.beginPath();
            ctx.lineWidth = s.pressure * scale;
            ctx.moveTo(Math.round(s.from.x * scale), Math.round(s.from.y * scale));
            ctx.lineTo(Math.round(s.to.x * scale), Math.round(s.to.y * scale));
            ctx.stroke();
        }
    }
    serialize() {
        return [
            this.segments.map(s => [s.from.x, s.from.y, s.to.x, s.to.y, s.pressure]),
            [this.lastPoint.x, this.lastPoint.y],
        ];
    }
    static load(d) {
        const [segments, [x, y]] = d;
        const line = new Line({ x, y });
        line.segments = segments.map(seg => {
            const [fromX, fromY, toX, toY, pressure] = seg;
            const path = new Path2D();
            path.moveTo(fromX, fromY);
            path.lineTo(toX, toY);
            return {
                path,
                from: { x: fromX, y: fromY },
                to: { x: toX, y: toY },
                pressure,
            };
        });
        return line;
    }
}
