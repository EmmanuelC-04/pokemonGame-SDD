import { BACKGROUNDS } from '../spritesheet.js';
import { loadAssets } from './assets.js';
import { Player } from './player.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const MAX_DT = 100;
const FADE_MS = 1000;

let assets;
let player;
let lastTime = 0;

let escenarioActual = 'fondo1';
let escenarioDestino = 'fondo2';
let enTransicion = false;
let progreso = 0;

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bgActual = BACKGROUNDS[escenarioActual];
  ctx.globalAlpha = 1;
  ctx.drawImage(
    assets.backgrounds[escenarioActual],
    bgActual.sx, bgActual.sy, bgActual.sw, bgActual.sh,
    0, 0, canvas.width, canvas.height
  );

  if (enTransicion) {
    const bgDestino = BACKGROUNDS[escenarioDestino];
    ctx.globalAlpha = progreso;
    ctx.drawImage(
      assets.backgrounds[escenarioDestino],
      bgDestino.sx, bgDestino.sy, bgDestino.sw, bgDestino.sh,
      0, 0, canvas.width, canvas.height
    );
    ctx.globalAlpha = 1;
  }

  player.draw(ctx, assets);
}

function loop(now) {
  const dt = lastTime ? Math.min(now - lastTime, MAX_DT) : 0;
  lastTime = now;
  player.update(dt);

  if (enTransicion) {
    progreso = Math.min(1, progreso + dt / FADE_MS);
    if (progreso >= 1) {
      escenarioActual = escenarioDestino;
      escenarioDestino = escenarioActual === 'fondo1' ? 'fondo2' : 'fondo1';
      enTransicion = false;
      progreso = 0;
    }
  }

  render();
  requestAnimationFrame(loop);
}

async function start() {
  assets = await loadAssets();
  player = new Player(canvas);

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyE') {
      if (!e.repeat && !enTransicion) {
        enTransicion = true;
        progreso = 0;
      }
      return;
    }
    if (e.code.startsWith('Arrow')) e.preventDefault();
    player.press(e.code);
  });
  window.addEventListener('keyup', (e) => {
    player.release(e.code);
  });
  window.addEventListener('blur', () => {
    player.clearKeys();
  });

  console.log('OK — transición de escenarios con E (Paso 5).');
  requestAnimationFrame(loop);
}

start().catch((err) => console.error(err));
