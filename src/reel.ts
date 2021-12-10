import { Picture } from "./picture";

export class Reel {

  currentPicture!: Picture;
  pictures: {
    picture: Picture,
    thumbnail: HTMLButtonElement,
  }[] = [];

  constructor(
    private canvasContainer: HTMLDivElement,
    private addThumbnailButton: HTMLButtonElement,
  ) {
    addThumbnailButton.onclick = e => {
      e.preventDefault();
      this.addPicture();
    };
  }

  addPicture() {
    this.currentPicture = new Picture(this.canvasContainer);

    const index = this.pictures.length;

    const thumbnail = document.createElement('button');
    thumbnail.classList.add('thumbnail');
    thumbnail.innerText = `#${index + 1}`;
    thumbnail.onclick = e => {
      e.preventDefault();
      this.focus(index);
    };

    this.pictures.push({
      picture: this.currentPicture,
      thumbnail,
    });

    this.addThumbnailButton.insertAdjacentElement('beforebegin', thumbnail);

    this.focus(index);

    return this.currentPicture;
  }

  focus(pictureIndex: number) {
    for (let i = 0; i < this.pictures.length; i++) {
      const item = this.pictures[i]!;

      if (i === pictureIndex) {
        item.thumbnail.classList.add('current');
        item.picture.canvas.hidden = false;
        item.picture.canvas.classList.remove('under');
      }
      else {
        item.thumbnail.classList.remove('current');
        if (i === pictureIndex - 1) {
          item.picture.canvas.classList.add('under');
          item.picture.canvas.hidden = false;
        }
        else {
          item.picture.canvas.hidden = true;
        }
      }
    }

    console.log('focusing picture', pictureIndex)
  }

}
