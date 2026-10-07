import React from 'react';
import { X, Swords, Landmark, FlaskConical, Flag, Sparkles, Shield } from 'lucide-react';
import { COSTS } from '../utils/gameLogic';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-1.5 font-black text-sm text-slate-100">
            <span className="text-amber-400">⚡ 5分钟速通规则</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 py-3 text-xs text-slate-300">
          {/* Section 1: Two Eras */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300 mb-1.5">
              <Sparkles className="w-4 h-4" />
              <span>双时代：古代 ➔ 现代</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              城市建造【科研所】后，每回合积累科技点。攒满 3 点即可引爆<b>【时代跃迁】</b>！所有士兵立刻蜕变为<b>现代步兵</b>（攻击翻倍至 85，一击秒杀古代士兵，两枪射塌城市）！
            </p>
          </div>

          {/* Section 2: Three Buildings */}
          <div className="flex flex-col gap-2">
            <div className="font-bold text-slate-200 flex items-center gap-1">
              <Landmark className="w-3.5 h-3.5 text-blue-400" />
              <span>3 种核心建筑 (城市内建造)</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 text-[11px]">
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex items-start gap-2">
                <span className="text-base">🏛️</span>
                <div>
                  <span className="font-bold text-slate-200">城市主城</span>
                  <p className="text-slate-400">每回合产出 +10 金币；自带 20 守城反击炮火。</p>
                </div>
              </div>

              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex items-start gap-2">
                <span className="text-base">⛺</span>
                <div>
                  <span className="font-bold text-red-300">军营 ({COSTS.BARRACKS}金)</span>
                  <p className="text-slate-400">永久增强本方士兵攻击力（伤害 +25%）。</p>
                </div>
              </div>

              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex items-start gap-2">
                <span className="text-base">🔬</span>
                <div>
                  <span className="font-bold text-cyan-300">科研所 ({COSTS.RESEARCH_LAB}金)</span>
                  <p className="text-slate-400">每回合 +1 科技点，3回合即可保送进入【现代时代】！</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Two Units */}
          <div className="flex flex-col gap-2">
            <div className="font-bold text-slate-200 flex items-center gap-1">
              <Swords className="w-3.5 h-3.5 text-red-400" />
              <span>2 种核心单位 (即买即用)</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 text-[11px]">
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex items-start gap-2">
                <span className="text-base">🗡️</span>
                <div>
                  <span className="font-bold text-blue-300">士兵 ({COSTS.SOLDIER}金)</span>
                  <p className="text-slate-400">负责探路、占领与攻坚。可原地【驻防】回血20点并获得30%受创减免！</p>
                </div>
              </div>

              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex items-start gap-2">
                <span className="text-base">🚩</span>
                <div>
                  <span className="font-bold text-amber-300">开拓者 ({COSTS.SETTLER}金)</span>
                  <p className="text-slate-400">移动到空地点击【扎根建城】，开拓新分城赚取双倍收入！</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Fast Victory */}
          <div className="bg-amber-950/30 p-2.5 rounded-xl border border-amber-800/40 text-[11px] text-amber-200/90 leading-relaxed">
            <b>🏆 胜负判定：</b><br />
            1. 攻克敌方首都直接拿下<b>征服胜利</b>！<br />
            2. 满 10 回合自动结清积分，时代高者与控城多者胜出。
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-2 w-full py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
        >
          我知道了，开始对战！
        </button>
      </div>
    </div>
  );
};
