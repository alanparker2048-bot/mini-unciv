import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameState } from '../types';
import { Trophy, Skull, RotateCcw, Award, CheckCircle } from 'lucide-react';
import { playVictorySound } from '../utils/audio';

interface VictoryModalProps {
  state: GameState;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ state, onRestart }) => {
  const isWon = state.status === 'PLAYER_WON';
  const isDraw = state.status === 'DRAW';

  useEffect(() => {
    if (isWon) {
      playVictorySound();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [isWon]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-lg ${
            isWon
              ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-400'
              : isDraw
              ? 'bg-blue-500/20 border-2 border-blue-400 text-blue-400'
              : 'bg-red-500/20 border-2 border-red-500 text-red-500'
          }`}
        >
          {isWon ? (
            <Trophy className="w-9 h-9 animate-bounce" />
          ) : isDraw ? (
            <Award className="w-9 h-9" />
          ) : (
            <Skull className="w-9 h-9" />
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black mb-1">
          {isWon ? (
            <span className="text-amber-400">大获全胜！</span>
          ) : isDraw ? (
            <span className="text-blue-300">握手言和！</span>
          ) : (
            <span className="text-red-400">战役惜败</span>
          )}
        </h2>

        {/* Subtitle / Reason */}
        <p className="text-xs text-slate-300 mb-4 px-2 leading-relaxed">
          {state.winReason || (isWon ? '敌方势力已被肃清！' : '首都失守，重整旗鼓再来！')}
        </p>

        {/* Stats Card */}
        <div className="w-full bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs mb-5 flex flex-col gap-2">
          <div className="flex justify-between text-slate-400">
            <span>决战总回合:</span>
            <span className="font-bold text-slate-100">{state.turn} / {state.maxTurns}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>我方最终时代:</span>
            <span className="font-bold text-cyan-300">
              {state.playerEra === 'MODERN' ? '🚀 现代时代' : '🏛️ 古代时代'}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>占有城市数:</span>
            <span className="font-bold text-slate-100">
              {state.cities.filter((c) => c.faction === 'PLAYER').length} 座
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>幸存主力兵团:</span>
            <span className="font-bold text-slate-100">
              {state.units.filter((u) => u.faction === 'PLAYER').length} 支
            </span>
          </div>
        </div>

        {/* Restart Button */}
        <button
          onClick={onRestart}
          className="w-full py-3 px-6 rounded-xl font-black text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>再来一局 (5分钟)</span>
        </button>
      </div>
    </div>
  );
};
