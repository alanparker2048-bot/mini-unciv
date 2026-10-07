import React from 'react';
import { Unit, HexCoord, Tile, Era } from '../types';
import { hexDistance } from '../utils/hex';
import { Footprints, Check, X, Shield, Compass } from 'lucide-react';

interface MoveConfirmModalProps {
  unit: Unit | null;
  targetCoord: HexCoord | null;
  targetTile?: Tile;
  playerEra: Era;
  onConfirm: () => void;
  onCancel: () => void;
}

export const MoveConfirmModal: React.FC<MoveConfirmModalProps> = ({
  unit,
  targetCoord,
  targetTile,
  playerEra,
  onConfirm,
  onCancel,
}) => {
  if (!unit || !targetCoord) return null;

  const dist = hexDistance(unit.coord, targetCoord);
  const remainingMoves = Math.max(0, unit.movesLeft - dist);

  const unitName =
    unit.type === 'SETTLER'
      ? '开拓者'
      : playerEra === 'MODERN'
      ? '突击步兵 (现代)'
      : '古代勇士';

  const terrainName = targetTile
    ? {
        PLAINS: '平原',
        FOREST: '森林',
        HILLS: '丘陵',
        MOUNTAIN: '山脉',
        RESOURCE: '金矿点',
      }[targetTile.terrain] || '地块'
    : '目标地块';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn select-none"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-xs bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 transform transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Footprints className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-100 tracking-wide">
            确认移动吗？
          </h3>
        </div>

        {/* Content Details */}
        <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">操作单位</span>
            <span className="font-semibold text-slate-200">{unitName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">目标地块</span>
            <span className="font-semibold text-emerald-300 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              {terrainName}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">机动力消耗</span>
            <span className="font-semibold text-amber-300">
              {dist} 点 (剩余 {remainingMoves}/{unit.maxMoves})
            </span>
          </div>
        </div>

        {/* Action Buttons: 取消 & 确认 */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-400" />
            取消
          </button>

          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-900/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4 text-white" />
            确认
          </button>
        </div>
      </div>
    </div>
  );
};
