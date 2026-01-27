export type EnemyType = "BASIC" | "SCOUT" | "BOMBER" | "BOSS";
export type MovementPattern =
  | "STRAIGHT"
  | "WAVE"
  | "ZIGZAG"
  | "CIRCLE"
  | "CHASE"
  | "TELEPORT"
  | "SPIRAL"
  | "DIAGONAL";
export type ObjectiveType =
  | "DESTROY"
  | "SURVIVE"
  | "PROTECT"
  | "COLLECT"
  | "NO_DAMAGE"
  | "COMBO";
export type DialogueTiming = "START" | "MID" | "END";

export interface MissionObjective {
  type: ObjectiveType;
  target: number;
  description: string;
}

export interface WaveEnemy {
  type: EnemyType;
  count: number;
  pattern: MovementPattern;
  spawnDelay: number;
}

export interface Wave {
  enemies: WaveEnemy[];
  spawnInterval: number;
}

export interface Dialogue {
  character: string;
  text: string;
  timing: DialogueTiming;
}

export interface GeneratedMission {
  title: string;
  description: string;
  objectives: MissionObjective[];
  waves: Wave[];
  dialogue: Dialogue[];
}

export interface GenerateMissionRequest {
  difficulty: "Easy" | "Normal" | "Hard";
  theme?: string;
  waveCount: number;
}

export interface TacticalHintRequest {
  playerHealth: number;
  enemyTypes: string[];
  playerWeapon: string;
  waveNumber: number;
}

export interface MissionReportRequest {
  missionName: string;
  outcome: "victory" | "defeat";
  score: number;
  enemiesDefeated: number;
  damageTaken: number;
  previousReports?: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface HealthCheckResponse {
  status: "ok" | "error";
  timestamp: number;
  uptime: number;
  geminiConnected: boolean;
}
