
export type Point = { x: number, y: number };

export function getPoint(e: PointerEvent, canvas: HTMLCanvasElement): Point {
  return {
    x: e.clientX - canvas.getBoundingClientRect().left,
    y: e.clientY - canvas.getBoundingClientRect().top,
  };
}
