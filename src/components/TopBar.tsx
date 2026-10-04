import React from 'react';
import { GameState } from '../types';
import { Coins, Hourglass, HelpCircle, RotateCcw, FlaskConical, ShieldAlert, Sparkles } from 'lucide-react';

interface TopBarProps {
  state: GameState;
  onOpenHelp: () => void;
  onRestart: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ state, onOpenHelp, onRestart }) => {
  const playerCities = state.cities.filter((c) => c.faction === 'PLAYER');
  const baseIncome = playerCities.reduce((acc, c) => acc + c.goldPerTurn, 0);
  const researchLabs = playerCities.filter((c) => c.buildings.includes('RESEARCH_LAB')).length;

  const isModern = state.playerEra === 'MODERN';

  return (
    <header className="w-full bg-slate-900/95 border-b border-slate-700/80 px-3 py-2 select-none backdrop-blur shadow-md">
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
        {/* Left: Gold & Income */}
        <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1.5 rounded-lg border border-amber-500/30 text-xs">
          <Coins className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-amber-300 text-sm">{state.playerGold}</span>
            <span className="text-[10px] text-emerald-400 font-medium">+{baseIncome}/回合</span>
          </div>
        </div>

        {/* Center: Era & Science Progress */}
        <div className="flex-1 flex flex-col items-center justify-center px-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            {isModern ? (
              <span className="inline-flex items-center gap-1 text-xs font-black text-cyan-300 bg-cyan-950/80 border border-cyan-400/50 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.4)] animate-pulse">
                <Sparkles className="w-3 h-3 text-cyan-300" />
                现代时代
              </span>
            ) : (
              <div className="flex items-center gap-1 text-[11px] text-amber-200 font-semibold">
                <span>🏛️ 古代</span>
                <span className="text-slate-400">➔</span>
                <span className="text-slate-300">🚀 现代</span>
              </div>
            )}
          </div>

          {!isModern && (
            <div className="w-full max-w-[130px] flex items-center gap-1 text-[10px]">
              <FlaskConical className="w-3 h-3 text-indigo-400 shrink-0" />
              <div className="flex-1 bg-slate-800 rounded-full h-2 border border-indigo-500/30 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, (state.playerScience / state.scienceRequired) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-indigo-300 font-bold shrink-0">
                {state.playerScience}/{state.scienceRequired}
              </span>
            </div>
          )}

          {researchLabs > 0 && !isModern && (
            <span className="text-[9px] text-cyan-400 leading-none mt-0.5">
              +{researchLabs} 科技/回合
            </span>
          )}
        </div>

        {/* Right: Turns & Actions */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-slate-800/90 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs">
            <Hourglass className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <div className="flex flex-col items-end leading-tight font-mono">
              <span className="font-bold text-slate-100 text-sm">
                {state.turn}<span className="text-slate-400 text-[10px]">/{state.maxTurns}</span>
              </span>
              <span className="text-[9px] text-slate-400">回合</span>
            </div>
          </div>

          <button
            onClick={onOpenHelp}
            aria-label="游戏规则"
            className="p-2 text-slate-300 hover:text-white bg-slate-800 active:bg-slate-700 rounded-lg border border-slate-700 hover:border-slate-600 transition"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onRestart}
            aria-label="重开一局"
            title="重开一局"
            className="p-2 text-slate-400 hover:text-amber-400 bg-slate-800 active:bg-slate-700 rounded-lg border border-slate-700 hover:border-slate-600 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
