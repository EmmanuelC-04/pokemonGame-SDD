import { getFrame, frameIndexAt } from '../spritesheet.js';

export const ESCALA = 3;
const VELOCIDAD = 150; // px por segundo

const MAPA_TECLAS = {
  ArrowUp: 'up',     KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

const DIRECCIONES = {
  '-1,0': 'left', '1,0': 'right', '0,-1': 'up', '0,1': 'down',
  '1,-1': 'upRight', '-1,-1': 'upLeft', '1,1': 'downRight', '-1,1': 'downLeft',
};

export class Player {
  constructor(canvas) {
    this.canvas = canvas;
    this.px = canvas.width / 2;
    this.py = canvas.height / 2;
    this.dir = 'down';
    this.anim = 'idle';
    this.elapsedMs = 0;
    this.keys = new Set();
    this.maxHp = 100;
    this.hp = 100;
    this.controlLocked = false;
  }

  press(code) {
    const d = MAPA_TECLAS[code];
    if (d) this.keys.add(d);
  }

  release(code) {
    const d = MAPA_TECLAS[code];
    if (d) this.keys.delete(d);
  }

  clearKeys() {
    this.keys.clear();
  }

  update(dt) {
    if (this.controlLocked) {
      this.elapsedMs += dt;
      return;
    }

    if (this.hp <= 0) {
      if (this.anim !== 'idle') this.elapsedMs = 0;
      this.anim = 'idle';
      this.dir = 'down';
      this.elapsedMs += dt;
      this.limitar();
      return;
    }

    let vx = 0, vy = 0;
    for (const d of this.keys) {
      if (d === 'up') vy -= 1;
      if (d === 'down') vy += 1;
      if (d === 'left') vx -= 1;
      if (d === 'right') vx += 1;
    }

    if (vx === 0 && vy === 0) {
      this.anim = 'idle';
      this.dir = 'down';
      this.elapsedMs += dt;
    } else {
      if (vx !== 0 && vy !== 0) {
        vx *= Math.SQRT1_2;
        vy *= Math.SQRT1_2;
      }
      this.dir = DIRECCIONES[Math.sign(vx) + ',' + Math.sign(vy)];
      if (this.anim !== 'walk') this.elapsedMs = 0;
      this.anim = 'walk';
      const paso = VELOCIDAD * (dt / 1000);
      this.px += vx * paso;
      this.py += vy * paso;
      this.elapsedMs += dt;
    }

    this.limitar();
  }

  limitar() {
    const f = getFrame(this.anim, this.dir, frameIndexAt(this.anim, this.elapsedMs));
    const s = ESCALA;
    const minX = f.shadow.x * s;
    const maxX = this.canvas.width - (f.sw - f.shadow.x) * s;
    const minY = f.shadow.y * s;
    const maxY = this.canvas.height - (f.sh - f.shadow.y) * s;
    this.px = Math.min(Math.max(this.px, minX), maxX);
    this.py = Math.min(Math.max(this.py, minY), maxY);
  }

  draw(ctx, images) {
    const loop = this.anim === 'idle' || this.anim === 'walk';
    const idx = frameIndexAt(this.anim, this.elapsedMs, loop);
    const f = getFrame(this.anim, this.dir, idx);
    const img = images.charizard[this.anim];
    const dx = this.px - f.shadow.x * ESCALA;
    const dy = this.py - f.shadow.y * ESCALA;
    ctx.drawImage(img, f.sx, f.sy, f.sw, f.sh, dx, dy, f.sw * ESCALA, f.sh * ESCALA);
  }
}
