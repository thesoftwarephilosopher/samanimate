import { Reel } from "./reel";

const reel = new Reel(
  document.getElementById('canvas') as HTMLCanvasElement,
  document.getElementById('thumbnails') as HTMLDivElement,
);

reel.addPicture();

document.getElementById('undo-button')!.onclick = e => {
  reel.undo();
};

document.getElementById('redo-button')!.onclick = e => {
  reel.redo();
};

document.getElementById('add-picture')!.onclick = e => {
  reel.addPicture();
};

document.getElementById('animate')!.onclick = e => {
  toggleStartStop(e.target as any);
  reel.toggleAnimating();
};

document.getElementById('record')!.onclick = e => {
  toggleStartStop(e.target as any);
  reel.toggleRecording();
};

const thicknessSlider = document.getElementById('thickness') as HTMLInputElement;
const savedThickness = localStorage.getItem('thickness');
if (savedThickness) {
  thicknessSlider.value = savedThickness;
  reel.setThickness(+savedThickness);
}
document.getElementById('thickness')!.oninput = e => {
  reel.setThickness(+thicknessSlider.value);
  localStorage.setItem('thickness', thicknessSlider.value);
};

function toggleStartStop(button: HTMLButtonElement) {
  if (button.innerText.includes('Start')) {
    button.innerText = button.innerText.replace('Start', 'Stop');
  }
  else {
    button.innerText = button.innerText.replace('Stop', 'Start');
  }
}
