import { City, DamageFloater, Era, Faction, GameState, HexCoord, Tile, Unit } from '../types';
import { GRID_COLS, GRID_ROWS, hexDistance, isSameCoord } from './hex';

export const INITIAL_MAX_TURNS = 10;
export const SCIENCE_REQUIRED = 3;

export const COSTS = {
  SOLDIER: 10,
  BARRACKS: 15,
  RESEARCH_LAB: 20,
  SETTLER: 25,
};

// Generate initial 5x7 hex map
export function generateInitialMap(): Tile[] {
  const tiles: Tile[] = [];

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      let terrain: Tile['terrain'] = 'PLAINS';

      // Mountains as natural tactical chokepoints
      if ((r === 3 && c === 1) || (r === 3 && c === 3)) {
        terrain = 'MOUNTAIN';
      } else if (r === 3 && c === 2) {
        // Center strategic gold resource
        terrain = 'RESOURCE';
      } else if ((r === 2 && c === 0) || (r === 4 && c === 4)) {
        terrain = 'HILLS';
      } else if ((r === 2 && c === 4) || (r === 4 && c === 0)) {
        terrain = 'FOREST';
      }

      tiles.push({
        coord: { col: c, row: r },
        terrain,
        owner: r <= 1 ? 'ENEMY' : r >= 5 ? 'PLAYER' : undefined,
        isCityCenter: (r === 0 && c === 2) || (r === 6 && c === 2),
      });
    }
  }

  return tiles;
}

export function createInitialGameState(): GameState {
  const tiles = generateInitialMap();

  const cities: City[] = [
    {
      id: 'city-enemy-cap',
      name: '罗马 (敌首府)',
      faction: 'ENEMY',
      coord: { col: 2, row: 0 },
      isCapital: true,
      hp: 150,
      maxHp: 150,
      buildings: [],
      goldPerTurn: 10,
      sciencePerTurn: 0,
    },
    {
      id: 'city-player-cap',
      name: '雅典 (我方首府)',
      faction: 'PLAYER',
      coord: { col: 2, row: 6 },
      isCapital: true,
      hp: 150,
      maxHp: 150,
      buildings: [],
      goldPerTurn: 10,
      sciencePerTurn: 0,
    },
  ];

  const units: Unit[] = [
    {
      id: 'unit-enemy-soldier-1',
      type: 'SOLDIER',
      faction: 'ENEMY',
      coord: { col: 2, row: 1 },
      hp: 100,
      maxHp: 100,
      attack: 45,
      maxMoves: 2,
      movesLeft: 2,
      hasAttacked: false,
    },
    {
      id: 'unit-player-soldier-1',
      type: 'SOLDIER',
      faction: 'PLAYER',
      coord: { col: 2, row: 5 },
      hp: 100,
      maxHp: 100,
      attack: 45,
      maxMoves: 2,
      movesLeft: 2,
      hasAttacked: false,
    },
  ];

  return {
    turn: 1,
    maxTurns: INITIAL_MAX_TURNS,
    playerGold: 20,
    enemyGold: 20,
    playerEra: 'ANCIENT',
    enemyEra: 'ANCIENT',
    playerScience: 0,
    enemyScience: 0,
    scienceRequired: SCIENCE_REQUIRED,
    tiles,
    units,
    cities,
    selectedCoord: { col: 2, row: 5 },
    status: 'PLAYING',
    log: ['欢迎来到 Mini Unciv！第一回合开始。请调遣士兵或在主城招募。'],
  };
}

// Check unit attack stats based on faction's era and buildings
export function getUnitBaseStats(type: Unit['type'], era: Era, hasBarracks: boolean) {
  if (type === 'SETTLER') {
    return {
      hp: 60,
      maxHp: 60,
      attack: 0,
      maxMoves: 2,
    };
  }

  // SOLDIER
  if (era === 'MODERN') {
    const atk = hasBarracks ? 95 : 80;
    return {
      hp: 140,
      maxHp: 140,
      attack: atk,
      maxMoves: 3,
    };
  } else {
    const atk = hasBarracks ? 55 : 45;
    return {
      hp: 100,
      maxHp: 100,
      attack: atk,
      maxMoves: 2,
    };
  }
}

// Check if a tile can be walked onto
export function isTilePassable(coord: HexCoord, tiles: Tile[], units: Unit[]): boolean {
  const tile = tiles.find((t) => isSameCoord(t.coord, coord));
  if (!tile || tile.terrain === 'MOUNTAIN') return false;
  // Check if occupied by any unit
  const occupied = units.some((u) => isSameCoord(u.coord, coord));
  return !occupied;
}

// Calculate valid moves for selected unit
export function getValidMoves(unit: Unit, state: GameState): HexCoord[] {
  if (unit.movesLeft <= 0 || unit.hasAttacked) return [];
  const valid: HexCoord[] = [];
  const maxDistance = unit.movesLeft;

  state.tiles.forEach((t) => {
    if (t.terrain === 'MOUNTAIN') return;
    const dist = hexDistance(unit.coord, t.coord);
    if (dist > 0 && dist <= maxDistance) {
      // Check if not occupied by any unit
      const isOccupied = state.units.some((u) => isSameCoord(u.coord, t.coord));
      if (!isOccupied) {
        valid.push(t.coord);
      }
    }
  });

  return valid;
}

// Calculate valid attack targets for selected unit
export function getValidTargets(unit: Unit, state: GameState): HexCoord[] {
  if (unit.hasAttacked || unit.attack <= 0) return [];
  const targets: HexCoord[] = [];
  const enemyFaction: Faction = unit.faction === 'PLAYER' ? 'ENEMY' : 'PLAYER';

  // Soldiers have range 1 (melee) or modern soldiers range 1 (high lethality)
  const range = 1;

  // 1. Enemy Units within range
  state.units.forEach((u) => {
    if (u.faction === enemyFaction && hexDistance(unit.coord, u.coord) <= range) {
      targets.push(u.coord);
    }
  });

  // 2. Enemy Cities within range
  state.cities.forEach((c) => {
    if (c.faction === enemyFaction && hexDistance(unit.coord, c.coord) <= range) {
      targets.push(c.coord);
    }
  });

  return targets;
}

// Execute attack between unit and target (unit or city)
export function executeAttack(
  attacker: Unit,
  targetCoord: HexCoord,
  state: GameState,
): {
  updatedUnits: Unit[];
  updatedCities: City[];
  floaters: DamageFloater[];
  logMsg: string;
  attackerDied: boolean;
  targetDestroyed: boolean;
  capturedCityFaction?: Faction;
} {
  let updatedUnits = [...state.units];
  let updatedCities = [...state.cities];
  const floaters: DamageFloater[] = [];
  let logMsg = '';
  let attackerDied = false;
  let targetDestroyed = false;
  let capturedCityFaction: Faction | undefined;

  const targetTile = state.tiles.find((t) => isSameCoord(t.coord, targetCoord));
  const targetUnit = updatedUnits.find((u) => isSameCoord(u.coord, targetCoord));
  const targetCity = updatedCities.find((c) => isSameCoord(c.coord, targetCoord));

  // Defense terrain modifiers
  let defenseMultiplier = 1.0;
  if (targetTile?.terrain === 'HILLS' || targetTile?.terrain === 'FOREST') {
    defenseMultiplier = 0.8; // Takes 20% less damage
  }

  const rawDmg = attacker.attack;
  const finalDamage = Math.round(rawDmg * defenseMultiplier);

  if (targetUnit) {
    // Attack enemy unit
    const newTargetHp = targetUnit.hp - finalDamage;
    floaters.push({
      id: `float-${Date.now()}-1`,
      coord: targetCoord,
      text: `-${finalDamage}`,
      color: '#ef4444',
      timestamp: Date.now(),
    });

    if (newTargetHp <= 0) {
      // Enemy unit killed
      targetDestroyed = true;
      updatedUnits = updatedUnits.filter((u) => u.id !== targetUnit.id);
      logMsg = `${attacker.faction === 'PLAYER' ? '我方' : '敌方'}士兵消灭了敌军！`;

      // If melee and tile is empty, move attacker into the target tile!
      const currentAttackerIdx = updatedUnits.findIndex((u) => u.id === attacker.id);
      if (currentAttackerIdx !== -1) {
        updatedUnits[currentAttackerIdx] = {
          ...updatedUnits[currentAttackerIdx],
          coord: targetCoord,
          movesLeft: 0,
          hasAttacked: true,
        };
      }
    } else {
      // Enemy unit survives and counter-attacks if it has attack power
      const updatedTarget: Unit = {
        ...targetUnit,
        hp: newTargetHp,
      };

      let counterDamage = 0;
      if (targetUnit.attack > 0) {
        counterDamage = Math.round(targetUnit.attack * 0.45);
        const newAttackerHp = attacker.hp - counterDamage;

        floaters.push({
          id: `float-${Date.now()}-2`,
          coord: attacker.coord,
          text: `反击 -${counterDamage}`,
          color: '#f97316',
          timestamp: Date.now(),
        });

        if (newAttackerHp <= 0) {
          attackerDied = true;
          updatedUnits = updatedUnits.filter((u) => u.id !== attacker.id);
          logMsg = `战斗激烈！双方交火，攻击方阵亡。`;
        } else {
          const currentAttackerIdx = updatedUnits.findIndex((u) => u.id === attacker.id);
          if (currentAttackerIdx !== -1) {
            updatedUnits[currentAttackerIdx] = {
              ...updatedUnits[currentAttackerIdx],
              hp: newAttackerHp,
              movesLeft: 0,
              hasAttacked: true,
            };
          }
        }
      }

      // Update target unit in list
      const targetIdx = updatedUnits.findIndex((u) => u.id === targetUnit.id);
      if (targetIdx !== -1) {
        updatedUnits[targetIdx] = updatedTarget;
      }
      logMsg = `${attacker.faction === 'PLAYER' ? '我方' : '敌方'}攻击造成 ${finalDamage} 伤害！`;
    }
  } else if (targetCity) {
    // Attack enemy city
    const newCityHp = targetCity.hp - finalDamage;
    floaters.push({
      id: `float-${Date.now()}-c`,
      coord: targetCoord,
      text: `城损 -${finalDamage}`,
      color: '#dc2626',
      timestamp: Date.now(),
    });

    if (newCityHp <= 0) {
      // City Captured!
      targetDestroyed = true;
      capturedCityFaction = attacker.faction;

      const cityIdx = updatedCities.findIndex((c) => c.id === targetCity.id);
      if (cityIdx !== -1) {
        updatedCities[cityIdx] = {
          ...targetCity,
          faction: attacker.faction,
          hp: Math.round(targetCity.maxHp * 0.5),
        };
      }

      // Attacker steps into the city!
      const currentAttackerIdx = updatedUnits.findIndex((u) => u.id === attacker.id);
      if (currentAttackerIdx !== -1) {
        updatedUnits[currentAttackerIdx] = {
          ...updatedUnits[currentAttackerIdx],
          coord: targetCoord,
          movesLeft: 0,
          hasAttacked: true,
        };
      }
      logMsg = `💥 ${targetCity.name} 被 ${attacker.faction === 'PLAYER' ? '我方' : '敌方'} 攻破占领！`;
    } else {
      // City takes damage
      const cityIdx = updatedCities.findIndex((c) => c.id === targetCity.id);
      if (cityIdx !== -1) {
        updatedCities[cityIdx] = {
          ...targetCity,
          hp: newCityHp,
        };
      }

      // City bombardment counter-attacks adjacent attacker
      const cityCounterDmg = 20;
      const newAttackerHp = attacker.hp - cityCounterDmg;
      floaters.push({
        id: `float-${Date.now()}-city-ret`,
        coord: attacker.coord,
        text: `守军炮火 -${cityCounterDmg}`,
        color: '#f97316',
        timestamp: Date.now(),
      });

      if (newAttackerHp <= 0) {
        attackerDied = true;
        updatedUnits = updatedUnits.filter((u) => u.id !== attacker.id);
        logMsg = `攻城未果，攻击部队被守城炮火摧毁！`;
      } else {
        const currentAttackerIdx = updatedUnits.findIndex((u) => u.id === attacker.id);
        if (currentAttackerIdx !== -1) {
          updatedUnits[currentAttackerIdx] = {
            ...updatedUnits[currentAttackerIdx],
            hp: newAttackerHp,
            movesLeft: 0,
            hasAttacked: true,
          };
        }
        logMsg = `对 ${targetCity.name} 造成 ${finalDamage} 攻城伤害！`;
      }
    }
  }

  return {
    updatedUnits,
    updatedCities,
    floaters,
    logMsg,
    attackerDied,
    targetDestroyed,
    capturedCityFaction,
  };
}

// AI Turn Execution logic
export function executeAITurn(currentState: GameState): {
  newState: GameState;
  newFloaters: DamageFloater[];
} {
  let state: GameState = {
    ...currentState,
    units: currentState.units.map((u) => ({ ...u })),
    cities: currentState.cities.map((c) => ({ ...c })),
    tiles: currentState.tiles.map((t) => ({ ...t })),
    log: [...currentState.log],
  };

  const newFloaters: DamageFloater[] = [];

  // 1. AI Income & Science
  let enemyGold = state.enemyGold;
  let enemyScience = state.enemyScience;
  let enemyEra = state.enemyEra;

  state.cities
    .filter((c) => c.faction === 'ENEMY')
    .forEach((city) => {
      enemyGold += city.goldPerTurn;
      if (city.buildings.includes('RESEARCH_LAB')) {
        enemyScience += 1;
      }
    });

  // Check Era transition for Enemy
  if (enemyEra === 'ANCIENT' && enemyScience >= state.scienceRequired) {
    enemyEra = 'MODERN';
    state.log.unshift('⚠️ 警报：敌方突破了内燃机与雷达，率先进入【现代时代】！');
    // Upgrade enemy soldiers
    state.units = state.units.map((u) => {
      if (u.faction === 'ENEMY' && u.type === 'SOLDIER') {
        return {
          ...u,
          hp: 140,
          maxHp: 140,
          attack: 85,
          maxMoves: 3,
        };
      }
      return u;
    });
  }

  // 2. AI Building & Purchasing Decisions
  const enemyCities = state.cities.filter((c) => c.faction === 'ENEMY');
  const enemySoldiers = state.units.filter((u) => u.faction === 'ENEMY' && u.type === 'SOLDIER');
  const playerSoldiers = state.units.filter((u) => u.faction === 'PLAYER');

  enemyCities.forEach((city) => {
    // If enemy doesn't have research lab and has enough gold, build research lab to race
    if (enemyGold >= COSTS.RESEARCH_LAB && !city.buildings.includes('RESEARCH_LAB') && enemyEra === 'ANCIENT') {
      enemyGold -= COSTS.RESEARCH_LAB;
      city.buildings.push('RESEARCH_LAB');
      state.log.unshift(`敌方在 ${city.name} 建立了科研中心！`);
    } else if (enemyGold >= COSTS.BARRACKS && !city.buildings.includes('BARRACKS') && enemySoldiers.length >= 2) {
      // Build barracks if has soldiers
      enemyGold -= COSTS.BARRACKS;
      city.buildings.push('BARRACKS');
      state.log.unshift(`敌方在 ${city.name} 建立了军营！`);
    } else if (enemyGold >= COSTS.SOLDIER && enemySoldiers.length < 4) {
      // Recruit soldier if tile is free or adjacent tile is free
      const hasBarracks = city.buildings.includes('BARRACKS');
      const baseStats = getUnitBaseStats('SOLDIER', enemyEra, hasBarracks);

      // Check if city tile is free
      const isOccupied = state.units.some((u) => isSameCoord(u.coord, city.coord));
      let deployCoord: HexCoord | null = isOccupied ? null : city.coord;

      if (!deployCoord) {
        // Find adjacent free tile
        const neighbors = [
          { col: city.coord.col, row: city.coord.row + 1 },
          { col: city.coord.col - 1, row: city.coord.row },
          { col: city.coord.col + 1, row: city.coord.row },
        ].filter(
          (c) =>
            c.col >= 0 &&
            c.col < GRID_COLS &&
            c.row >= 0 &&
            c.row < GRID_ROWS &&
            isTilePassable(c, state.tiles, state.units),
        );
        if (neighbors.length > 0) {
          deployCoord = neighbors[0];
        }
      }

      if (deployCoord) {
        enemyGold -= COSTS.SOLDIER;
        state.units.push({
          id: `unit-enemy-${Date.now()}-${Math.random()}`,
          type: 'SOLDIER',
          faction: 'ENEMY',
          coord: deployCoord,
          ...baseStats,
          movesLeft: baseStats.maxMoves,
          hasAttacked: false,
        });
        state.log.unshift(`敌方征召了一支新部队！`);
      }
    }
  });

  // 3. AI Unit Movement & Combat
  // Refresh enemy units movement
  state.units = state.units.map((u) =>
    u.faction === 'ENEMY' ? { ...u, movesLeft: u.maxMoves, hasAttacked: false } : u,
  );

  const enemyUnitsToAct = state.units.filter((u) => u.faction === 'ENEMY');

  enemyUnitsToAct.forEach((enemyUnit) => {
    // Re-fetch unit in case it died
    const currentUnit = state.units.find((u) => u.id === enemyUnit.id);
    if (!currentUnit || currentUnit.hasAttacked) return;

    // Find targets within range 1 first
    const targets = getValidTargets(currentUnit, state);
    if (targets.length > 0) {
      // Attack priority: player units with low HP, then player cities
      const targetCoord = targets[0];
      const result = executeAttack(currentUnit, targetCoord, state);
      state.units = result.updatedUnits;
      state.cities = result.updatedCities;
      newFloaters.push(...result.floaters);
      if (result.logMsg) state.log.unshift(`[敌方行动] ${result.logMsg}`);
    } else {
      // Move towards closest player target (player capital or nearest player soldier)
      const targetCoords: HexCoord[] = [
        ...state.cities.filter((c) => c.faction === 'PLAYER').map((c) => c.coord),
        ...playerSoldiers.map((p) => p.coord),
      ];

      if (targetCoords.length > 0) {
        let bestTarget = targetCoords[0];
        let minDist = hexDistance(currentUnit.coord, bestTarget);
        targetCoords.forEach((tc) => {
          const d = hexDistance(currentUnit.coord, tc);
          if (d < minDist) {
            minDist = d;
            bestTarget = tc;
          }
        });

        // Find best move tile that reduces distance
        const validMoves = getValidMoves(currentUnit, state);
        let bestMove: HexCoord | null = null;
        let bestMoveDist = minDist;

        validMoves.forEach((mv) => {
          const d = hexDistance(mv, bestTarget);
          if (d < bestMoveDist) {
            bestMoveDist = d;
            bestMove = mv;
          }
        });

        if (bestMove) {
          const uIdx = state.units.findIndex((u) => u.id === currentUnit.id);
          if (uIdx !== -1) {
            state.units[uIdx] = {
              ...state.units[uIdx],
              coord: bestMove,
              movesLeft: 0,
            };

            // Check if can attack after moving!
            const postMoveTargets = getValidTargets(state.units[uIdx], state);
            if (postMoveTargets.length > 0) {
              const result = executeAttack(state.units[uIdx], postMoveTargets[0], state);
              state.units = result.updatedUnits;
              state.cities = result.updatedCities;
              newFloaters.push(...result.floaters);
              if (result.logMsg) state.log.unshift(`[敌方行动] ${result.logMsg}`);
            }
          }
        }
      }
    }
  });

  // 4. Check Win/Loss conditions
  const playerCapital = state.cities.find((c) => c.isCapital && c.faction === 'PLAYER');
  const enemyCapital = state.cities.find((c) => c.isCapital && c.faction === 'ENEMY');

  let status = state.status;
  let winReason = state.winReason;

  if (!enemyCapital || enemyCapital.faction === 'PLAYER') {
    status = 'PLAYER_WON';
    winReason = '征服胜利：敌方首都已被攻破占领！';
  } else if (!playerCapital || playerCapital.faction === 'ENEMY') {
    status = 'ENEMY_WON';
    winReason = '首都沦陷：我方首都已被敌军攻陷！';
  }

  // 5. Update Turn & Player Unit Refresh
  const nextTurn = state.turn + 1;
  if (nextTurn > state.maxTurns && status === 'PLAYING') {
    // 10 Turns completed! Sudden death scoring
    const playerScore =
      (state.playerEra === 'MODERN' ? 100 : 0) +
      state.cities.filter((c) => c.faction === 'PLAYER').length * 50 +
      state.units.filter((u) => u.faction === 'PLAYER').length * 20 +
      state.playerGold;

    const enemyScore =
      (enemyEra === 'MODERN' ? 100 : 0) +
      state.cities.filter((c) => c.faction === 'ENEMY').length * 50 +
      state.units.filter((u) => u.faction === 'ENEMY').length * 20 +
      enemyGold;

    if (playerScore > enemyScore) {
      status = 'PLAYER_WON';
      winReason = `10回合决战积分胜出！我方 ${playerScore} 分 vs 敌方 ${enemyScore} 分`;
    } else if (enemyScore > playerScore) {
      status = 'ENEMY_WON';
      winReason = `10回合决战积分惜败！我方 ${playerScore} 分 vs 敌方 ${enemyScore} 分`;
    } else {
      status = 'DRAW';
      winReason = `10回合决战双方积分持平 (${playerScore} 分)！`;
    }
  }

  // Refresh Player units
  const refreshedPlayerUnits = state.units.map((u) =>
    u.faction === 'PLAYER'
      ? {
          ...u,
          movesLeft: u.maxMoves,
          hasAttacked: false,
          hp: u.isFortified ? Math.min(u.maxHp, u.hp + 20) : u.hp, // Fortified healing
        }
      : u,
  );

  // Player Resource Income
  let playerGold = state.playerGold;
  let playerScience = state.playerScience;
  let playerEra = state.playerEra;

  state.cities
    .filter((c) => c.faction === 'PLAYER')
    .forEach((city) => {
      playerGold += city.goldPerTurn;
      if (city.buildings.includes('RESEARCH_LAB')) {
        playerScience += 1;
      }
    });

  // Check player Modern transition
  if (playerEra === 'ANCIENT' && playerScience >= state.scienceRequired) {
    playerEra = 'MODERN';
    state.log.unshift('🎉 科技突破！我方掌握内燃机与自动化，正式步入【现代时代】！全军战力质变！');
    // Upgrade all player soldiers
    for (let i = 0; i < refreshedPlayerUnits.length; i++) {
      if (refreshedPlayerUnits[i].faction === 'PLAYER' && refreshedPlayerUnits[i].type === 'SOLDIER') {
        refreshedPlayerUnits[i] = {
          ...refreshedPlayerUnits[i],
          hp: 140,
          maxHp: 140,
          attack: 85,
          maxMoves: 3,
          movesLeft: 3,
        };
      }
    }
  }

  const newState: GameState = {
    ...state,
    turn: nextTurn,
    playerGold,
    enemyGold,
    playerScience,
    enemyScience,
    playerEra,
    enemyEra,
    units: refreshedPlayerUnits,
    status,
    winReason,
    log: [`第 ${Math.min(nextTurn, state.maxTurns)} / ${state.maxTurns} 回合开始。`, ...state.log.slice(0, 15)],
  };

  return { newState, newFloaters };
}
