
export enum GameState {
  START = 'START',
  PLANTING = 'PLANTING',
  GROWING = 'GROWING',
  HARVESTING = 'HARVESTING',
  UPGRADE = 'UPGRADE',
  BOSS_FIGHT = 'BOSS_FIGHT',
  FINISHED = 'FINISHED'
}

export enum GestureType {
  NONE = 'NONE',
  OPEN_PALM = 'OPEN_PALM',
  FIST = 'FIST',
  POINTING = 'POINTING',
  VICTORY = 'VICTORY'
}

export interface Insect {
  id: number;
  type: 'Snail' | 'Locust' | 'Spider';
  plotIndex: number;
  health: number;
}

export interface BossData {
  type: string;
  maxHealth: number;
  currentHealth: number;
  emoji: string;
  attackCooldown: number;
}

export interface GameProgress {
  seedsPlanted: number;
  waterLevel: number;
  orangesHarvested: number;
  activeInsects: Insect[];
  boss: BossData | null;
}

export interface PlayerStats {
  level: number;
  totalOranges: number;
  waterMultiplier: number;
  harvestPower: number;
  weaponPower: number;
  isHellMode: boolean;
}
