export type Vector2D = {
  x: number
  y: number
}

export type BoundingBox = {
  x: number
  y: number
  width: number
  height: number
}

export type WeaponType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'SPREAD' | 'CANNON'

export type EnemyType = 'BASIC' | 'SCOUT' | 'BOMBER' | 'BOSS'

export type PowerUpType = 'HEALTH' | 'WEAPON' | 'SHIELD' | 'SPEED' | 'SCORE'

export type MovementPattern =
  | 'STRAIGHT'
  | 'WAVE'
  | 'ZIGZAG'
  | 'CIRCLE'
  | 'CHASE'
  | 'TELEPORT'
  | 'SPIRAL'
  | 'DIAGONAL'

export type GameDifficulty = 'Easy' | 'Normal' | 'Hard'

export type Bullet = {
  id: string
  x: number
  y: number
  width: number
  height: number
  speed: number
  damage: number
  active: boolean
  owner: 'PLAYER' | 'ENEMY'
  type?: string
  vx?: number
  vy?: number
}

export type Enemy = {
  id: string
  type: EnemyType
  x: number
  y: number
  width: number
  height: number
  health: number
  maxHealth: number
  speed: number
  pattern: MovementPattern
  active: boolean
  shootInterval: number
  lastShot: number
  scoreValue: number
  patternData?: {
    amplitude?: number
    frequency?: number
    startX?: number
    startY?: number
    angle?: number
    radius?: number
    opacity?: number
    scale?: number
    teleportState?: {
      isTeleporting: boolean
      teleportProgress: number
      targetX: number
      targetY: number
      portalEffect: boolean
      lastTeleport: number
      teleportCooldown: number
    }
  }
}

export type PowerUp = {
  id: string
  type: PowerUpType
  x: number
  y: number
  width: number
  height: number
  speed: number
  active: boolean
  value: number
}

export type PlayerStats = {
  health: number
  maxHealth: number
  lives: number
  speed: number
  fireRate: number
  weaponType: WeaponType
  shieldActive: boolean
  invincible: boolean
  invincibleUntil: number
}

export type Wave = {
  id: number
  enemies: Array<{
    type: EnemyType
    count: number
    spawnDelay: number
    pattern: MovementPattern
  }>
  spawnInterval: number
  completed: boolean
}

export type GameSessionState = {
  playing: boolean
  score: number
  currentWave: number
  enemiesDefeated: number
  bulletsShot: number
  accuracy: number
  timeElapsed: number
  comboMultiplier: number
  comboTimer: number
}

export type HighScore = {
  name: string
  score: number
  wave: number
  difficulty: GameDifficulty
  date: number
  mode: 'QUICK_PLAY' | 'STORY_MODE'
}

export type MissionStars = 0 | 1 | 2 | 3 | number

export type StoryMission = {
  id: number
  title: string
  description: string
  unlocked: boolean
  completed: boolean
  stars?: MissionStars
  objectives: Array<{
    type: 'DESTROY' | 'SURVIVE' | 'PROTECT' | 'COLLECT' | 'NO_DAMAGE' | 'COMBO'
    target: number
    current: number
    description: string
  }>
  waves: Wave[]
  dialogue?: Array<{
    character: string
    text: string
    timing: 'START' | 'MID' | 'END'
  }>
  hasBoss: boolean
  bossConfig?: BossConfig
  rewards?: {
    unlockWeapon?: WeaponType
    scoreMultiplier?: number
    bonusPoints?: number
  }
}

export type BossConfig = {
  type: EnemyType
  health: number
  phases: Array<{
    healthThreshold: number
    pattern: MovementPattern
    attackPattern: string
    speed: number
  }>
  scoreValue: number
}

export type SaveGame = {
  playerProgress: {
    storyMissions: StoryMission[]
    unlockedWeapons: WeaponType[]
    totalScore: number
    achievements: string[]
  }
  settings: GameSettings
  highScores: {
    quickPlay: HighScore[]
    storyMode: HighScore[]
  }
  lastPlayed: number
}

export type GameSettings = {
  volume: {
    master: number
    music: number
    sfx: number
  }
  difficulty: GameDifficulty
  keyBindings: {
    up: string
    down: string
    left: string
    right: string
    shoot: string
    special: string
    pause: string
  }
  graphics: {
    particles: boolean
    screenShake: boolean
    showFPS: boolean
  }
}

export type CollisionResult = {
  collided: boolean
  objects: Array<{ id: string; type: string }>
}

export type GameEvent = {
  type:
    | 'ENEMY_DESTROYED'
    | 'PLAYER_HIT'
    | 'POWERUP_COLLECTED'
    | 'WAVE_COMPLETE'
    | 'BOSS_DEFEATED'
    | 'GAME_OVER'
    | 'ENEMY_SPAWNED'
  data?: any
  timestamp: number
}

export type WaveTemplate = {
  id: number
  spawnInterval: number
  enemies: ReadonlyArray<{
    type: EnemyType
    count: number
    spawnDelay: number
    pattern: MovementPattern
  }>
}

export type WaveInstance = {
  id: number
  enemies: {
    type: EnemyType
    count: number
    spawnDelay: number
    pattern: MovementPattern
  }[]
  spawnInterval: number
  completed: boolean
}
