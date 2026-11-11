import React, { useState } from 'react';
import { GameProgress, StudentProfile } from '../types';
import { BADGE_DETAILS, ART_MATERIAL_IMAGES } from '../data/constants';
import { isTeamStudioUnlocked } from '../game/rules';
import { audioService } from '../services/audio';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  Send,
} from 'lucide-react';

interface Level4Props {
  student: StudentProfile | null;
  progress: GameProgress;
  onUpdateProgress: (updated: GameProgress) => void;
  onNavigateToLevel: (level: number) => void;
  onOpenStudio: () => void;
  onBackToRoadmap?: () => void;
}

export const Level4MaterialWarehouse: React.FC<Level4Props> = ({
  student,
  progress,
  onUpdateProgress,
  onNavigateToLevel,
  onOpenStudio,
  onBackToRoadmap,
}) => {
  // Mode C migration task state
  const [migrationNotice, setMigrationNotice] = useState<string>('');
  const [migrationSubmitted, setMigrationSubmitted] = useState<boolean>(false);
  const [isSpeakingRecap, setIsSpeakingRecap] = useState<boolean>(false);

  // Mode B self-verification state
  const [decoderCheckedItems, setDecoderCheckedItems] = useState<{ [key: string]: boolean }>({
    glue: true,
    paper: true,
    scissors: true,
    sticker: true,
  });

  const isExplorer = student?.mode === 'explorer';
  const isDecoder = student?.mode === 'decoder';
  const isMaster = student?.mode === 'master';

  const badgeImages: Record<'glue' | 'paper' | 'scissors' | 'sticker', string> = {
    glue: BADGE_DETAILS.glue.image,
    paper: BADGE_DETAILS.paper.image,
    scissors: BADGE_DETAILS.scissors.image,
    sticker: BADGE_DETAILS.sticker.image,
  };

  const badges = [
    { key: 'glue' as const, name: BADGE_DETAILS.glue.name, fromLevel: 1 },
    { key: 'paper' as const, name: BADGE_DETAILS.paper.name, fromLevel: 2 },
    { key: 'scissors' as const, name: BADGE_DETAILS.scissors.name, fromLevel: 3 },
    { key: 'sticker' as const, name: BADGE_DETAILS.sticker.name, fromLevel: 4 },
  ];

  const earnedCount = Object.values(progress.badges).filter(Boolean).length;
  const isAllCollected = isTeamStudioUnlocked(progress.badges);

  // If student arrived at level 4 having completed 1, 2, 3, award the sticker badge
  React.useEffect(() => {
    if (!progress.badges.sticker && progress.badges.glue && progress.badges.paper && progress.badges.scissors) {
      handleClaimStickerBadge();
    }
  }, [progress.badges.glue, progress.badges.paper, progress.badges.scissors, progress.badges.sticker]);

  const handleClaimStickerBadge = () => {
    if (!progress.badges.sticker) {
      audioService.playCelebrationChime();
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }

      const updated: GameProgress = {
        ...progress,
        currentLevel: Math.max(progress.currentLevel, 5),
        badges: {
          ...progress.badges,
          sticker: true,
        },
        score: progress.score + (isMaster ? 60 : isDecoder ? 50 : 40),
        completedTasks: Array.from(new Set([...progress.completedTasks, 'level4_material_warehouse'])),
        updatedAt: new Date().toISOString(),
      };
      onUpdateProgress(updated);
    }
  };

  const handlePlayRecapAudio = () => {
    setIsSpeakingRecap(true);
    audioService.playTeacherNotice(
      undefined,
      () => setIsSpeakingRecap(false),
      0.85
    );
  };

  const handleMigrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!migrationNotice.trim()) return;
    setMigrationSubmitted(true);
    audioService.playCelebrationChime();

    // Award +60 Master transfer points
    const updated: GameProgress = {
      ...progress,
      score: progress.score + 60,
      completedTasks: Array.from(new Set([...progress.completedTasks, 'level4_master_migration'])),
      updatedAt: new Date().toISOString(),
    };
    onUpdateProgress(updated);
  };

  const canEnterStudio = isAllCollected && (!isMaster || migrationSubmitted);

  const handleEnterStudio = () => {
    if (!canEnterStudio) return;
    if (progress.currentLevel < 5) {
      onUpdateProgress({
        ...progress,
        currentLevel: 5,
        updatedAt: new Date().toISOString(),
      });
    }
    onOpenStudio();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBackToRoadmap && (
            <button
              onClick={onBackToRoadmap}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-[#263D64]/15 hover:bg-amber-50 text-xs font-bold text-[#263D64] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>← 返回学习路线</span>
            </button>
          )}
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
          <span>🏛️ 关卡四 · 艺术材料仓库</span>
        </div>
        <div className="w-16" />
      </div>

      {/* Mode Differentiation Guidance Strip */}
      <div className="p-3.5 rounded-2xl bg-white border-2 border-[#263D64]/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {isExplorer ? '🌟' : isDecoder ? '🔍' : '🎓'}
          </span>
          <div>
            <div className="font-black text-[#263D64]">
              当前模式：{isExplorer ? '小小探索家' : isDecoder ? '独立解密员' : '声音密码大师'}
            </div>
            <div className="text-[#263D64]/70">
              {isExplorer
                ? '提供材料发音语音点名、图文用法提示与友好验收'
                : isDecoder
                ? '自主核验四样必备材料清单与保管要求，独立过关'
                : '高阶迁移关：设计科学课新情境口头通知，验证要素迁移能力'}
            </div>
          </div>
        </div>
        <div className="px-3 py-1 bg-amber-100 text-amber-900 font-black rounded-lg text-[11px] shrink-0">
          SP 1.2.1 任务达标大检视
        </div>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-[#263D64]">四样必备材料大检视</h1>
        <p className="text-xs sm:text-sm text-[#263D64]/70 max-w-xl mx-auto">
          请检查你的四枚材料徽章。必须收齐全部四样材料，才可以推开三人艺术工作室的大门！
        </p>
      </div>

      {/* Badges Collection Grid (四格材料收藏区) */}
      <div className="storybook-card rounded-3xl p-6 sm:p-8 bg-white space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#263D64]/10 pb-4">
          <div>
            <h2 className="text-lg font-black text-[#263D64] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#F4C66A]" />
              <span>艺术展收藏徽章柜（当前已集齐 {earnedCount} / 4 枚）</span>
            </h2>
            <div className="text-xs text-[#263D64]/65">缺少徽章可点击卡片一键返回关卡重温获得</div>
          </div>

          {!progress.badges.sticker && progress.badges.glue && progress.badges.paper && progress.badges.scissors && (
            <button
              onClick={handleClaimStickerBadge}
              className="px-4 py-2 rounded-xl bg-[#F4C66A] hover:bg-[#F4C66A]/90 text-[#263D64] text-xs font-black shadow-md transition-transform hover:scale-105 flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>验收达标 · 领取展览钥匙徽章</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((b) => {
            const details = BADGE_DETAILS[b.key];
            const isEarned = progress.badges[b.key];

            return (
              <div
                key={b.key}
                className={`p-5 rounded-2xl border-2 flex flex-col justify-between transition-all ${
                  isEarned
                    ? 'bg-amber-50/70 border-[#F4C66A] shadow-md scale-102'
                    : 'bg-[#FFF5E5]/40 border-dashed border-[#263D64]/20 opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-16 h-16 rounded-2xl bg-white p-2 border border-amber-200/60 shadow-xs flex items-center justify-center overflow-hidden">
                      <img
                        src={badgeImages[b.key]}
                        alt={details.name}
                        className={`w-full h-full object-contain transition-all ${
                          isEarned ? 'filter drop-shadow-xs' : 'grayscale opacity-40'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        isEarned
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isEarned ? '已收入仓库' : '尚未收齐'}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-[#263D64]">{details.name}</h3>
                  <p className="text-xs text-[#263D64]/70 mt-1 leading-snug">{details.desc}</p>
                </div>

                <div className="pt-4 border-t border-[#263D64]/10 mt-4">
                  {isEarned ? (
                    <div className="flex items-center gap-1 text-xs font-black text-[#8CBF9E]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>已就绪</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onNavigateToLevel(b.fromLevel)}
                      className="w-full py-2 rounded-xl bg-white border border-[#263D64]/20 hover:border-[#F4C66A] hover:bg-amber-50 text-[11px] font-black text-[#263D64] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>前往第 {b.fromLevel} 关补齐</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mode A: 小小探索家专属语音点名与用法提示 */}
      {isExplorer && (
        <div className="storybook-card-warm rounded-3xl p-6 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌟</span>
              <div>
                <h3 className="text-base font-black text-[#263D64]">
                  探索家学习支架：材料大点名与语音复习
                </h3>
                <p className="text-xs text-[#263D64]/70">
                  点击播放慢速语音，边听边在脑海中检查四样宝贝！
                </p>
              </div>
            </div>

            <button
              onClick={handlePlayRecapAudio}
              disabled={isSpeakingRecap}
              className="px-4 py-2 rounded-xl bg-[#263D64] hover:bg-[#263D64]/90 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span>{isSpeakingRecap ? '🔊 正在播放慢速通知...' : '🔊 播放慢速通知复习'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              ART_MATERIAL_IMAGES.glue,
              ART_MATERIAL_IMAGES.coloredPaper,
              ART_MATERIAL_IMAGES.scissors,
              ART_MATERIAL_IMAGES.stickers,
            ].map((imgSrc, idx) => (
              <div
                key={idx}
                className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200 flex items-center justify-center h-24 sm:h-28"
              >
                {/* 图片纯视觉呈现，底部绝对不添加任何文字 */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                  <img
                    src={imgSrc}
                    alt="美术用品"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode B: 独立解密员自主复核清单 */}
      {isDecoder && (
        <div className="storybook-card rounded-3xl p-6 bg-white space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            <div>
              <h3 className="text-base font-black text-[#263D64]">
                解密员自主核验：必备清单与行动要求自查
              </h3>
              <p className="text-xs text-[#263D64]/70">
                请独立核对通知中的四项准备要求与放置要求：
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FFF5E5] border border-[#263D64]/10 cursor-pointer">
              <input
                type="checkbox"
                checked={decoderCheckedItems.glue}
                onChange={(e) => setDecoderCheckedItems({ ...decoderCheckedItems, glue: e.target.checked })}
                className="w-4 h-4 accent-[#263D64]"
              />
              <span className="font-bold text-[#263D64]">已核对必备材料：胶水（用于手工粘合）</span>
            </label>
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FFF5E5] border border-[#263D64]/10 cursor-pointer">
              <input
                type="checkbox"
                checked={decoderCheckedItems.paper}
                onChange={(e) => setDecoderCheckedItems({ ...decoderCheckedItems, paper: e.target.checked })}
                className="w-4 h-4 accent-[#263D64]"
              />
              <span className="font-bold text-[#263D64]">已核对必备材料：彩色纸（用于拼贴造型）</span>
            </label>
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FFF5E5] border border-[#263D64]/10 cursor-pointer">
              <input
                type="checkbox"
                checked={decoderCheckedItems.scissors}
                onChange={(e) => setDecoderCheckedItems({ ...decoderCheckedItems, scissors: e.target.checked })}
                className="w-4 h-4 accent-[#263D64]"
              />
              <span className="font-bold text-[#263D64]">已核对必备材料：剪刀（安全圆头）</span>
            </label>
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FFF5E5] border border-[#263D64]/10 cursor-pointer">
              <input
                type="checkbox"
                checked={decoderCheckedItems.sticker}
                onChange={(e) => setDecoderCheckedItems({ ...decoderCheckedItems, sticker: e.target.checked })}
                className="w-4 h-4 accent-[#263D64]"
              />
              <span className="font-bold text-[#263D64]">已核对必备材料：贴纸（用于点缀）</span>
            </label>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>核心动作要求：用品放进书包，明天带到学校。核对无误！</span>
          </div>
        </div>
      )}

      {/* Mode C: 声音密码大师迁移挑战 */}
      {isMaster && (
        <div className="storybook-card-warm rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            <div>
              <h2 className="text-lg font-black text-[#263D64]">
                大师专属挑战：迁移设计与情境表达 (+60分)
              </h2>
              <div className="text-xs text-[#263D64]/70">
                如果明天改上科学课，老师要求准备【放大镜】和【透明直尺】，尝试为同伴写一则口头通知！
              </div>
            </div>
          </div>

          <form onSubmit={handleMigrationSubmit} className="space-y-3">
            <textarea
              value={migrationNotice}
              onChange={(e) => setMigrationNotice(e.target.value)}
              placeholder="例如：请大家准备好两样科学实验工具：放大镜和透明直尺，上课记得带来！"
              rows={3}
              className="w-full p-4 rounded-2xl bg-white border-2 border-[#263D64]/20 text-sm text-[#263D64] font-medium focus:outline-hidden focus:border-[#263D64]"
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs text-[#263D64]/70 font-bold">
                {migrationSubmitted
                  ? '✓ 迁移通知已成功提交！获得大师思维加分 (+60分)！'
                  : '提示：通知需包含称呼、时间、科目、用品（放大镜、透明直尺）及存放要求'}
              </span>
              <button
                type="submit"
                disabled={!migrationNotice.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#263D64] hover:bg-[#263D64]/90 text-white font-black text-xs disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{migrationSubmitted ? '已提交 (可再次修改)' : '提交口头通知设计 (+60分)'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Unlock Status Card */}
      <div className="storybook-card rounded-3xl p-6 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="text-base font-black text-[#263D64] flex items-center justify-center sm:justify-start gap-2">
            {canEnterStudio ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-[#8CBF9E]" />
                <span>四样材料全部收齐！三人艺术工作室已解锁！</span>
              </>
            ) : isMaster && !migrationSubmitted ? (
              <>
                <Lock className="w-5 h-5 text-[#F28C75]" />
                <span>大师模式进阶要求：请先提交新情境口头通知设计！</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 text-[#F28C75]" />
                <span>还差 {4 - earnedCount} 枚材料徽章，加把劲！</span>
              </>
            )}
          </div>
          <p className="text-xs text-[#263D64]/65">
            在关卡五中，你将与同班的两位声音寻宝员组成三人小组，合作完成展厅巨型拼贴画！
          </p>
        </div>

        <div>
          {canEnterStudio ? (
            <button
              onClick={handleEnterStudio}
              className="px-8 py-3.5 rounded-2xl bg-[#F4C66A] hover:bg-[#F4C66A]/90 text-[#263D64] font-black text-base shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-[#263D64]" />
              <span>进入三人艺术工作室</span>
            </button>
          ) : (
            <button
              disabled
              className="px-6 py-3 rounded-2xl bg-slate-100 text-slate-400 font-bold text-sm cursor-not-allowed"
            >
              {isMaster && !migrationSubmitted ? '请先提交口头通知设计' : '未集齐徽章，无法进入'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
