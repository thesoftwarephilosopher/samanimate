import { Reel } from "./reel";

const reel = new Reel(
  document.getElementById('canvas') as HTMLCanvasElement,
  document.getElementById('thumbnails') as HTMLDivElement,
);

reel.addPicture();

document.getElementById('undo-button')!.onclick = e => {
  e.preventDefault();
  reel.undo();
};

document.getElementById('redo-button')!.onclick = e => {
  e.preventDefault();
  reel.redo();
};

document.getElementById('animate')!.onclick = e => {
  e.preventDefault();
  reel.toggleAnimating();
};

document.getElementById('add-picture')!.onclick = e => {
  e.preventDefault();
  reel.addPicture();
};

document.getElementById('save-animation')!.onclick = e => {
  e.preventDefault();
  reel.animateAndSave();
};
