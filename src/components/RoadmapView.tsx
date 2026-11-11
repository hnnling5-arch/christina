import React from 'react';
import { GameProgress, StudentProfile } from '../types';
import { BADGE_DETAILS } from '../data/constants';
import { isTeamStudioUnlocked } from '../game/rules';
import {
  CheckCircle2,
  Lock,
  Play,
  Sparkles,
  Headphones,
  Search,
  FlaskConical,
  Package,
  Palette,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

interface RoadmapViewProps {
  progress: GameProgress;
  student: StudentProfile | null;
  onNavigateToLevel: (level: number) => void;
  onOpenStudio: () => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  progress,
  student,
  onNavigateToLevel,
  onOpenStudio,
}) => {
  const levels = [
    {
      level: 1,
      title: '关卡一：声音档案室',
      focus: '安静聆听、边听边记边想',
      desc: '专心聆听老师口头通知，在四格记录卡上记录重点用品，回答3道基础理解题。',
      badgeKey: 'glue' as const,
      IconComponent: Headphones,
      targetBadge: '闪亮星星徽章',
    },
    {
      level: 2,
      title: '关卡二：失落材料搜查局',
      focus: '从六种用品中分类，剔除干扰',
      desc: '六种文具混在一起了！认真分辨通知中提到的四种用品和没有提到的两种干扰用品。',
      badgeKey: 'paper' as const,
      IconComponent: Search,
      targetBadge: '艺术画框徽章',
    },
    {
      level: 3,
      title: '关卡三：声音密码实验室',
      focus: '填空、选图、排序与口头表达',
      desc: '完成填一填、找一找、排一排、选一选和说一说，说出“我听到老师说要准备……”。',
      badgeKey: 'scissors' as const,
      IconComponent: FlaskConical,
      targetBadge: '魔法灯笼徽章',
    },
    {
      level: 4,
      title: '关卡四：艺术材料仓库',
      focus: '徽章清点与迁移应用',
      desc: '艺术展徽章总检视。若缺少某一枚可返回补全；在大师模式下还可尝试设计新通知！',
      badgeKey: 'sticker' as const,
      IconComponent: Package,
      targetBadge: '展览钥匙徽章',
    },
    {
      level: 5,
      title: '关卡五：三人艺术拼图工坊',
      focus: '同班三人合作完成剪贴拼图',
      desc: '集齐四枚徽章后解锁！运用剪刀、贴纸、胶水、彩色纸四大材料，共同拼接艺术展大作。',
      badgeKey: null,
      IconComponent: Palette,
      targetBadge: '展厅巨型拼图杰作',
    },
  ];

  const studioUnlocked = isTeamStudioUnlocked(progress.badges);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4C66A]/30 text-[#263D64] text-xs font-bold">
          <Sparkles className="w-4 h-4 text-[#F4C66A]" />
          <span>声音寻宝路线图</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#263D64]">探险旅程与关卡地图</h1>
        <p className="text-sm text-[#263D64]/70 max-w-xl mx-auto">
          请按照路线依次闯关。核心听力任务不可跳过，收齐四枚艺术展徽章即可叩响三人艺术工作室大门！
        </p>
      </div>

      {/* Badges Progress Strip */}
      <div className="storybook-card rounded-2xl p-5 bg-white/90">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-sm font-black text-[#263D64]">艺术展四大珍藏徽章收集进度</div>
            <div className="text-xs text-[#263D64]/60">只有集齐全部4枚，才可以解锁关卡五团队工作室</div>
          </div>
          <div className="flex items-center gap-3">
            {(['glue', 'paper', 'scissors', 'sticker'] as const).map((bKey) => {
              const details = BADGE_DETAILS[bKey];
              const isEarned = progress.badges[bKey];
              return (
                <div
                  key={bKey}
                  className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center p-1.5 transition-all ${
                    isEarned
                      ? 'bg-amber-50 border-[#F4C66A] shadow-md scale-105 ring-2 ring-[#F4C66A]/40'
                      : 'bg-slate-100 border-slate-300 opacity-40 grayscale'
                  }`}
                  title={`${details.name}: ${isEarned ? '已获得' : '尚未获得'}`}
                >
                  <img
                    src={details.image}
                    alt={details.name}
                    className="w-7 h-7 object-contain drop-shadow-xs"
                  />
                  <span className="text-[9px] font-black text-[#263D64] leading-tight mt-0.5 truncate max-w-full">
                    {isEarned ? '已集齐' : '未得'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Vertical Storybook Path */}
      <div className="relative pl-6 sm:pl-10 space-y-8 before:absolute before:left-3 sm:before:left-5 before:top-4 before:bottom-4 before:w-1.5 before:bg-[#8CBF9E]/30 before:rounded-full">
        {levels.map((lvl) => {
          const isUnlocked = progress.currentLevel >= lvl.level;
          const isCurrent = progress.currentLevel === lvl.level;
          const isBadgeEarned = lvl.badgeKey ? progress.badges[lvl.badgeKey] : studioUnlocked;
          const IconComp = lvl.IconComponent;

          return (
            <div key={lvl.level} className="relative">
              {/* Dot on the timeline */}
              <div
                className={`absolute -left-6 sm:-left-10 top-6 w-8 h-8 rounded-full border-4 flex items-center justify-center text-xs font-black transition-all ${
                  isBadgeEarned
                    ? 'bg-[#8CBF9E] text-white border-white shadow-md'
                    : isCurrent
                    ? 'bg-[#F4C66A] text-[#263D64] border-white shadow-md ring-4 ring-[#F4C66A]/30 scale-110'
                    : 'bg-white text-slate-400 border-slate-200'
                }`}
              >
                {isBadgeEarned ? '✓' : lvl.level}
              </div>

              {/* Card */}
              <div
                className={`p-6 rounded-3xl border-2 transition-all ${
                  isCurrent
                    ? 'bg-white border-[#F4C66A] shadow-xl ring-2 ring-[#F4C66A]'
                    : isUnlocked
                    ? 'bg-white/90 border-[#263D64]/15 hover:border-[#263D64]/40'
                    : 'bg-white/50 border-dashed border-[#263D64]/15 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-[#263D64]">
                      <IconComp className="w-5 h-5 text-[#263D64]" />
                    </div>
                    <h3 className="text-lg font-black text-[#263D64]">{lvl.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {isBadgeEarned ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-[#8CBF9E] bg-[#8CBF9E]/15 px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>已通关 · 获得{lvl.targetBadge}</span>
                      </span>
                    ) : isCurrent ? (
                      <span className="text-xs font-black text-[#263D64] bg-[#F4C66A] px-3 py-1 rounded-full">
                        正在进行中
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        <Lock className="w-3.5 h-3.5" />
                        <span>未解锁</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs font-bold text-[#F28C75] mb-2">{lvl.focus}</div>
                <p className="text-xs sm:text-sm text-[#263D64]/70 leading-relaxed mb-4">{lvl.desc}</p>

                {/* Level Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  {isUnlocked && (
                    <button
                      onClick={() => (lvl.level === 5 ? onOpenStudio() : onNavigateToLevel(lvl.level))}
                      className={`px-6 py-3.5 rounded-2xl text-sm sm:text-base font-black transition-all flex items-center gap-2 cursor-pointer min-h-[48px] touch-manipulation active:scale-95 ${
                        isCurrent
                          ? 'bg-[#F4C66A] text-[#263D64] hover:bg-[#F4C66A]/90 shadow-md ring-2 ring-[#F4C66A]/50'
                          : 'bg-[#FFF5E5] text-[#263D64] hover:bg-amber-100 border-2 border-[#263D64]/15'
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>开始闯关</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>重新体验</span>
                        </>
                      )}
                    </button>
                  )}
                  {lvl.level === 5 && !studioUnlocked && (
                    <span className="text-xs text-[#F28C75] font-bold flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>需在关卡1-4收齐全部4枚徽章后方可进入</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

