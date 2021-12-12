import { Reel } from "./reel.js";
const reel = new Reel(document.getElementById('canvas'), document.getElementById('thumbnails'));
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
document.getElementById('undo-button').onclick = e => {
    reel.undo();
};
document.getElementById('redo-button').onclick = e => {
    reel.redo();
};
document.getElementById('add-picture').onclick = e => {
    reel.addPicture();
};
document.getElementById('new').onclick = e => {
    if (reel.hasChanges && !confirm(`Are you sure? You have unsaved changes!`))
        return;
    localStorage.removeItem('saved1');
    location.reload();
};
document.getElementById('save').onclick = e => {
    const data = reel.serialize();
    const blob = new Blob([data], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'animation.json';
    link.click();
    reel.saved();
};
document.getElementById('load').onclick = e => {
    if (reel.hasChanges && !confirm(`Are you sure? You have unsaved changes!`))
        return;
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
document.getElementById('animate').onclick = e => {
    toggleActive(e.target);
    reel.toggleAnimating();
};
reel.stoppedAnimating = () => {
    toggleActive(document.getElementById('animate'));
};
document.getElementById('record').onclick = e => {
    toggleActive(e.target);
    reel.toggleRecording();
};
persistedElement({
    key: 'loop',
    value: 'checked',
    set: (loops) => { reel.loops = loops; },
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
function toggleActive(button) {
    button.classList.toggle('active');
}
function persistedElement(opts) {
    const input = document.getElementById(opts.key);
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
