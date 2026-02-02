import type {
  EnemyType,
  WeaponType,
  PowerUpType,
  GameDifficulty,
  WaveTemplate
} from '../types/gameTypes'

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
      WIDTH: 6, // Reduced from 10
      HEIGHT: 20, // Reduced from 30
      SPEED: 12, // Slightly faster
      DAMAGE: 15
    },
    ENEMY: {
      WIDTH: 5, // Reduced from 8
      HEIGHT: 15, // Reduced from 20
      SPEED: 6,
      DAMAGE: 10
    },
    CANNON: {
      WIDTH: 12,
      HEIGHT: 25,
      SPEED: 8,
      DAMAGE: 30
    }
  },

  COMBO: {
    TIMEOUT: 3000,
    MULTIPLIERS: [1, 1.5, 2, 2.5, 3, 4, 5]
  },

  POOL_SIZES: {
    BULLETS: 100,
    ENEMIES: 50,
    PARTICLES: 200,
    POWERUPS: 20
  },

  POWERUP: {
    DURATION: {
      WEAPON: 15000,
      SHIELD: 10000,
      SPEED: 8000
    }
  }
} as const

export const ENEMY_CONFIG: Record<
  EnemyType,
  {
    width: number
    height: number
    health: number
    speed: number
    scoreValue: number
    shootInterval: number
    sprite: string
  }
> = {
  BASIC: {
    width: 80,
    height: 80,
    health: 30,
    speed: 2,
    scoreValue: 100,
    shootInterval: 2000,
    sprite: 'assets/sprites/enemy-basic.png'
  },
  SCOUT: {
    width: 60,
    height: 60,
    health: 15,
    speed: 4,
    scoreValue: 150,
    shootInterval: 1500,
    sprite: 'assets/sprites/enemy-scout.png'
  },
  BOMBER: {
    width: 120,
    height: 120,
    health: 80,
    speed: 1,
    scoreValue: 300,
    shootInterval: 3000,
    sprite: 'assets/sprites/enemy-bomber.png'
  },
  BOSS: {
    width: 250,
    height: 250,
    health: 2000,
    speed: 1.5,
    scoreValue: 2000,
    shootInterval: 800,
    sprite: 'assets/sprites/boss-1.png'
  }
}

export const WEAPON_CONFIG: Record<
  WeaponType,
  {
    bulletCount: number
    spread: number
    fireRate: number
    damage: number
    bulletType?: 'normal' | 'cannon'
  }
> = {
  SINGLE: {
    bulletCount: 1,
    spread: 0,
    fireRate: 150,
    damage: 10
  },
  DOUBLE: {
    bulletCount: 2,
    spread: 40,
    fireRate: 150,
    damage: 10
  },
  TRIPLE: {
    bulletCount: 3,
    spread: 30,
    fireRate: 200,
    damage: 8
  },
  SPREAD: {
    bulletCount: 5,
    spread: 20,
    fireRate: 300,
    damage: 6
  },
  CANNON: {
    bulletCount: 1,
    spread: 0,
    fireRate: 400,
    damage: 30,
    bulletType: 'cannon'
  }
}

export const POWERUP_CONFIG: Record<
  PowerUpType,
  {
    width: number
    height: number
    speed: number
    value: number
    duration?: number
    sprite: string
  }
> = {
  HEALTH: {
    width: 40,
    height: 40,
    speed: 2,
    value: 30,
    sprite: 'assets/sprites/powerup-health.png'
  },
  WEAPON: {
    width: 40,
    height: 40,
    speed: 2,
    value: 0,
    duration: 15000,
    sprite: 'assets/sprites/powerup-weapon.png'
  },
  SHIELD: {
    width: 40,
    height: 40,
    speed: 2,
    value: 0,
    duration: 10000,
    sprite: 'assets/sprites/powerup-shield.png'
  },
  SPEED: {
    width: 40,
    height: 40,
    speed: 2,
    value: 1.5,
    duration: 8000,
    sprite: 'assets/sprites/powerup-speed.png'
  },
  SCORE: {
    width: 40,
    height: 40,
    speed: 2,
    value: 500,
    sprite: 'assets/sprites/powerup-score.png'
  }
}

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

export const WAVE_TEMPLATES: readonly WaveTemplate[] = [
  {
    id: 0,
    enemies: [
      { type: 'BASIC' as EnemyType, count: 5, spawnDelay: 500, pattern: 'STRAIGHT' as const }
    ],
    spawnInterval: 1000
  },
  {
    id: 1,
    enemies: [
      { type: 'BASIC' as EnemyType, count: 4, spawnDelay: 400, pattern: 'WAVE' as const },
      { type: 'SCOUT' as EnemyType, count: 2, spawnDelay: 600, pattern: 'ZIGZAG' as const }
    ],
    spawnInterval: 900
  },
  {
    id: 2,
    enemies: [
      { type: 'SCOUT' as EnemyType, count: 6, spawnDelay: 300, pattern: 'WAVE' as const },
      { type: 'BASIC' as EnemyType, count: 3, spawnDelay: 500, pattern: 'STRAIGHT' as const }
    ],
    spawnInterval: 800
  },
  {
    id: 3,
    enemies: [
      { type: 'BOMBER' as EnemyType, count: 2, spawnDelay: 1000, pattern: 'STRAIGHT' as const },
      { type: 'SCOUT' as EnemyType, count: 4, spawnDelay: 400, pattern: 'CIRCLE' as const }
    ],
    spawnInterval: 700
  },
  {
    id: 4,
    enemies: [{ type: 'BOSS' as EnemyType, count: 1, spawnDelay: 0, pattern: 'CIRCLE' as const }],
    spawnInterval: 600
  }
] as const

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
  PLAYER_SHOOT: 'assets/sounds/shoot1.mp3',
  ENEMY_SHOOT: 'assets/sounds/enemy-shoot.mp3',
  EXPLOSION_SMALL: 'assets/sounds/explosion-1.mp3',
  EXPLOSION_MEDIUM: 'assets/sounds/explosion-2.mp3',
  EXPLOSION_LARGE: 'assets/sounds/explosion-3.mp3',
  PLAYER_HIT: 'assets/sounds/player-hit.mp3',
  POWERUP: 'assets/sounds/powerup.mp3',
  BOSS_WARNING: 'assets/sounds/boss-warning.mp3',
  BOSS_BATTLE: 'assets/sounds/boss-battle.mp3',
  VICTORY: 'assets/sounds/victory.mp3',
  GAME_OVER: 'assets/sounds/game-over.mp3',
  MENU_CLICK: 'assets/sounds/sound1.mp3',
  FLY_OVER: 'assets/sounds/fly.mp3',
  BG_MUSIC: 'assets/sounds/bg1.mp3'
}
