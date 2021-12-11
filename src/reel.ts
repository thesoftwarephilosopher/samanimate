import { Line } from "./line";
import { Picture } from "./picture";

export class Reel {

  picture!: Picture;
  pictures: Picture[] = [];

  animating = false;
  animateTick = this.showNextPicture.bind(this);
  timer: number | undefined;

  ctx: CanvasRenderingContext2D;

  constructor(
    private canvas: HTMLCanvasElement,
    private thumbnailsContainer: HTMLDivElement,
  ) {
    this.ctx = this.canvas.getContext('2d')!;

    this.canvas.onpointerdown = (e) => {

      this.canvas.setPointerCapture(e.pointerId);
      this.picture.startNew(new Line(getPoint(e, this.canvas)));

      this.canvas.onpointermove = (e) => {
        if (e.buttons === 32) {
          const p = getPoint(e, this.canvas);
          const toDelete = this.picture.visibleLines.filter(l => l.inStroke(this.ctx, p));
          this.picture.removeLines(toDelete);
          this.redraw();
        }
        else {
          this.picture.currentLine!.addPoint(getPoint(e, this.canvas), e.pressure);
          this.picture.currentLine!.draw(this.ctx);
        }
      };

      this.canvas.onpointerup = (e) => {
        this.picture.finishLine();
        this.canvas.onpointermove = null;
        this.canvas.onpointerup = null;
      };

    };
  }

  toggleAnimating() {
    this.animating = !this.animating;

    if (this.animating) {
      this.timer = setInterval(this.animateTick, 200);
    }
    else {
      clearInterval(this.timer);
      this.timer = undefined;
      this.focus(this.picture.index);
    }
  }

  showNextPicture() {
    let next = this.picture.index + 1;
    if (next >= this.pictures.length) next = 0;
    this.focus(next);
  }

  addPicture() {
    const index = this.pictures.length;
    const thumbnail = document.createElement('button');

    thumbnail.classList.add('thumbnail');
    thumbnail.innerText = `#${index + 1}`;
    thumbnail.onclick = e => {
      e.preventDefault();
      this.focus(index);
    };

    const newPicture = new Picture(index, thumbnail);
    this.picture = newPicture;

    if (this.pictures.length > 0) {
      const firstPicture = this.pictures[this.pictures.length - 1];
      firstPicture!.thumbnail.insertAdjacentElement('afterend', thumbnail);
    }
    else {
      this.thumbnailsContainer.insertAdjacentElement('afterbegin', thumbnail);
    }

    this.pictures.push(this.picture);

    this.focus(index);
  }

  focus(pictureIndex: number) {
    for (const picture of this.pictures) {
      picture.thumbnail.classList.remove('current');
    }

    this.picture = this.pictures[pictureIndex]!;
    this.picture.thumbnail.classList.add('current');

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const SHADOWS = 3;
    const GAP = 35;
    const BASE = 255 - (GAP * (SHADOWS + 1));

    const first = Math.max(0, pictureIndex - SHADOWS);
    for (let i = first; i <= pictureIndex; i++) {
      const picture = this.pictures[i];

      const distance = pictureIndex - i;
      const grey = (Math.sign(distance) * BASE) + (distance * GAP);

      const style = '#' + grey.toString(16).padStart(2, '0').repeat(3);
      console.log({ style })
      this.ctx.strokeStyle = style;

      picture!.redraw(this.ctx);
    }

    console.log('focusing picture', pictureIndex)
  }

  undo() {
    this.picture.undo();
    this.redraw();
  }

  redo() {
    this.picture.undo();
    this.redraw();
  }

  redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.picture.redraw(this.ctx);
  }

}

function getPoint(e: PointerEvent, canvas: HTMLCanvasElement) {
  return {
    x: e.clientX - canvas.getBoundingClientRect().left,
    y: e.clientY - canvas.getBoundingClientRect().top,
  };
}
