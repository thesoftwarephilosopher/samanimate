import { Picture } from "./picture";

export class Reel {

  currentPicture!: Picture;
  allPictures: Picture[] = [];
  thumbnails: HTMLButtonElement[] = [];

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

    const index = this.allPictures.length;
    this.allPictures.push(this.currentPicture);

    const thumbnail = document.createElement('button');
    thumbnail.classList.add('thumbnail');
    thumbnail.innerText = `#${index + 1}`;
    thumbnail.onclick = e => {
      e.preventDefault();
      this.focus(index);
    };

    this.addThumbnailButton.insertAdjacentElement('beforebegin', thumbnail);
    this.thumbnails.push(thumbnail);

    this.focus(index);

    return this.currentPicture;
  }

  focus(pictureIndex: number) {
    for (let i = 0; i < this.thumbnails.length; i++) {
      const thumbnail = this.thumbnails[i]!;
      thumbnail.classList.toggle('current', pictureIndex === i);
    }

    console.log('focusing picture', pictureIndex)
  }

}
