import type { GameDifficulty } from '$lib/types/gameTypes'

export const GAME_CONFIG = {
  FPS: 60,
  FRAME_TIME: 1000 / 60,

  CANVAS: {
    MIN_WIDTH: 640,
    MIN_HEIGHT: 540,
    PREFERRED_WIDTH: 900,
    PREFERRED_HEIGHT: 670
  },

  PLAYER: {
    WIDTH: 150,
    HEIGHT: 150,
    SPEED: 20,
    FIRE_RATE: 150,
    MAX_HEALTH: 100,
    MAX_LIVES: 3,
    INVINCIBILITY_DURATION: 2000,
    RESPAWN_DELAY: 1500
  },

  BULLET: {
    PLAYER: {
      WIDTH: 10,
      HEIGHT: 30,
      SPEED: 10,
      DAMAGE: 15
    },
    ENEMY: {
      WIDTH: 8,
      HEIGHT: 20,
      SPEED: 6,
      DAMAGE: 10
    }
  },

  COMBO: {
    TIMEOUT: 3000,
    MULTIPLIERS: [1, 1.5, 2, 2.5, 3, 4, 5]
  },

  POOL_SIZES: {
    BULLETS: 320,
    ENEMIES: 50,
    PARTICLES: 640,
    POWERUPS: 20
  },

  LIMITS: {
    PLAYER_BULLETS: 120,
    ENEMY_BULLETS: 180,
    BOSS_BULLETS_PER_VOLLEY: 7,
    PARTICLES: 640
  }
} as const

export const DIFFICULTY_MODIFIERS: Record<
  GameDifficulty,
  {
    enemyHealthMultiplier: number
    enemySpeedMultiplier: number
    enemyDamageMultiplier: number
    enemyCountMultiplier: number
    scoreMultiplier: number
    powerUpSpawnRate: number
  }
> = {
  Easy: {
    enemyHealthMultiplier: 0.7,
    enemySpeedMultiplier: 0.8,
    enemyDamageMultiplier: 0.7,
    enemyCountMultiplier: 0.8,
    scoreMultiplier: 0.8,
    powerUpSpawnRate: 0.3
  },

  Normal: {
    enemyHealthMultiplier: 1.0,
    enemySpeedMultiplier: 1.0,
    enemyDamageMultiplier: 1.0,
    enemyCountMultiplier: 1.0,
    scoreMultiplier: 1.0,
    powerUpSpawnRate: 0.2
  },

  Hard: {
    enemyHealthMultiplier: 1.5,
    enemySpeedMultiplier: 1.3,
    enemyDamageMultiplier: 1.5,
    enemyCountMultiplier: 1.3,
    scoreMultiplier: 1.5,
    powerUpSpawnRate: 0.1
  }
}

export const DEFAULT_KEY_BINDINGS = {
  up: 'w',
  down: 's',
  left: 'a',
  right: 'd',
  shoot: ' ',
  special: 'Shift',
  pause: 'Escape'
}

export const SCORE_VALUES = {
  ENEMY_DESTROYED: 100,
  WAVE_COMPLETE: 500,
  BOSS_DEFEATED: 5000,
  PERFECT_WAVE: 1000,
  NO_DAMAGE_BONUS: 500
}

export const SOUNDS = {
  PLAYER_SHOOT: '$lib/assets/sounds/shoot1.mp3',
  ENEMY_SHOOT: '$lib/assets/sounds/enemy-shoot.mp3',
  EXPLOSION_SMALL: '$lib/assets/sounds/explosion-1.mp3',
  EXPLOSION_MEDIUM: '$lib/assets/sounds/explosion-2.mp3',
  EXPLOSION_LARGE: '$lib/assets/sounds/explosion-3.mp3',
  PLAYER_HIT: '$lib/assets/sounds/player-hit.mp3',
  POWERUP: '$lib/assets/sounds/powerup.mp3',
  BOSS_WARNING: '$lib/assets/sounds/boss-warning.mp3',
  BOSS_BATTLE: '$lib/assets/sounds/boss-battle.mp3',
  VICTORY: '$lib/assets/sounds/victory.mp3',
  GAME_OVER: '$lib/assets/sounds/game-over.mp3',
  MENU_CLICK: '$lib/assets/sounds/sound1.mp3',
  FLY_OVER: '$lib/assets/sounds/fly.mp3',
  BG_MUSIC: '$lib/assets/sounds/bg1.mp3'
}

export {
  BOSS_ATTACK_PRESETS,
  ENEMY_CONFIG,
  POWERUP_CONFIG,
  WAVE_TEMPLATES,
  WEAPON_CONFIG
} from '$lib/game/presets'
