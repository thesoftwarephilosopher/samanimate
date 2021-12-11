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
          this.picture.removeLines(toDelete);
          this.redraw();
        }
        else {
          this.picture.currentLine!.addPoint(getPoint(e, this.canvas), e.pressure * this.thickness);
          this.picture.currentLine!.draw(this.ctx, 1);

          this.saveThumbnailSoon();
        }
      };

      this.canvas.onpointerup = (e) => {
        this.picture.finishLine();
        this.canvas.onpointermove = null;
        this.canvas.onpointerup = null;
      };

    };
  }

  thumbnailTimer: number | undefined;
  saveThumbnailSoon() {
    if (this.thumbnailTimer === undefined) {
      this.thumbnailTimer = setTimeout(() => {
        this.thumbnailTimer = undefined;
        this.saveThumbnailNow();
      }, 500);
    }
  }

  saveThumbnailNow() {
    this.redraw(true, 5);

    const url = this.canvas.toDataURL();
    this.picture.thumbnail.style.backgroundImage = `url(${url})`;

    this.redraw();
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
    const thumbnail = document.createElement('button');

    thumbnail.classList.add('thumbnail');
    thumbnail.innerText = `#${index + 1}`;
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
    if (this.thumbnailTimer) {
      clearTimeout(this.thumbnailTimer);
      this.thumbnailTimer = undefined;
      this.saveThumbnailNow();
    }

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
    this.redraw();
  }

  redo() {
    this.picture.redo();
    this.redraw();
  }

  redraw(ignoreShadows = false, thickness = 1) {
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!ignoreShadows && !this.animating) {
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

        picture!.redraw(this.ctx, thickness);
      }
    }

    this.ctx.strokeStyle = '#000';
    this.picture!.redraw(this.ctx, thickness);
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
