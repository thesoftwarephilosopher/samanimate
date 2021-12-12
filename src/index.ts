import { Reel } from "./reel.js";

const reel = new Reel(
  document.getElementById('canvas') as HTMLCanvasElement,
  document.getElementById('thumbnails') as HTMLDivElement,
);

const saved = localStorage.getItem('saved1');
if (saved) {
  const data = JSON.parse(saved);
  reel.load(data);
}
else {
  reel.addPicture();
}

reel.autosave = () => {
  console.log('Autosaving: Start');
  console.log('Autosaving: Serializing...');
  const data = reel.serialize();
  console.log('Autosaving: Storing...');
  localStorage.setItem('saved1', data);
  console.log('Autosaving: Done!');
};

document.getElementById('shadow-left')!.onclick = e => {
  reel.useShadowLeft();
};

document.getElementById('shadow-right')!.onclick = e => {
  reel.useShadowRight();
};

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
  if (reel.hasChanges && !confirm(`Are you sure? You have unsaved changes!`)) return;

  localStorage.removeItem('saved1');
  location.reload();
};

document.getElementById('save')!.onclick = e => {
  const data = reel.serialize();
  const blob = new Blob([data], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'animation.json';
  link.click();
  reel.saved();
};

document.getElementById('load')!.onclick = e => {
  if (reel.hasChanges && !confirm(`Are you sure? You have unsaved changes!`)) return;

  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = false;
  input.accept = 'application/json';
  input.oninput = async () => {
    const file = input.files?.[0];
    const text = await file?.text();
    if (text) {
      localStorage.setItem('saved1', text);
      location.reload();
    }
  };
  input.click();
};

document.getElementById('animate')!.onclick = e => {
  toggleActive(e.target as HTMLButtonElement);
  reel.toggleAnimating();
};

reel.stoppedAnimating = () => {
  toggleActive(document.getElementById('animate') as HTMLButtonElement);
};

let rec: MediaRecorder | undefined;
document.getElementById('record')!.onclick = e => {
  toggleActive(e.target as HTMLButtonElement);

  if (rec) {
    rec.stop();
    rec = undefined;
  }
  else {
    rec = new MediaRecorder(reel.canvas.captureStream(25));
    const blobParts: Blob[] = [];
    rec.ondataavailable = e => {
      blobParts.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(blobParts, { type: 'video/mp4' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'drawing.mp4';
      link.click();
    };
    rec.start(1000 / 25);
  }
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
