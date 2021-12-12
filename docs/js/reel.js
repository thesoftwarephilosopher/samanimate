import { Line } from "./line.js";
import { Picture } from "./picture.js";
export class Reel {
    constructor(canvas, thumbnailsContainer) {
        this.canvas = canvas;
        this.thumbnailsContainer = thumbnailsContainer;
        this.hasChanges = false;
        this.pictures = [];
        this.animating = false;
        this.shadowDir = -1;
        this._shadows = 3;
        this.thickness = 10;
        this.loops = true;
        this.speed = 10;
        this.ctx = this.canvas.getContext('2d');
        this.canvas.onpointerdown = (e) => {
            this.canvas.setPointerCapture(e.pointerId);
            if (e.buttons === 32) {
                this.startErasing(e);
            }
            else {
                this.startDrawing(e);
            }
        };
    }
    startDrawing(e) {
        const line = new Line(getPoint(e, this.canvas));
        this.picture.addLine(line);
        this.canvas.onpointermove = (e) => {
            line.addPoint(getPoint(e, this.canvas), e.pressure * this.thickness);
            this.hasChanges = true;
            this.redraw();
            this.redrawThumbnail();
        };
        this.handlePointerUp();
    }
    startErasing(e) {
        this.canvas.onpointermove = (e) => {
            const p = getPoint(e, this.canvas);
            const toDelete = this.picture.visibleLines.find(l => l.inStroke(this.ctx, p));
            if (toDelete) {
                this.picture.removeLine(toDelete);
                this.hasChanges = true;
                this.redrawThumbnail();
                this.redraw();
            }
        };
        this.handlePointerUp();
    }
    handlePointerUp() {
        this.canvas.onpointerup = (e) => {
            this.canvas.onpointermove = null;
            this.canvas.onpointerup = null;
            if (this.hasChanges) {
                this.autosaveSoon();
            }
        };
    }
    toggleAnimating() {
        this.animating = !this.animating;
        if (this.animating) {
            this.animateTick(true);
        }
        else {
            if (this.timer !== undefined) {
                clearTimeout(this.timer);
                this.timer = undefined;
            }
            this.selectPicture(this.picture.index);
        }
    }
    animateTick(ignoreLoops) {
        this.timer = undefined;
        let next = this.picture.index + 1;
        if (next == this.pictures.length) {
            if (!this.loops && !ignoreLoops) {
                this.animating = false;
                this.stoppedAnimating();
                return;
            }
            next = 0;
        }
        this.selectPicture(next);
        if (this.animating) {
            this.timer = setTimeout(() => {
                this.animateTick(false);
            }, this.speed);
        }
    }
    addPicture(data) {
        const index = this.pictures.length;
        const thumbnail = document.createElement('canvas');
        thumbnail.width = 120;
        thumbnail.height = 70;
        thumbnail.classList.add('thumbnail');
        thumbnail.onclick = e => {
            e.preventDefault();
            this.selectPicture(index);
        };
        const newPicture = new Picture(index, thumbnail);
        this.picture = newPicture;
        if (this.pictures.length > 0) {
            const firstPicture = this.pictures[this.pictures.length - 1];
            firstPicture.thumbnail.insertAdjacentElement('afterend', thumbnail);
        }
        else {
            this.thumbnailsContainer.insertAdjacentElement('afterbegin', thumbnail);
        }
        this.pictures.push(this.picture);
        if (data) {
            newPicture.load(data);
            newPicture.redrawThumbnail();
        }
        else {
            this.selectPicture(index);
            this.thumbnailsContainer.scrollTo({
                left: this.thumbnailsContainer.clientWidth,
                behavior: 'smooth',
            });
        }
    }
    selectPicture(pictureIndex) {
        for (const picture of this.pictures) {
            picture.thumbnail.classList.remove('current');
        }
        this.picture = this.pictures[pictureIndex];
        this.picture.thumbnail.classList.add('current');
        this.picture.thumbnail.scrollIntoView({ behavior: 'auto' });
        this.redraw();
        console.log('focusing picture', pictureIndex);
    }
    undo() {
        this.picture.undo();
        this.redrawThumbnail();
        this.redraw();
        this.hasChanges = true;
        this.autosaveSoon();
    }
    redo() {
        this.picture.redo();
        this.redrawThumbnail();
        this.redraw();
        this.hasChanges = true;
        this.autosaveSoon();
    }
    redrawThumbnail() {
        this.picture.redrawThumbnail();
    }
    redraw() {
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        if (!this.animating) {
            let start = this.picture.index + (this._shadows * this.shadowDir);
            if (start < 0)
                start = 0;
            if (start >= this.pictures.length)
                start = this.pictures.length - 1;
            const numShadows = Math.abs(this.picture.index - start);
            const GAP = 35;
            const BASE = 255 - (GAP * (numShadows + 1));
            for (let i = start; i !== this.picture.index; i -= this.shadowDir) {
                const picture = this.pictures[i];
                const distance = (this.picture.index - i) * -this.shadowDir;
                const grey = BASE + (distance * GAP);
                const style = '#' + grey.toString(16).padStart(2, '0').repeat(3);
                this.ctx.strokeStyle = style;
                picture.redraw(this.ctx);
            }
        }
        this.ctx.strokeStyle = '#000';
        this.picture.redraw(this.ctx);
    }
    toggleRecording() {
        if (this.rec) {
            this.rec.stop();
            this.rec = undefined;
        }
        else {
            this.rec = new MediaRecorder(this.canvas.captureStream(25));
            const blobParts = [];
            this.rec.ondataavailable = e => {
                blobParts.push(e.data);
            };
            this.rec.onstop = () => {
                const blob = new Blob(blobParts, { type: 'video/mp4' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'drawing.mp4';
                link.click();
            };
            this.rec.start(100);
        }
    }
    set shadows(n) {
        this._shadows = n;
        this.redraw();
    }
    useShadowLeft() {
        this.shadowDir = -1;
        this.redraw();
    }
    useShadowRight() {
        this.shadowDir = 1;
        this.redraw();
    }
    autosaveSoon() {
        if (this.saveTimer === undefined) {
            this.saveTimer = setTimeout(() => {
                this.saveTimer = undefined;
                this.autosave();
            }, 1000 * 10);
        }
    }
    serialize() {
        return JSON.stringify({
            pictures: this.pictures.map(pic => pic.serialize())
        });
    }
    load(data) {
        console.log("Loading...");
        data.pictures.forEach((d) => this.addPicture(d));
        this.selectPicture(0);
        console.log("Done");
    }
    saved() {
        this.hasChanges = false;
    }
}
function getPoint(e, canvas) {
    return {
        x: e.clientX - canvas.getBoundingClientRect().left,
        y: e.clientY - canvas.getBoundingClientRect().top,
    };
}
