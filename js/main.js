import { BACKGROUNDS } from '../spritesheet.js';
import { loadAssets } from './assets.js';
import { Player } from './player.js';
import { Rival } from './rival.js';
import { Battle } from './battle.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const MAX_DT = 100;
const FADE_MS = 1000;

let assets;
let player;
let rival;
let battle;
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
  rival.draw(ctx, assets);
  drawHealthBar(16, 16, player);
  drawHealthBar(canvas.width - 16, 16, rival, true);
  drawBanner();
}

function drawBanner() {
  if (battle.state !== 'finished') return;
  const texto = battle.result === 'win' ? '¡Victoria!' : '¡Derrota!';
  const x = canvas.width / 2;
  const y = canvas.height / 2;
  const w = 360;
  const h = 90;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.strokeRect(x - w / 2, y - h / 2, w, h);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, x, y);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = 1;
}

function drawHealthBar(x, y, combatiente, alinearDerecha = false) {
  const w = 120;
  const h = 10;
  const ratio = combatiente.maxHp > 0
    ? Math.min(1, Math.max(0, combatiente.hp / combatiente.maxHp))
    : 0;
  const barX = alinearDerecha ? x - w : x;
  const panelX = barX - 6;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(panelX, y - 6, w + 12, h + 28);

  ctx.fillStyle = '#222';
  ctx.fillRect(barX, y, w, h);

  ctx.fillStyle = ratio > 0.5 ? '#4caf50' : ratio > 0.25 ? '#ffb74d' : '#f44336';
  ctx.fillRect(barX, y, w * ratio, h);

  ctx.strokeStyle = '#000';
  ctx.strokeRect(barX, y, w, h);

  ctx.fillStyle = '#fff';
  ctx.font = '10px sans-serif';
  ctx.textAlign = alinearDerecha ? 'right' : 'left';
  ctx.fillText(`HP: ${combatiente.hp}/${combatiente.maxHp}`, x, y + h + 12);
  ctx.textAlign = 'left';
}

function loop(now) {
  const dt = lastTime ? Math.min(now - lastTime, MAX_DT) : 0;
  lastTime = now;
  player.update(dt);
  rival.update(dt);
  battle.update(dt, player, rival);

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
  rival = new Rival(canvas);
  battle = new Battle();

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyB') {
      if (!e.repeat && battle.canStart(player, rival)) {
        battle.start();
        player.controlLocked = true;
        player.anim = 'idle';
        player.elapsedMs = 0;
        player.clearKeys();
      }
      return;
    }
    if (e.code === 'KeyJ') {
      if (!e.repeat) battle.startAttack(player, rival);
      return;
    }
    if (battle.active) {
      if (e.code.startsWith('Arrow')) e.preventDefault();
      return;
    }
    if (e.code === 'KeyE') {
      if (!e.repeat && !enTransicion) {
        enTransicion = true;
        progreso = 0;
      }
      return;
    }
    if (e.code === 'KeyH') {
      if (!e.repeat && player.hp > 0) {
        player.hp = Math.max(0, player.hp - 10);
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
