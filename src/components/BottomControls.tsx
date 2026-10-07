import React from 'react';
import { City, GameState, HexCoord, Unit } from '../types';
import { COSTS } from '../utils/gameLogic';
import { isSameCoord } from '../utils/hex';
import { Shield, Swords, Landmark, FlaskConical, Tent, Flag, Play, CheckCircle2 } from 'lucide-react';

interface BottomControlsProps {
  state: GameState;
  selectedCoord: HexCoord | null;
  isAITurn: boolean;
  onRecruitSoldier: (cityCoord: HexCoord) => void;
  onBuildBarracks: (cityCoord: HexCoord) => void;
  onBuildResearchLab: (cityCoord: HexCoord) => void;
  onRecruitSettler: (cityCoord: HexCoord) => void;
  onFortifyUnit: (unitId: string) => void;
  onFoundCity: (unitId: string) => void;
  onEndTurn: () => void;
  onSelectCapital: () => void;
}

export const BottomControls: React.FC<BottomControlsProps> = ({
  state,
  selectedCoord,
  isAITurn,
  onRecruitSoldier,
  onBuildBarracks,
  onBuildResearchLab,
  onRecruitSettler,
  onFortifyUnit,
  onFoundCity,
  onEndTurn,
  onSelectCapital,
}) => {
  const { units, cities, playerGold, playerEra } = state;

  // Find selected unit or city
  const selectedUnit = units.find((u) => isSameCoord(u.coord, selectedCoord));
  const selectedCity = cities.find((c) => isSameCoord(c.coord, selectedCoord));
  const isPlayerUnit = selectedUnit?.faction === 'PLAYER';
  const isPlayerCity = selectedCity?.faction === 'PLAYER';

  // Count active player units needing orders
  const pendingUnitsCount = units.filter(
    (u) => u.faction === 'PLAYER' && u.movesLeft > 0 && !u.hasAttacked,
  ).length;

  return (
    <footer className="w-full bg-slate-900/98 border-t border-slate-800 px-3 py-2 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-md mx-auto flex flex-col gap-2">
        {/* Info & Action Inspector */}
        <div className="min-h-[56px] flex items-center justify-between gap-2 bg-slate-950/70 rounded-xl p-2 border border-slate-800/80">
          {/* 1. If Player City is selected */}
          {selectedCity && isPlayerCity && (
            <div className="w-full flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-blue-300">
                  <Landmark className="w-4 h-4 text-blue-400" />
                  <span>{selectedCity.name}</span>
                  <span className="text-[10px] text-slate-400">
                    (HP: {selectedCity.hp}/{selectedCity.maxHp})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-300">
                  {selectedCity.buildings.includes('BARRACKS') && (
                    <span className="text-red-400">已建军营</span>
                  )}
                  {selectedCity.buildings.includes('RESEARCH_LAB') && (
                    <span className="text-cyan-400">已建科研所</span>
                  )}
                </div>
              </div>

              {/* City Action Buttons (Instant Purchase) */}
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  disabled={playerGold < COSTS.SOLDIER || isAITurn}
                  onClick={() => onRecruitSoldier(selectedCity.coord)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-[11px] font-bold transition active:scale-95 ${
                    playerGold >= COSTS.SOLDIER && !isAITurn
                      ? 'bg-blue-900/50 hover:bg-blue-800/70 border-blue-600/80 text-blue-100'
                      : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Swords className="w-3.5 h-3.5 mb-0.5 text-blue-400" />
                  <span>士兵</span>
                  <span className="text-[9px] text-amber-300">{COSTS.SOLDIER}💰</span>
                </button>

                <button
                  disabled={
                    playerGold < COSTS.BARRACKS ||
                    selectedCity.buildings.includes('BARRACKS') ||
                    isAITurn
                  }
                  onClick={() => onBuildBarracks(selectedCity.coord)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-[11px] font-bold transition active:scale-95 ${
                    selectedCity.buildings.includes('BARRACKS')
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400 cursor-default'
                      : playerGold >= COSTS.BARRACKS && !isAITurn
                      ? 'bg-red-950/50 hover:bg-red-900/60 border-red-700/80 text-red-100'
                      : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Tent className="w-3.5 h-3.5 mb-0.5 text-red-400" />
                  <span>{selectedCity.buildings.includes('BARRACKS') ? '已造' : '军营'}</span>
                  <span className="text-[9px] text-amber-300">{COSTS.BARRACKS}💰</span>
                </button>

                <button
                  disabled={
                    playerGold < COSTS.RESEARCH_LAB ||
                    selectedCity.buildings.includes('RESEARCH_LAB') ||
                    isAITurn
                  }
                  onClick={() => onBuildResearchLab(selectedCity.coord)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-[11px] font-bold transition active:scale-95 ${
                    selectedCity.buildings.includes('RESEARCH_LAB')
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400 cursor-default'
                      : playerGold >= COSTS.RESEARCH_LAB && !isAITurn
                      ? 'bg-cyan-950/50 hover:bg-cyan-900/60 border-cyan-700/80 text-cyan-100'
                      : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5 mb-0.5 text-cyan-400" />
                  <span>{selectedCity.buildings.includes('RESEARCH_LAB') ? '已造' : '科研所'}</span>
                  <span className="text-[9px] text-amber-300">{COSTS.RESEARCH_LAB}💰</span>
                </button>

                <button
                  disabled={playerGold < COSTS.SETTLER || isAITurn}
                  onClick={() => onRecruitSettler(selectedCity.coord)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-[11px] font-bold transition active:scale-95 ${
                    playerGold >= COSTS.SETTLER && !isAITurn
                      ? 'bg-amber-950/50 hover:bg-amber-900/60 border-amber-600/80 text-amber-100'
                      : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5 mb-0.5 text-amber-400" />
                  <span>开拓者</span>
                  <span className="text-[9px] text-amber-300">{COSTS.SETTLER}💰</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. If Player Unit is selected */}
          {selectedUnit && isPlayerUnit && (
            <div className="w-full flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-100">
                  {selectedUnit.type === 'SETTLER' ? '🚩 我方开拓者' : playerEra === 'MODERN' ? '🔫 现代步兵' : '🗡️ 古代勇士'}
                  {selectedUnit.isFortified && <span className="text-[10px] text-amber-400 font-normal">🛡️驻防(-30%受创)</span>}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                  <span>生命: <b className="text-emerald-400">{selectedUnit.hp}/{selectedUnit.maxHp}</b></span>
                  <span>攻击: <b className="text-red-400">{selectedUnit.attack}</b></span>
                  <span>机动: <b className="text-blue-400">{selectedUnit.movesLeft}/{selectedUnit.maxMoves}</b></span>
                </div>
              </div>

              {/* Unit Actions */}
              <div className="flex items-center gap-1.5">
                {selectedUnit.type === 'SETTLER' ? (
                  <button
                    disabled={isAITurn}
                    onClick={() => onFoundCity(selectedUnit.id)}
                    className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg font-bold text-xs shadow transition active:scale-95"
                  >
                    <Landmark className="w-3.5 h-3.5" />
                    <span>扎根建城</span>
                  </button>
                ) : (
                  <button
                    disabled={selectedUnit.isFortified || isAITurn}
                    onClick={() => onFortifyUnit(selectedUnit.id)}
                    className="flex items-center gap-1 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition active:scale-95"
                  >
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span>驻防(+20HP,减伤30%)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 3. If Enemy Unit or Enemy City is selected */}
          {((selectedUnit && !isPlayerUnit) || (selectedCity && !isPlayerCity)) && (
            <div className="w-full flex items-center justify-between text-xs text-red-300">
              <div className="flex flex-col">
                <span className="font-bold text-red-400">
                  {selectedCity ? `🚩 ${selectedCity.name}` : '⚔️ 敌方部队'}
                </span>
                <span className="text-[11px] text-slate-400">
                  生命: {selectedCity ? `${selectedCity.hp}/${selectedCity.maxHp}` : `${selectedUnit?.hp}/${selectedUnit?.maxHp}`}
                </span>
              </div>
              <span className="text-[10px] text-red-400 bg-red-950/60 px-2 py-1 rounded border border-red-800/60">
                调遣近战士兵贴邻即可发起攻击
              </span>
            </div>
          )}

          {/* 4. If Nothing Selected */}
          {!selectedUnit && !selectedCity && (
            <div className="w-full flex items-center justify-between text-xs text-slate-300">
              <div className="flex flex-col">
                <span className="text-slate-200 font-medium">点击地图上的单位或城市</span>
                <span className="text-[10px] text-slate-400">绿圈移动 · 红圈攻击 · 城市秒招募</span>
              </div>
              <button
                onClick={onSelectCapital}
                className="px-2.5 py-1.5 bg-blue-900/50 hover:bg-blue-800/60 text-blue-300 rounded-lg text-[11px] border border-blue-700/60"
              >
                选中主城
              </button>
            </div>
          )}
        </div>

        {/* Big End Turn Button */}
        <button
          disabled={isAITurn}
          onClick={onEndTurn}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-98 ${
            isAITurn
              ? 'bg-slate-800 text-slate-400 cursor-wait border border-slate-700'
              : pendingUnitsCount > 0
              ? 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white border border-blue-500/50'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/50 animate-pulse'
          }`}
        >
          {isAITurn ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              <span>敌方正在行动中...</span>
            </>
          ) : (
            <>
              <span>下一回合</span>
              <Play className="w-4 h-4 fill-current" />
              {pendingUnitsCount > 0 && (
                <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-full font-normal">
                  {pendingUnitsCount} 个单位待命
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </footer>
  );
};
