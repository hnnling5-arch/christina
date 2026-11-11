import React from 'react';
import { StudentProfile, GameProgress } from '../types';
import { MODE_INFO } from '../data/constants';
import {
  Sparkles,
  Play,
  Award,
  Compass,
  Palette,
  CheckCircle,
  Star,
  Search,
  Key,
  Shield,
  Layers,
  Users,
  Lock,
} from 'lucide-react';

interface HeroHomeProps {
  student: StudentProfile | null;
  progress: GameProgress;
  onStartQuest: () => void;
  onNavigateToLevel: (level: number) => void;
  onOpenRoadmap: () => void;
  onOpenBadges: () => void;
  onOpenVideo?: () => void; // Kept optional for backward-compatibility
  onOpenStudio: () => void;
  onOpenDraw?: () => void;
}

export const HeroHome: React.FC<HeroHomeProps> = ({
  student,
  progress,
  onStartQuest,
  onNavigateToLevel,
  onOpenRoadmap,
  onOpenBadges,
  onOpenStudio,
  onOpenDraw,
}) => {
  const modeInfo = student ? MODE_INFO[student.mode] : MODE_INFO.explorer;
  const badgesCount = Object.values(progress.badges).filter(Boolean).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Showcase Split */}
      <section className="storybook-card rounded-3xl p-6 sm:p-10 relative overflow-hidden bg-white/90">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Zone */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black px-3 py-1 bg-amber-100 text-amber-900 rounded-lg border border-amber-200">
                校园艺术展 · 声音密码大冒险
              </span>
              <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-900 rounded-lg border border-emerald-200">
                静心聆听 · 寻找材料
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#263D64] tracking-tight leading-tight select-none">
              <span className="inline-block">
                {'失落的艺术展'.split('').map((char, i) => (
                  <span
                    key={i}
                    className="bounce-letter inline-block hover:scale-125 transition-transform"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    {char}
                  </span>
                ))}
              </span>{' '}
              <br />
              <span className="text-[#F28C75] inline-block mt-1">
                {'声音寻宝大冒险'.split('').map((char, i) => (
                  <span
                    key={i}
                    className="bounce-letter inline-block hover:scale-125 transition-transform"
                    style={{ animationDelay: `${(i + 6) * 80}ms` }}
                  >
                    {char}
                  </span>
                ))}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#263D64]/80 leading-relaxed font-medium">
              学校即将举办一场盛大的声音艺术展！展览中央有一幅尚未完成的巨型拼贴画。
              现在，化身为<strong>小小寻宝员</strong>，安静聆听老师的口头通知，
              集齐<strong>四枚艺术展收藏徽章</strong>，和班上伙伴一起完成拼贴杰作吧！
            </p>

            {/* Quick Stats & Badges Bar (Pure Lucide icons, NO unicode emojis) */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="bg-[#FFF5E5] px-4 py-2.5 rounded-2xl border border-[#263D64]/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-[#263D64]/60 font-bold">收藏徽章</div>
                  <div className="text-sm font-black text-[#263D64]">{badgesCount} / 4 枚</div>
                </div>
              </div>

              <div className="bg-[#FFF5E5] px-4 py-2.5 rounded-2xl border border-[#263D64]/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                </div>
                <div>
                  <div className="text-[11px] text-[#263D64]/60 font-bold">寻宝积分</div>
                  <div className="text-sm font-black text-[#263D64]">{progress.score} 分</div>
                </div>
              </div>

              <div className="bg-[#FFF5E5] px-4 py-2.5 rounded-2xl border border-[#263D64]/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-[#263D64]/60 font-bold">当前玩法</div>
                  <div className="text-sm font-black text-[#263D64]">{modeInfo.title}</div>
                </div>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onStartQuest}
                className="w-full sm:w-auto px-7 py-3.5 bg-[#F4C66A] hover:bg-[#F4C66A]/90 text-[#263D64] font-black text-base rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>开始冒险 · 第 {progress.currentLevel} 关</span>
              </button>

              <button
                onClick={onOpenRoadmap}
                className="w-full sm:w-auto px-5 py-3.5 bg-white border-2 border-[#263D64]/20 hover:border-[#263D64] text-[#263D64] font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>我的冒险</span>
              </button>

              {onOpenDraw && progress.completed ? (
                <button
                  onClick={onOpenDraw}
                  className="w-full sm:w-auto px-5 py-3.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 animate-pulse"
                >
                  <Palette className="w-4 h-4" />
                  <span>进入创艺园地（已解锁）</span>
                </button>
              ) : onOpenDraw ? (
                <div
                  title="完成当前模式全部关卡后解锁创艺园地"
                  className="w-full sm:w-auto px-4 py-3.5 bg-slate-100 border-2 border-dashed border-slate-300 text-slate-400 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 opacity-80 select-none"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>创艺园地（通关后开启）</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right Visual Image (Animated Alive Exhibition Art) */}
          <div className="lg:col-span-5 relative">
            {/* Ambient Background Glow */}
            <div className="absolute -inset-2 bg-gradient-to-r from-amber-300/40 via-rose-300/30 to-purple-300/40 rounded-3xl blur-xl opacity-70 animate-pulse pointer-events-none" />

            {/* Floating Image Frame */}
            <div className="relative rounded-3xl overflow-hidden border-4 border-white shadow-2xl animate-exhibition-float group">
              <img
                src="/src/assets/images/hero_art_exhibition_1794245343012.jpg"
                alt="失落的艺术展大厅插画"
                className="w-full h-auto object-cover max-h-[360px] transform transition-transform duration-700 group-hover:scale-105"
              />

              {/* Periodic Animated Light Reflection Sweep */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent animate-light-sweep" />
              </div>

              {/* Twinkling ambient stars on the exhibition painting */}
              <div className="absolute top-4 left-6 pointer-events-none text-amber-300 animate-twinkle">
                <Sparkles className="w-5 h-5 drop-shadow-md" />
              </div>
              <div
                className="absolute top-10 right-8 pointer-events-none text-yellow-200 animate-twinkle"
                style={{ animationDelay: '1.2s' }}
              >
                <Sparkles className="w-4 h-4 drop-shadow-md" />
              </div>

              {/* Live Art Exhibition Badge Overlay */}
              <div className="absolute top-3 left-3 bg-[#263D64]/80 backdrop-blur-xs text-white px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>艺术展大厅 · 探索进行中</span>
              </div>
            </div>

            {/* Storybook Floating Pill */}
            <div className="absolute -bottom-3 -left-3 bg-[#FFF5E5] border-2 border-[#F4C66A] px-3.5 py-1.5 rounded-2xl shadow-md flex items-center gap-2 z-10">
              <Sparkles className="w-4 h-4 text-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-xs font-black text-[#263D64]">认真听要求，收集艺术展徽章！</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Levels Roadmap Strip (With 4 New Art Badges & Lucide Icons, NO Emojis) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-[#263D64] flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-600" />
            <span>五大冒险关卡</span>
          </h2>
          <button
            onClick={onOpenRoadmap}
            className="text-xs font-bold text-[#F28C75] hover:underline cursor-pointer"
          >
            查看全部 →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            {
              level: 1,
              title: '声音档案室',
              subtitle: '静心聆听 · 边听边记',
              badge: '闪亮星星徽章',
              icon: Sparkles,
              active: progress.currentLevel >= 1,
            },
            {
              level: 2,
              title: '失落材料搜查局',
              subtitle: '老师说 与 老师没说',
              badge: '艺术画框徽章',
              icon: Search,
              active: progress.currentLevel >= 2,
            },
            {
              level: 3,
              title: '声音密码实验室',
              subtitle: '填空排序 · 找对用品',
              badge: '魔法灯笼徽章',
              icon: Layers,
              active: progress.currentLevel >= 3,
            },
            {
              level: 4,
              title: '艺术材料仓库',
              subtitle: '集齐四样 · 解锁工坊',
              badge: '展览钥匙徽章',
              icon: Key,
              active: progress.currentLevel >= 4,
            },
            {
              level: 5,
              title: '找朋友一起创作',
              subtitle: '四大材料 · 剪贴拼图',
              badge: '艺术展盛大开放',
              icon: Users,
              active: progress.currentLevel >= 5,
            },
          ].map((lvl) => {
            const isCurrent = progress.currentLevel === lvl.level;
            const Icon = lvl.icon;
            return (
              <div
                key={lvl.level}
                onClick={() => onNavigateToLevel(lvl.level)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-50 border-[#F4C66A] shadow-md ring-2 ring-[#F4C66A]'
                    : lvl.active
                    ? 'bg-white border-[#263D64]/15 hover:border-[#263D64]/30'
                    : 'bg-white/50 border-dashed border-[#263D64]/15 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100/70 flex items-center justify-center text-amber-800">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isCurrent
                        ? 'bg-[#F4C66A] text-[#263D64]'
                        : lvl.active
                        ? 'bg-[#8CBF9E]/20 text-[#263D64]'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    第 {lvl.level} 关
                  </span>
                </div>
                <div className="text-sm font-black text-[#263D64]">{lvl.title}</div>
                <div className="text-[11px] text-[#263D64]/60 font-medium mt-0.5">{lvl.subtitle}</div>
                <div className="text-[10px] text-[#F28C75] font-bold mt-2">
                  解锁: {lvl.badge}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3 Modes Child-Friendly Section (NO adult technical pedagogy jargon) */}
      <section className="storybook-card-warm rounded-3xl p-6 sm:p-8 space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#263D64] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <span>选一个你喜欢的玩法，开始冒险吧！</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#263D64]/70 mt-1">
            三种玩法都很有趣，可以根据你的节奏自由选择：
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              key: 'explorer',
              title: '小小探索家',
              desc: '适合刚开始练习听力的小朋友。提供慢速重听与贴心图文提示。',
              tag: '温和提示 · 轻松闯关',
            },
            {
              key: 'decoder',
              title: '独立解密员',
              desc: '适合独立听懂通知的小朋友。完整收听录音，自主记录重点用品。',
              tag: '独立自主 · 专注认真',
            },
            {
              key: 'master',
              title: '声音密码大师',
              desc: '适合喜欢挑战的小朋友。听清所有细节，挑战辨析干扰用品！',
              tag: '大显身手 · 精彩挑战',
            },
          ].map((m) => {
            const isUserMode = student?.mode === m.key;
            return (
              <div
                key={m.key}
                className={`p-5 rounded-2xl border-2 bg-white relative transition-all ${
                  isUserMode ? 'border-[#263D64] ring-2 ring-[#263D64] shadow-md' : 'border-[#263D64]/15'
                }`}
              >
                {isUserMode && (
                  <span className="absolute top-3 right-3 bg-[#263D64] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    当前选择
                  </span>
                )}
                <div className="text-base font-black text-[#263D64] mb-1">{m.title}</div>
                <div className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block mb-2">
                  {m.tag}
                </div>
                <p className="text-xs text-[#263D64]/75 leading-relaxed">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
