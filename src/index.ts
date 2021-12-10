import { Reel } from "./reel";

const canvasContainer = document.getElementById('canvases') as HTMLDivElement;
// const thumbnailContainer = document.getElementById('thumbnails') as HTMLDivElement;
const addThumbnailButton = document.getElementById('add-picture') as HTMLButtonElement;

const reel = new Reel(canvasContainer, addThumbnailButton);

{ // for testing
  const pic0 = reel.addPicture();
  const ctx2 = pic0.canvas.getContext('2d')!;
  ctx2.lineTo(100, 200);
  ctx2.lineTo(200, 280);
  ctx2.stroke();
}

reel.addPicture();

document.getElementById('undo-button')!.onclick = e => {
  e.preventDefault();
  reel.currentPicture.lineStack.undo();
};

document.getElementById('redo-button')!.onclick = e => {
  e.preventDefault();
  reel.currentPicture.lineStack.redo();
};
