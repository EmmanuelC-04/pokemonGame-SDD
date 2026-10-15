import { BACKGROUNDS, CHARIZARD } from '../spritesheet.js';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar: ' + src));
    img.src = src;
  });
}

export async function loadAssets() {
  const [fondo1, fondo2, idle, walk, attack, hurt] = await Promise.all([
    loadImage(BACKGROUNDS.fondo1.src),
    loadImage(BACKGROUNDS.fondo2.src),
    loadImage(CHARIZARD.idle.src.anim),
    loadImage(CHARIZARD.walk.src.anim),
    loadImage(CHARIZARD.attack.src.anim),
    loadImage(CHARIZARD.hurt.src.anim),
  ]);
  return {
    backgrounds: { fondo1, fondo2 },
    charizard: { idle, walk, attack, hurt },
  };
}
