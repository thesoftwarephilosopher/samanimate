import { Picture } from "./picture";

type PictureInfo = {
  index: number;
  picture: Picture;
  thumbnail: HTMLButtonElement;
};

export class Reel {

  picture!: PictureInfo;
  pictures: PictureInfo[] = [];

  animating = false;
  animateTick = this.showNextPicture.bind(this);
  timer: number | undefined;

  constructor(
    private canvasContainer: HTMLDivElement,
    private addThumbnailButton: HTMLButtonElement,
  ) {
    addThumbnailButton.onclick = e => {
      e.preventDefault();
      this.addPicture();
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
    const newPicture = new Picture(this.canvasContainer);

    const index = this.pictures.length;

    const thumbnail = document.createElement('button');
    thumbnail.classList.add('thumbnail');
    thumbnail.innerText = `#${index + 1}`;
    thumbnail.onclick = e => {
      e.preventDefault();
      this.focus(index);
    };

    this.picture = {
      picture: newPicture,
      thumbnail,
      index,
    };

    this.pictures.push(this.picture);

    this.addThumbnailButton.insertAdjacentElement('beforebegin', thumbnail);

    this.focus(index);
  }

  focus(pictureIndex: number) {
    for (let i = 0; i < this.pictures.length; i++) {
      const picture = this.pictures[i]!;

      if (i === pictureIndex) {
        this.picture = picture;
        picture.thumbnail.classList.add('current');
        picture.picture.canvas.hidden = false;
        picture.picture.canvas.classList.remove('under');
      }
      else {
        picture.thumbnail.classList.remove('current');
        if (i === pictureIndex - 1) {
          picture.picture.canvas.classList.toggle('under', !this.animating);
          picture.picture.canvas.hidden = this.animating;
        }
        else {
          picture.picture.canvas.hidden = true;
        }
      }
    }

    console.log('focusing picture', pictureIndex)
  }

}
