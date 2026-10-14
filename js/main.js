import { BACKGROUNDS } from '../spritesheet.js';
import { loadAssets } from './assets.js';
import { Player } from './player.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const MAX_DT = 100;

let assets;
let player;
let lastTime = 0;

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bg = BACKGROUNDS.fondo1;
  ctx.drawImage(
    assets.backgrounds.fondo1,
    bg.sx, bg.sy, bg.sw, bg.sh,
    0, 0, canvas.width, canvas.height
  );

  player.draw(ctx, assets);
}

function loop(now) {
  const dt = lastTime ? Math.min(now - lastTime, MAX_DT) : 0;
  lastTime = now;
  player.update(dt);
  render();
  requestAnimationFrame(loop);
}

async function start() {
  assets = await loadAssets();
  player = new Player(canvas);
  console.log('OK — Charizard en idle sobre el bosque (Paso 3).');
  requestAnimationFrame(loop);
}

start().catch((err) => console.error(err));
