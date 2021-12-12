import { Reel } from "./reel";

const reel = new Reel(
  document.getElementById('canvas') as HTMLCanvasElement,
  document.getElementById('thumbnails') as HTMLDivElement,
);

const saved = localStorage.getItem('saved1');
if (saved) {
  const data = JSON.parse(saved);
  reel.loadFromLocalStorage(data);
}
else {
  reel.addPicture();
}


document.getElementById('undo-button')!.onclick = e => {
  reel.undo();
};

document.getElementById('redo-button')!.onclick = e => {
  reel.redo();
};

document.getElementById('add-picture')!.onclick = e => {
  reel.addPicture();
};

document.getElementById('new')!.onclick = e => {
  localStorage.removeItem('saved1');
  location.reload();
};

document.getElementById('save')!.onclick = e => {
  reel.saveToFile();
};

document.getElementById('load')!.onclick = e => {
  reel.loadFromFile();
};

document.getElementById('animate')!.onclick = e => {
  toggleActive(e.target as HTMLButtonElement);
  reel.toggleAnimating();
};

reel.stoppedAnimating = () => {
  toggleActive(document.getElementById('animate') as HTMLButtonElement);
};

document.getElementById('record')!.onclick = e => {
  toggleActive(e.target as HTMLButtonElement);
  reel.toggleRecording();
};

persistedElement({
  key: 'loop',
  value: 'checked',
  set: (loops) => { reel.loops = loops },
});

persistedElement({
  key: 'thickness',
  value: 'value',
  set: (thickness) => { reel.thickness = +thickness; },
});

persistedElement({
  key: 'shadows',
  value: 'value',
  set: (shadows) => { reel.shadows = +shadows; },
});

persistedElement({
  key: 'speed',
  value: 'value',
  set: (speed) => { reel.speed = +speed; },
});

function toggleActive(button: HTMLButtonElement) {
  button.classList.toggle('active');
}

function persistedElement<K extends keyof HTMLInputElement>(opts: {
  key: string,
  value: K,
  set: (val: HTMLInputElement[K]) => void,
}) {
  const input = document.getElementById(opts.key) as HTMLInputElement;
  const savedValue = localStorage.getItem(opts.key);
  if (savedValue !== null) {
    input[opts.value] = JSON.parse(savedValue);
    opts.set(input[opts.value]);
  }
  input.oninput = e => {
    localStorage.setItem(opts.key, String(input[opts.value]));
    opts.set(input[opts.value]);
  };
}
