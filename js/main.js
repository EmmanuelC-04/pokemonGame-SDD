const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function render() {
  ctx.fillStyle = '#1a3a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

render();
console.log('OK — canvas 960x540 y contexto 2D listos (Paso 1).');
