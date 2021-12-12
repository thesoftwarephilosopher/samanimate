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

const autosaveNow = () => {
  console.log('Autosaving: Start');
  console.log('Autosaving: Serializing...');
  const data = reel.serialize();
  console.log('Autosaving: Storing...');
  localStorage.setItem('saved1', data);
  console.log('Autosaving: Done!');
};

let saveTimer: number | undefined;
reel.autosave = () => {
  if (saveTimer === undefined) {
    saveTimer = setTimeout(() => {
      saveTimer = undefined;
      autosaveNow();
    }, 1000 * 10);
  }
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
  (e.target as HTMLButtonElement).classList.toggle('active');
  reel.toggleAnimating();
};

reel.stoppedAnimating = () => {
  document.getElementById('animate')!.classList.toggle('active');
};

let rec: MediaRecorder | undefined;
document.getElementById('record')!.onclick = e => {
  (e.target as HTMLButtonElement).classList.toggle('active');

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

persistElement(document.getElementById('loop') as HTMLInputElement, {
  value: 'checked',
  set: (loops) => { reel.loops = loops },
});

persistElement(document.getElementById('thickness') as HTMLInputElement, {
  value: 'value',
  set: (thickness) => { reel.thickness = +thickness; },
});

persistElement(document.getElementById('shadows') as HTMLInputElement, {
  value: 'value',
  set: (shadows) => { reel.shadows = +shadows; },
});

persistElement(document.getElementById('speed') as HTMLInputElement, {
  value: 'value',
  set: (speed) => { reel.speed = +speed; },
});

function persistElement<E extends HTMLInputElement, K extends keyof E>(input: E, opts: {
  value: K,
  set: (val: E[K]) => void,
}) {
  const savedValue = localStorage.getItem(input.id);
  if (savedValue !== null) {
    input[opts.value] = JSON.parse(savedValue);
    opts.set(input[opts.value]);
  }
  input.oninput = e => {
    localStorage.setItem(input.id, String(input[opts.value]));
    opts.set(input[opts.value]);
  };
}

document.getElementById('root')!.style.display = 'grid';
