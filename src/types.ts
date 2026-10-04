export type Era = 'ANCIENT' | 'MODERN';

export type Faction = 'PLAYER' | 'ENEMY';

export type TerrainType = 'PLAINS' | 'HILLS' | 'FOREST' | 'MOUNTAIN' | 'RESOURCE';

export type UnitType = 'SOLDIER' | 'SETTLER';

export type BuildingType = 'BARRACKS' | 'RESEARCH_LAB';

export interface HexCoord {
  col: number;
  row: number;
}

export interface Unit {
  id: string;
  type: UnitType;
  faction: Faction;
  coord: HexCoord;
  hp: number;
  maxHp: number;
  attack: number;
  maxMoves: number;
  movesLeft: number;
  hasAttacked: boolean;
  isFortified?: boolean;
}

export interface City {
  id: string;
  name: string;
  faction: Faction;
  coord: HexCoord;
  isCapital: boolean;
  hp: number;
  maxHp: number;
  buildings: BuildingType[];
  goldPerTurn: number;
  sciencePerTurn: number;
}

export interface Tile {
  coord: HexCoord;
  terrain: TerrainType;
  owner?: Faction;
  isCityCenter?: boolean;
}

export interface DamageFloater {
  id: string;
  coord: HexCoord;
  text: string;
  color: string;
  timestamp: number;
}

export interface GameState {
  turn: number;
  maxTurns: number;
  playerGold: number;
  enemyGold: number;
  playerEra: Era;
  enemyEra: Era;
  playerScience: number;
  enemyScience: number;
  scienceRequired: number; // 3 points to reach modern
  tiles: Tile[];
  units: Unit[];
  cities: City[];
  selectedCoord: HexCoord | null;
  status: 'PLAYING' | 'PLAYER_WON' | 'ENEMY_WON' | 'DRAW';
  winReason?: string;
  log: string[];
}
