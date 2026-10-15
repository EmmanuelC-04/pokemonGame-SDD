import { CHARIZARD } from '../spritesheet.js';

export const ATAQUE_DANO = 10;
export const PAUSA_TURNO_MS = 300;

function hitTimeMs(anim) {
  const a = CHARIZARD[anim];
  const hit = a.events && a.events.hit;
  if (hit == null) return a.totalMs;
  let t = 0;
  for (let i = 0; i < hit; i++) t += a.durationsMs[i];
  return t;
}

const IMPACTO_ATTACK_MS = hitTimeMs('attack');

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

  startAttack(player, rival) {
    if (this.state !== 'active') return false;
    if (this.phase !== 'playerTurn') return false;
    if (player.hp <= 0 || rival.hp <= 0) return false;
    this.phase = 'playerAttacking';
    this.timer = 0;
    this.damageApplied = false;
    player.anim = 'attack';
    player.elapsedMs = 0;
    return true;
  }

  update(dt, player, rival) {
    if (this.state !== 'active') return;

    if (this.phase === 'playerAttacking') {
      this.timer += dt;

      if (!this.damageApplied && this.timer >= IMPACTO_ATTACK_MS) {
        rival.hp = Math.max(0, rival.hp - ATAQUE_DANO);
        this.damageApplied = true;
      }

      if (this.timer >= CHARIZARD.attack.totalMs) {
        player.anim = 'idle';
        player.elapsedMs = 0;
        this.timer = 0;
        this.damageApplied = false;
        this.phase = rival.hp > 0 ? 'rivalTurn' : 'ended';
      }
      return;
    }

    if (this.phase === 'rivalTurn') {
      this.timer += dt;

      if (this.timer >= PAUSA_TURNO_MS) {
        rival.anim = 'attack';
        rival.elapsedMs = 0;
        this.timer = 0;
        this.damageApplied = false;
        this.phase = 'rivalAttacking';
      }
      return;
    }

    if (this.phase === 'rivalAttacking') {
      this.timer += dt;

      if (!this.damageApplied && this.timer >= IMPACTO_ATTACK_MS) {
        player.hp = Math.max(0, player.hp - ATAQUE_DANO);
        this.damageApplied = true;
        player.anim = 'hurt';
        player.elapsedMs = 0;
      }

      if (player.anim === 'hurt' && player.elapsedMs >= CHARIZARD.hurt.totalMs) {
        player.anim = 'idle';
        player.elapsedMs = 0;
      }

      if (this.timer >= CHARIZARD.attack.totalMs) {
        rival.anim = 'idle';
        rival.elapsedMs = 0;
        this.timer = 0;
        this.damageApplied = false;
        this.phase = (player.hp > 0 && rival.hp > 0) ? 'playerTurn' : 'ended';
      }
      return;
    }
  }
}
