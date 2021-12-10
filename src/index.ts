import { Picture } from "./picture";

const canvasContainer = document.getElementById('canvases') as HTMLDivElement;
const thumbnailContainer = document.getElementById('thumbnails') as HTMLDivElement;


const pic0 = new Picture(canvasContainer);
const ctx2 = pic0.canvas.getContext('2d')!;
ctx2.lineTo(100, 200);
ctx2.lineTo(200, 280);
ctx2.stroke();
pic0.canvas.classList.add('under');




const pic = new Picture(canvasContainer);



document.getElementById('undo-button')!.onclick = e => {
  e.preventDefault();
  pic.lineStack.undo();
};

document.getElementById('redo-button')!.onclick = e => {
  e.preventDefault();
  pic.lineStack.redo();
};
