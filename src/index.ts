import { Reel } from "./reel";

const canvasContainer = document.getElementById('canvases') as HTMLDivElement;
const addThumbnailButton = document.getElementById('add-picture') as HTMLButtonElement;

const reel = new Reel(canvasContainer, addThumbnailButton);

reel.addPicture();

document.getElementById('undo-button')!.onclick = e => {
  e.preventDefault();
  reel.picture.picture.lineStack.undo();
};

document.getElementById('animate')!.onclick = e => {
  e.preventDefault();
  reel.toggleAnimating();
};

document.getElementById('redo-button')!.onclick = e => {
  e.preventDefault();
  reel.picture.picture.lineStack.redo();
};
