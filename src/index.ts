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
  toggleStartStop(e.target as HTMLButtonElement);
  reel.toggleAnimating();
};

document.getElementById('record')!.onclick = e => {
  toggleStartStop(e.target as HTMLButtonElement);
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
  key: 'speed',
  value: 'value',
  set: (speed) => { reel.speed = +speed; },
});

function toggleStartStop(button: HTMLButtonElement) {
  if (button.innerText.includes('Start')) {
    button.innerText = button.innerText.replace('Start', 'Stop');
    button.classList.toggle('active');
  }
  else {
    button.innerText = button.innerText.replace('Stop', 'Start');
    button.classList.toggle('active');
  }
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
