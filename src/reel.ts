import { Line } from "./line";
import { Picture } from "./picture";

export class Reel {

  picture!: Picture;
  pictures: Picture[] = [];

  animating = false;

  thickness = 10;
  loops = true;
  speed = 10;

  ctx: CanvasRenderingContext2D;
  rec: MediaRecorder | undefined;

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
          if (toDelete.length > 0) {
            this.picture.removeLines(toDelete);
            this.redrawThumbnail();
            this.redraw();
          }
        }
        else {
          this.picture.addPoint(getPoint(e, this.canvas), e.pressure * this.thickness);
          this.picture.drawCurrentLine(this.ctx);
        }
      };

      this.canvas.onpointerup = (e) => {
        this.picture.finishLine();
        this.canvas.onpointermove = null;
        this.canvas.onpointerup = null;
      };

    };
  }

  timer: number | undefined;
  toggleAnimating() {
    this.animating = !this.animating;

    if (this.animating) {
      this.animateTick();
    }
    else {
      if (this.timer !== undefined) {
        clearTimeout(this.timer);
        this.timer = undefined;
      }
      this.selectPicture(this.picture.index);
    }
  }

  animateTick() {
    this.timer = undefined;

    let next = this.picture.index + 1;
    if (next == this.pictures.length) {
      if (!this.loops) {
        this.animating = false;
        return;
      }
      next = 0;
    }
    this.selectPicture(next);

    if (this.animating) {
      this.timer = setTimeout(() => {
        this.animateTick();
      }, this.speed);
    }
  }

  addPicture() {
    const index = this.pictures.length;
    const thumbnail = document.createElement('canvas');
    thumbnail.width = 120;
    thumbnail.height = 70;

    thumbnail.classList.add('thumbnail');
    thumbnail.onclick = e => {
      e.preventDefault();
      this.selectPicture(index);
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

    this.selectPicture(index);

    this.thumbnailsContainer.scrollTo({
      left: this.thumbnailsContainer.clientWidth,
      behavior: 'smooth',
    });
  }

  selectPicture(pictureIndex: number) {
    for (const picture of this.pictures) {
      picture.thumbnail.classList.remove('current');
    }

    this.picture = this.pictures[pictureIndex]!;
    this.picture.thumbnail.classList.add('current');

    this.redraw();

    console.log('focusing picture', pictureIndex)
  }

  undo() {
    this.picture.undo();
    this.redrawThumbnail();
    this.redraw();
  }

  redo() {
    this.picture.redo();
    this.redrawThumbnail();
    this.redraw();
  }

  redrawThumbnail() {
    const thumbnail = this.picture.thumbnail;
    const thumbnailCtx = this.picture.thumbnailCtx;
    thumbnailCtx.clearRect(0, 0, thumbnail.width, thumbnail.height);

    this.ctx.strokeStyle = '#000';
    this.picture!.redraw(thumbnailCtx, 0.1);
  }

  redraw() {
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.animating) {
      const SHADOWS = 3;
      const GAP = 35;
      const BASE = 255 - (GAP * (SHADOWS + 1));

      const first = Math.max(0, this.picture.index - SHADOWS);
      for (let i = first; i < this.picture.index; i++) {
        const picture = this.pictures[i];

        const distance = this.picture.index - i;
        const grey = BASE + (distance * GAP);

        const style = '#' + grey.toString(16).padStart(2, '0').repeat(3);
        this.ctx.strokeStyle = style;

        picture!.redraw(this.ctx);
      }
    }

    this.ctx.strokeStyle = '#000';
    this.picture!.redraw(this.ctx);
  }

  toggleRecording() {
    if (this.rec) {
      this.rec.stop();
      this.rec = undefined;
    }
    else {
      this.rec = new MediaRecorder(this.canvas.captureStream(25));
      const blobParts: Blob[] = [];
      this.rec.ondataavailable = e => {
        blobParts.push(e.data);
      };
      this.rec.onstop = () => {
        const blob = new Blob(blobParts, { type: 'video/mp4' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'drawing.mp4';
        link.click();
      };
      this.rec.start(100);
    }
  }

}

function getPoint(e: PointerEvent, canvas: HTMLCanvasElement) {
  return {
    x: e.clientX - canvas.getBoundingClientRect().left,
    y: e.clientY - canvas.getBoundingClientRect().top,
  };
}
