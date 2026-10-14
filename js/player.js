import { getFrame, frameIndexAt } from '../spritesheet.js';

export const ESCALA = 3;

export class Player {
  constructor(canvas) {
    this.px = canvas.width / 2;
    this.py = canvas.height / 2;
    this.dir = 'down';
    this.anim = 'idle';
    this.elapsedMs = 0;
  }

  update(dt) {
    this.elapsedMs += dt;
  }

  draw(ctx, images) {
    const idx = frameIndexAt(this.anim, this.elapsedMs);
    const f = getFrame(this.anim, this.dir, idx);
    const img = images.charizard[this.anim];
    const dx = this.px - f.shadow.x * ESCALA;
    const dy = this.py - f.shadow.y * ESCALA;
    ctx.drawImage(img, f.sx, f.sy, f.sw, f.sh, dx, dy, f.sw * ESCALA, f.sh * ESCALA);
  }
}
