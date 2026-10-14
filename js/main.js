import { BACKGROUNDS } from '../spritesheet.js';
import { loadAssets } from './assets.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let assets;

function render() {
  const bg = BACKGROUNDS.fondo1;
  ctx.drawImage(
    assets.backgrounds.fondo1,
    bg.sx, bg.sy, bg.sw, bg.sh,
    0, 0, canvas.width, canvas.height
  );
}

async function start() {
  assets = await loadAssets();
  render();
  console.log('OK — escenario del bosque cargado (Paso 2).');
}

start().catch((err) => console.error(err));
