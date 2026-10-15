export const ATAQUE_DANO = 10;
export const PAUSA_TURNO_MS = 300;

export class Battle {
  constructor() {
    this.state = 'idle';
    this.phase = null;
    this.timer = 0;
    this.damageApplied = false;
    this.result = null;
  }

  get active() {
    return this.state === 'active';
  }

  canStart(player, rival) {
    return this.state === 'idle' && player.hp > 0 && rival.hp > 0;
  }

  start() {
    this.state = 'active';
    this.phase = 'playerTurn';
    this.timer = 0;
    this.damageApplied = false;
    this.result = null;
  }
}
