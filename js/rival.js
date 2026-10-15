import { CHARIZARD, getFrame, frameIndexAt } from '../spritesheet.js';
import { ESCALA } from './player.js';

export class Rival {
  constructor(canvas) {
    this.canvas = canvas;
    this.px = canvas.width * 0.72;
    this.py = canvas.height * 0.55;
    this.dir = 'left';
    this.anim = 'idle';
    this.elapsedMs = 0;
    this.maxHp = 100;
    this.hp = 100;
  }

  playOnce(anim) {
    this.anim = anim;
    this.elapsedMs = 0;
  }

  update(dt) {
    this.elapsedMs += dt;
    if (this.anim !== 'idle' && this.elapsedMs >= CHARIZARD[this.anim].totalMs) {
      this.anim = 'idle';
      this.elapsedMs = 0;
    }
  }

  draw(ctx, images) {
    const idx = frameIndexAt(this.anim, this.elapsedMs, this.anim === 'idle');
    const f = getFrame(this.anim, this.dir, idx);
    const img = images.charizard[this.anim];
    const dx = this.px - f.shadow.x * ESCALA;
    const dy = this.py - f.shadow.y * ESCALA;
    ctx.drawImage(img, f.sx, f.sy, f.sw, f.sh, dx, dy, f.sw * ESCALA, f.sh * ESCALA);
  }
}
