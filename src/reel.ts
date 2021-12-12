import { Line } from "./line";
import { Picture, SerializedPicture } from "./picture";

export class Reel {

  picture!: Picture;
  pictures: Picture[] = [];

  animating = false;

  thickness = 10;
  private _shadows = 3;
  loops = true;
  speed = 10;

  stoppedAnimating!: () => void;

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

            this.saveSoon();
          }
        }
        else {
          this.picture.addPoint(getPoint(e, this.canvas), e.pressure * this.thickness);
          this.redraw();
          this.redrawThumbnail();
        }
      };

      this.canvas.onpointerup = (e) => {
        this.picture.finishLine();
        this.canvas.onpointermove = null;
        this.canvas.onpointerup = null;

        this.saveSoon();
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
        this.stoppedAnimating();
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

  addPicture(data?: SerializedPicture) {
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

    if (data) {
      newPicture.load(data);
      newPicture.redrawThumbnail();
    }
    else {
      this.selectPicture(index);
      this.thumbnailsContainer.scrollTo({
        left: this.thumbnailsContainer.clientWidth,
        behavior: 'smooth',
      });
    }
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

    this.saveSoon();
  }

  redo() {
    this.picture.redo();
    this.redrawThumbnail();
    this.redraw();

    this.saveSoon();
  }

  redrawThumbnail() {
    this.picture.redrawThumbnail();
  }

  redraw() {
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.animating) {
      const shadows = Math.min(this.picture.index, this._shadows);

      const GAP = 35;
      const BASE = 255 - (GAP * (shadows + 1));

      for (let i = this.picture.index - shadows; i < this.picture.index; i++) {
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

  public set shadows(n: number) {
    this._shadows = n;
    this.redraw();
  }

  saveTimer: number | undefined;
  saveSoon() {
    if (this.saveTimer === undefined) {
      this.saveTimer = setTimeout(() => {
        this.saveTimer = undefined;
        this.saveNow();
      }, 1000);
    }
  }

  saveNow() {
    console.log('Serializing...');
    const data = JSON.stringify({
      pictures: this.pictures.map(pic => pic.serialize())
    });
    console.log('Storing...');
    localStorage.setItem('saved1', data);
    console.log('Done');
  }

  load(data: { pictures: SerializedPicture[] }) {
    console.log("Loading...");
    data.pictures.forEach((d) => this.addPicture(d));
    this.selectPicture(0);
    console.log("Done");
  }

}

function getPoint(e: PointerEvent, canvas: HTMLCanvasElement) {
  return {
    x: e.clientX - canvas.getBoundingClientRect().left,
    y: e.clientY - canvas.getBoundingClientRect().top,
  };
}
