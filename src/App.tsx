/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { GameState, HexCoord, DamageFloater, Unit, City } from './types';
import {
  createInitialGameState,
  executeAttack,
  executeAITurn,
  getUnitBaseStats,
  getValidMoves,
  getValidTargets,
  isTilePassable,
  COSTS,
} from './utils/gameLogic';
import { isSameCoord, getNeighbors, hexDistance } from './utils/hex';
import {
  playAttackSound,
  playBuildSound,
  playEraUpgradeSound,
  playMoveSound,
} from './utils/audio';
import { TopBar } from './components/TopBar';
import { HexGrid } from './components/HexGrid';
import { BottomControls } from './components/BottomControls';
import { VictoryModal } from './components/VictoryModal';
import { HelpModal } from './components/HelpModal';
import { MoveConfirmModal } from './components/MoveConfirmModal';

export default function App() {
  const [state, setState] = useState<GameState>(() => createInitialGameState());
  const [damageFloaters, setDamageFloaters] = useState<DamageFloater[]>([]);
  const [isAITurn, setIsAITurn] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    unit: Unit;
    targetCoord: HexCoord;
  } | null>(null);

  // Auto clean damage floaters after 1.5s
  useEffect(() => {
    if (damageFloaters.length > 0) {
      const timer = setTimeout(() => {
        setDamageFloaters((prev) => prev.slice(1));
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [damageFloaters]);

  // Find currently selected unit or city
  const selectedUnit = useMemo(() => {
    if (!state.selectedCoord) return null;
    return state.units.find((u) => isSameCoord(u.coord, state.selectedCoord)) || null;
  }, [state.units, state.selectedCoord]);

  // Compute valid moves & targets
  const validMoves = useMemo(() => {
    if (!selectedUnit || selectedUnit.faction !== 'PLAYER' || isAITurn) return [];
    return getValidMoves(selectedUnit, state);
  }, [selectedUnit, state, isAITurn]);

  const validTargets = useMemo(() => {
    if (!selectedUnit || selectedUnit.faction !== 'PLAYER' || isAITurn) return [];
    return getValidTargets(selectedUnit, state);
  }, [selectedUnit, state, isAITurn]);

  // Handle Tile Selection / Move / Attack
  const handleSelectCoord = useCallback(
    (targetCoord: HexCoord) => {
      if (isAITurn || state.status !== 'PLAYING') return;

      // 1. If currently selected friendly unit and clicking a valid target -> ATTACK!
      if (
        selectedUnit &&
        selectedUnit.faction === 'PLAYER' &&
        validTargets.some((t) => isSameCoord(t, targetCoord))
      ) {
        const isModern = state.playerEra === 'MODERN';
        playAttackSound(isModern);

        const result = executeAttack(selectedUnit, targetCoord, state);
        setDamageFloaters((prev) => [...prev, ...result.floaters]);

        // Check if attacked enemy capital or captured it
        const enemyCap = result.updatedCities.find((c) => c.isCapital && c.faction === 'ENEMY');
        let newStatus = state.status;
        let newWinReason = state.winReason;

        if (!enemyCap || enemyCap.faction === 'PLAYER') {
          newStatus = 'PLAYER_WON';
          newWinReason = '攻破敌方首府！取得征服胜利！';
        }

        setState((prev) => ({
          ...prev,
          units: result.updatedUnits,
          cities: result.updatedCities,
          selectedCoord: result.targetDestroyed ? targetCoord : selectedUnit.coord,
          status: newStatus,
          winReason: newWinReason,
          log: [result.logMsg, ...prev.log.slice(0, 15)],
        }));
        return;
      }

      // 2. If currently selected friendly unit and clicking a valid move tile -> Open Confirm Modal!
      if (
        selectedUnit &&
        selectedUnit.faction === 'PLAYER' &&
        validMoves.some((m) => isSameCoord(m, targetCoord))
      ) {
        setPendingMove({
          unit: selectedUnit,
          targetCoord,
        });
        return;
      }

      // 3. Otherwise, simply change selection
      setState((prev) => ({
        ...prev,
        selectedCoord: targetCoord,
      }));
    },
    [selectedUnit, validMoves, validTargets, state, isAITurn],
  );

  // Target Tile for Pending Move
  const pendingTargetTile = useMemo(() => {
    if (!pendingMove) return undefined;
    return state.tiles.find((t) => isSameCoord(t.coord, pendingMove.targetCoord));
  }, [pendingMove, state.tiles]);

  // Execute Confirmed Move
  const handleConfirmMove = useCallback(() => {
    if (!pendingMove) return;
    const { unit, targetCoord } = pendingMove;

    playMoveSound();
    const dist = hexDistance(unit.coord, targetCoord);
    const remainingMoves = Math.max(0, unit.movesLeft - dist);

    setState((prev) => {
      const updatedUnits = prev.units.map((u) =>
        u.id === unit.id
          ? {
              ...u,
              coord: targetCoord,
              movesLeft: remainingMoves,
              isFortified: false,
            }
          : u,
      );
      return {
        ...prev,
        units: updatedUnits,
        selectedCoord: targetCoord,
      };
    });
    setPendingMove(null);
  }, [pendingMove]);

  // Cancel Pending Move
  const handleCancelMove = useCallback(() => {
    setPendingMove(null);
  }, []);

  // Instant Purchase: Recruit Soldier
  const handleRecruitSoldier = useCallback(
    (cityCoord: HexCoord) => {
      if (state.playerGold < COSTS.SOLDIER || isAITurn) return;

      const city = state.cities.find((c) => isSameCoord(c.coord, cityCoord));
      if (!city || city.faction !== 'PLAYER') return;

      // Check if city tile is free, otherwise find an adjacent free tile
      let deployCoord: HexCoord | null = null;
      if (isTilePassable(cityCoord, state.tiles, state.units)) {
        deployCoord = cityCoord;
      } else {
        const neighbors = getNeighbors(cityCoord).filter((c) =>
          isTilePassable(c, state.tiles, state.units),
        );
        if (neighbors.length > 0) {
          deployCoord = neighbors[0];
        }
      }

      if (!deployCoord) {
        alert('城市及周边无多余空闲地块，无法部署新单位！');
        return;
      }

      playBuildSound();
      const hasBarracks = city.buildings.includes('BARRACKS');
      const stats = getUnitBaseStats('SOLDIER', state.playerEra, hasBarracks);

      const newUnit: Unit = {
        id: `player-soldier-${Date.now()}`,
        type: 'SOLDIER',
        faction: 'PLAYER',
        coord: deployCoord,
        ...stats,
        movesLeft: stats.maxMoves,
        hasAttacked: false,
      };

      setState((prev) => ({
        ...prev,
        playerGold: prev.playerGold - COSTS.SOLDIER,
        units: [...prev.units, newUnit],
        selectedCoord: deployCoord,
        log: [`在 ${city.name} 招募了新士兵！`, ...prev.log.slice(0, 15)],
      }));
    },
    [state, isAITurn],
  );

  // Instant Purchase: Build Barracks
  const handleBuildBarracks = useCallback(
    (cityCoord: HexCoord) => {
      if (state.playerGold < COSTS.BARRACKS || isAITurn) return;

      playBuildSound();
      setState((prev) => {
        const updatedCities = prev.cities.map((c) => {
          if (isSameCoord(c.coord, cityCoord) && !c.buildings.includes('BARRACKS')) {
            return {
              ...c,
              buildings: [...c.buildings, 'BARRACKS' as const],
            };
          }
          return c;
        });

        return {
          ...prev,
          playerGold: prev.playerGold - COSTS.BARRACKS,
          cities: updatedCities,
          log: [`在城市建立了军营！士兵攻击力永久提高！`, ...prev.log.slice(0, 15)],
        };
      });
    },
    [state, isAITurn],
  );

  // Instant Purchase: Build Research Lab
  const handleBuildResearchLab = useCallback(
    (cityCoord: HexCoord) => {
      if (state.playerGold < COSTS.RESEARCH_LAB || isAITurn) return;

      playBuildSound();
      setState((prev) => {
        const updatedCities = prev.cities.map((c) => {
          if (isSameCoord(c.coord, cityCoord) && !c.buildings.includes('RESEARCH_LAB')) {
            return {
              ...c,
              buildings: [...c.buildings, 'RESEARCH_LAB' as const],
            };
          }
          return c;
        });

        return {
          ...prev,
          playerGold: prev.playerGold - COSTS.RESEARCH_LAB,
          cities: updatedCities,
          log: [`建立了科研所！每回合提供科技加速跃迁！`, ...prev.log.slice(0, 15)],
        };
      });
    },
    [state, isAITurn],
  );

  // Instant Purchase: Recruit Settler
  const handleRecruitSettler = useCallback(
    (cityCoord: HexCoord) => {
      if (state.playerGold < COSTS.SETTLER || isAITurn) return;

      let deployCoord: HexCoord | null = null;
      if (isTilePassable(cityCoord, state.tiles, state.units)) {
        deployCoord = cityCoord;
      } else {
        const neighbors = getNeighbors(cityCoord).filter((c) =>
          isTilePassable(c, state.tiles, state.units),
        );
        if (neighbors.length > 0) {
          deployCoord = neighbors[0];
        }
      }

      if (!deployCoord) {
        alert('城市周围地块已满，无法派遣开拓者！');
        return;
      }

      playBuildSound();
      const stats = getUnitBaseStats('SETTLER', state.playerEra, false);

      const newSettler: Unit = {
        id: `player-settler-${Date.now()}`,
        type: 'SETTLER',
        faction: 'PLAYER',
        coord: deployCoord,
        ...stats,
        movesLeft: stats.maxMoves,
        hasAttacked: false,
      };

      setState((prev) => ({
        ...prev,
        playerGold: prev.playerGold - COSTS.SETTLER,
        units: [...prev.units, newSettler],
        selectedCoord: deployCoord,
        log: [`派遣了开拓者！可前往战略要地扎根建新城。`, ...prev.log.slice(0, 15)],
      }));
    },
    [state, isAITurn],
  );

  // Unit Action: Fortify
  const handleFortifyUnit = useCallback(
    (unitId: string) => {
      setState((prev) => {
        const updatedUnits = prev.units.map((u) => {
          if (u.id === unitId) {
            return {
              ...u,
              isFortified: true,
              movesLeft: 0,
              hasAttacked: true,
              hp: Math.min(u.maxHp, u.hp + 20),
            };
          }
          return u;
        });

        return {
          ...prev,
          units: updatedUnits,
          log: [`部队就地驻扎休整：恢复 20 生命值，且受到伤害减少 30%！`, ...prev.log.slice(0, 15)],
        };
      });
    },
    [],
  );

  // Unit Action: Settler Found City
  const handleFoundCity = useCallback(
    (unitId: string) => {
      const settler = state.units.find((u) => u.id === unitId);
      if (!settler || settler.type !== 'SETTLER') return;

      // Check if distance to existing friendly cities is at least 2
      const existingFriendlyCities = state.cities.filter((c) => c.faction === 'PLAYER');
      const tooClose = existingFriendlyCities.some(
        (c) => hexDistance(c.coord, settler.coord) < 2,
      );

      if (tooClose) {
        alert('与已有城市距离过近（至少间隔 2 格），请行军至更开阔的地块建城！');
        return;
      }

      playBuildSound();
      const newCityName = `斯巴达分城`;
      const newCity: City = {
        id: `city-player-${Date.now()}`,
        name: newCityName,
        faction: 'PLAYER',
        coord: settler.coord,
        isCapital: false,
        hp: 120,
        maxHp: 120,
        buildings: [],
        goldPerTurn: 10,
        sciencePerTurn: 0,
      };

      setState((prev) => ({
        ...prev,
        units: prev.units.filter((u) => u.id !== unitId),
        cities: [...prev.cities, newCity],
        selectedCoord: settler.coord,
        log: [`开拓者扎根建立了新的城市：${newCityName}！`, ...prev.log.slice(0, 15)],
      }));
    },
    [state],
  );

  // End Turn & Run AI Turn
  const handleEndTurn = useCallback(() => {
    if (isAITurn || state.status !== 'PLAYING') return;

    setPendingMove(null);
    setIsAITurn(true);

    // Brief 500ms delay to make AI movement clear to user
    setTimeout(() => {
      const { newState, newFloaters } = executeAITurn(state);
      setDamageFloaters((prev) => [...prev, ...newFloaters]);

      // Check if player entered modern era this turn
      if (state.playerEra === 'ANCIENT' && newState.playerEra === 'MODERN') {
        playEraUpgradeSound();
      }

      setState(newState);
      setIsAITurn(false);
    }, 550);
  }, [state, isAITurn]);

  // Quick helper to select player capital
  const handleSelectCapital = useCallback(() => {
    const playerCap = state.cities.find((c) => c.isCapital && c.faction === 'PLAYER');
    if (playerCap) {
      setState((prev) => ({ ...prev, selectedCoord: playerCap.coord }));
    }
  }, [state.cities]);

  // Restart game
  const handleRestart = useCallback(() => {
    setState(createInitialGameState());
    setDamageFloaters([]);
    setPendingMove(null);
    setIsAITurn(false);
  }, []);

  return (
    <div className="w-screen h-screen max-h-[100dvh] bg-slate-950 text-slate-100 flex items-center justify-center overflow-hidden font-sans">
      {/* Mobile-sized shell (fits standard phones 100%, and neat centered container on desktop) */}
      <div className="relative w-full max-w-md h-full flex flex-col justify-between bg-slate-950 border-x border-slate-800 shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <TopBar
          state={state}
          onOpenHelp={() => setShowHelp(true)}
          onRestart={handleRestart}
        />

        {/* Latest Battle Log Banner */}
        <div className="w-full bg-slate-900/80 px-3 py-1 text-[11px] text-slate-300 flex items-center justify-between border-b border-slate-800/60 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="text-amber-400 font-bold shrink-0 mr-1.5">战报:</span>
          <span className="truncate flex-1 text-slate-300">{state.log[0]}</span>
        </div>

        {/* Central Hex Map */}
        <HexGrid
          state={state}
          validMoves={validMoves}
          validTargets={validTargets}
          damageFloaters={damageFloaters}
          onSelectCoord={handleSelectCoord}
        />

        {/* Bottom Mobile Action Panel */}
        <BottomControls
          state={state}
          selectedCoord={state.selectedCoord}
          isAITurn={isAITurn}
          onRecruitSoldier={handleRecruitSoldier}
          onBuildBarracks={handleBuildBarracks}
          onBuildResearchLab={handleBuildResearchLab}
          onRecruitSettler={handleRecruitSettler}
          onFortifyUnit={handleFortifyUnit}
          onFoundCity={handleFoundCity}
          onEndTurn={handleEndTurn}
          onSelectCapital={handleSelectCapital}
        />

        {/* Victory / Defeat Modal */}
        {state.status !== 'PLAYING' && (
          <VictoryModal state={state} onRestart={handleRestart} />
        )}

        {/* Help & 5-minute Rules Modal */}
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

        {/* Unit Move Confirmation Modal */}
        {pendingMove && (
          <MoveConfirmModal
            unit={pendingMove.unit}
            targetCoord={pendingMove.targetCoord}
            targetTile={pendingTargetTile}
            playerEra={state.playerEra}
            onConfirm={handleConfirmMove}
            onCancel={handleCancelMove}
          />
        )}
      </div>
    </div>
  );
}
