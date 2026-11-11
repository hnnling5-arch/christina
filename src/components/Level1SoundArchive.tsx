import React, { useState, useEffect } from 'react';
import { GameProgress, StudentProfile } from '../types';
import { audioService } from '../services/audio';
import { ART_MATERIAL_IMAGES, BADGE_DETAILS } from '../data/constants';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Sticker,
  Check,
} from 'lucide-react';

interface Level1Props {
  student: StudentProfile | null;
  progress: GameProgress;
  onUpdateProgress: (updated: GameProgress) => void;
  onNextLevel: () => void;
  onBackToRoadmap?: () => void;
}

export const Level1SoundArchive: React.FC<Level1Props> = ({
  student,
  progress,
  onUpdateProgress,
  onNextLevel,
  onBackToRoadmap,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasListened, setHasListened] = useState<boolean>(false);
  const isExplorer = student?.mode === 'explorer';
  const isMaster = student?.mode === 'master';
  const isDecoder = student?.mode === 'decoder';

  const [playbackRate, setPlaybackRate] = useState<number>(isExplorer ? 0.8 : 1.0);
  const [showDecoderHint, setShowDecoderHint] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1.0);

  // Note card stamps & entries (now with 6 slots for complete material testing)
  const [slot1, setSlot1] = useState<string>(progress.fourGridNotes.slot1 || '');
  const [slot2, setSlot2] = useState<string>(progress.fourGridNotes.slot2 || '');
  const [slot3, setSlot3] = useState<string>(progress.fourGridNotes.slot3 || '');
  const [slot4, setSlot4] = useState<string>(progress.fourGridNotes.slot4 || '');
  const [slot5, setSlot5] = useState<string>(progress.fourGridNotes.slot5 || '');
  const [slot6, setSlot6] = useState<string>(progress.fourGridNotes.slot6 || '');

  // Jumbled pile dynamic angles & offsets
  const [pileRotations, setPileRotations] = useState<number[]>([-14, 10, -8, 14, -18, 12]);
  const [pileOffsets, setPileOffsets] = useState<{ x: number; y: number }[]>([
    { x: -6, y: 4 },
    { x: 8, y: -6 },
    { x: 10, y: 6 },
    { x: -8, y: -4 },
    { x: 4, y: -8 },
    { x: -10, y: 8 },
  ]);

  const handleShufflePile = () => {
    audioService.playStampSound();
    setPileRotations(pileRotations.map(() => Math.floor(Math.random() * 32 - 16)));
    setPileOffsets(pileOffsets.map(() => ({
      x: Math.floor(Math.random() * 20 - 10),
      y: Math.floor(Math.random() * 16 - 8),
    })));
  };

  const handleStampSelect = (stampName: string) => {
    audioService.playStampSound();
    if (!slot1) setSlot1(stampName);
    else if (!slot2) setSlot2(stampName);
    else if (!slot3) setSlot3(stampName);
    else if (!slot4) setSlot4(stampName);
    else if (!slot5) setSlot5(stampName);
    else if (!slot6) setSlot6(stampName);
    else {
      setSlot6(stampName);
    }
  };

  const getStampImage = (name: string) => {
    switch (name) {
      case '剪刀':
        return ART_MATERIAL_IMAGES.scissors;
      case '胶水':
        return ART_MATERIAL_IMAGES.glue;
      case '彩色纸':
        return ART_MATERIAL_IMAGES.coloredPaper;
      case '贴纸':
        return ART_MATERIAL_IMAGES.stickers;
      case '铅笔':
        return ART_MATERIAL_IMAGES.pencil;
      case '直尺':
      case '尺':
        return ART_MATERIAL_IMAGES.ruler;
      case '颜料':
        return ART_MATERIAL_IMAGES.paint;
      default:
        return null;
    }
  };

  // 3 Core Check Questions states
  const [q1Answer, setQ1Answer] = useState<string>('');
  const [q2Answer, setQ2Answer] = useState<string[]>([]);
  const [q3Answer, setQ3Answer] = useState<string>('');

  // Mode C (Master) Higher-Order Questions
  const [q4MasterAnswer, setQ4MasterAnswer] = useState<string>('');
  const [q5MasterAnswer, setQ5MasterAnswer] = useState<string>('');

  const [feedback, setFeedback] = useState<{
    isSuccess?: boolean;
    title?: string;
    hints?: string[];
    message?: string;
  }>({});

  const handleVerify = () => {
    if (!q1Answer) {
      setFeedback({
        isSuccess: false,
        title: '👉 请先回答第 1 题',
        hints: ['明天通知交代要上什么课呢？请点选一个答案！'],
      });
      return;
    }
    if (q2Answer.length === 0) {
      setFeedback({
        isSuccess: false,
        title: '👉 请先回答第 2 题',
        hints: ['老师通知里提到了四样材料，请在格子里点选打勾！'],
      });
      return;
    }
    if (!q3Answer) {
      setFeedback({
        isSuccess: false,
        title: '👉 请先回答第 3 题',
        hints: ['老师提醒大家把用品放在哪里呢？'],
      });
      return;
    }

    if (isMaster) {
      if (!q4MasterAnswer) {
        setFeedback({
          isSuccess: false,
          title: '👉 大师挑战第 4 题尚未完成',
          hints: ['请选择把用品放进书包的最主要原因！'],
        });
        return;
      }
      if (!q5MasterAnswer) {
        setFeedback({
          isSuccess: false,
          title: '👉 大师挑战第 5 题尚未完成',
          hints: ['请选择如何回答同学关于笔和尺的问题！'],
        });
        return;
      }
    }

    const isQ1Correct = q1Answer === 'art';
    const isQ2Correct =
      q2Answer.length === 4 &&
      ['胶水', '彩色纸', '剪刀', '贴纸'].every((item) => q2Answer.includes(item));
    const isQ3Correct = q3Answer === 'bag';
    const isQ4Correct = !isMaster || q4MasterAnswer === 'art_ready';
    const isQ5Correct = !isMaster || q5MasterAnswer === 'filter_correct';

    if (isQ1Correct && isQ2Correct && isQ3Correct && isQ4Correct && isQ5Correct) {
      // Success!
      audioService.playCelebrationChime();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }

      // Mode-differentiated score increments
      const level1Bonus = isMaster ? 120 : isDecoder ? 100 : 80;

      const updatedProgress: GameProgress = {
        ...progress,
        currentLevel: Math.max(progress.currentLevel, 2),
        badges: {
          ...progress.badges,
          glue: true,
        },
        score: progress.badges.glue ? progress.score : progress.score + level1Bonus,
        completedTasks: Array.from(new Set([...progress.completedTasks, 'level1_sound_archive'])),
        fourGridNotes: {
          slot1,
          slot2,
          slot3,
          slot4,
          slot5,
          slot6,
          drawings: [],
        },
        updatedAt: new Date().toISOString(),
      };

      onUpdateProgress(updatedProgress);
      setFeedback({
        isSuccess: true,
        title: '太棒了！全部回答正确！',
        message: '你听得特别认真，顺利通过第 1 关！荣获【闪亮星星徽章】！快进入第 2 关吧！',
      });
    } else {
      const wrongHints: string[] = [];
      if (!isQ1Correct) wrongHints.push('第 1 题：再听听通知开头，想一想明天上的课程名称！');
      if (!isQ2Correct) wrongHints.push('第 2 题：仔细回想老师提到的四样手工材料，再听一次录音核对一下！');
      if (!isQ3Correct) wrongHints.push('第 3 题：老师提醒大家把用品收纳在哪里呢？再听听通知结尾！');
      if (isMaster && !isQ4Correct) wrongHints.push('第 4 题：想一想把用品放进书包能起到什么关键作用！');
      if (isMaster && !isQ5Correct) wrongHints.push('第 5 题：回忆一下老师通知里到底有没有提到笔和尺！');

      setFeedback({
        isSuccess: false,
        title: '别着急，差一点点就答对啦！',
        hints: wrongHints,
        message: '没关系，多听一遍就会啦！点击下方按钮可以再听一次老师通知。',
      });
    }
  };

  useEffect(() => {
    const unsub = audioService.subscribe((playing) => {
      setIsPlaying(playing);
      if (playing) setHasListened(true);
    });
    return () => {
      unsub();
      audioService.stop();
    };
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioService.pause();
    } else {
      audioService.playTeacherNotice(undefined, () => {
        setHasListened(true);
      }, playbackRate);
    }
  };

  const handleReplay = () => {
    audioService.stop();
    audioService.playTeacherNotice(undefined, () => {
      setHasListened(true);
    }, playbackRate);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    audioService.setVolume(v);
  };

  // Stamp options to place on the 4-grid note card
  const stampOptions = [
    { label: '胶水 🧴', name: '胶水' },
    { label: '彩色纸 📄', name: '彩色纸' },
    { label: '剪刀 ✂️', name: '剪刀' },
    { label: '贴纸 ⭐', name: '贴纸' },
    { label: '颜料 🎨', name: '颜料' },
    { label: '直尺 📏', name: '直尺' },
  ];

  const handleToggleQ2Item = (item: string) => {
    if (q2Answer.includes(item)) {
      setQ2Answer(q2Answer.filter((i) => i !== item));
    } else {
      setQ2Answer([...q2Answer, item]);
    }
  };

  const isBadgeEarned = progress.badges.glue;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        {onBackToRoadmap ? (
          <button
            onClick={onBackToRoadmap}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-[#263D64]/15 hover:bg-amber-50 text-xs font-bold text-[#263D64] transition-colors flex items-center gap-1"
          >
            <span>← 返回学习路线</span>
          </button>
        ) : <div />}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
          <span>🎧 关卡一 · 声音档案室</span>
        </div>
        <div className="w-16" />
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-[#263D64]">听一听 · 记一记</h1>
        <p className="text-xs sm:text-sm text-[#263D64]/70 max-w-xl mx-auto">
          按下播放键，安静听老师说！把四样东西盖上图章，再回答三个小问题。
        </p>
      </div>

      {/* Mode Guidance Strip */}
      <div className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 ${
        isMaster
          ? 'bg-purple-50 border-purple-300 text-purple-900'
          : isDecoder
          ? 'bg-sky-50 border-sky-300 text-sky-900'
          : 'bg-amber-50 border-amber-300 text-amber-900'
      }`}>
        <div className="flex items-center gap-2 text-xs sm:text-sm font-black">
          <span>{isMaster ? '⚡' : isDecoder ? '🕵️' : '🌱'}</span>
          <span>
            {isMaster
              ? '声音密码大师挑战：纯听力挑战 · 禁用文字稿 · 包含干扰排查题'
              : isDecoder
              ? '独立解密员模式：自主完整聆听 · 独立做记录 · 提示按需展开'
              : '小小探索家模式：慢速重听伴读 · 图文贴心引导'}
          </span>
        </div>
        {isExplorer && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-white px-2.5 py-1 rounded-xl border border-amber-200">
            <span>三步闯关：①听通知 ②盖图章 ③选答案</span>
          </div>
        )}
      </div>

      {/* Main Teacher Audio Card (Step 1) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#F4C66A] text-[#263D64] font-black text-xs">
            第 1 步
          </span>
          <span className="font-black text-sm text-[#263D64]">安静听老师说通知</span>
        </div>
        <div className="storybook-card-warm rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#F4C66A]/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F4C66A] flex items-center justify-center text-2xl shadow-sm">
                👩‍🏫
              </div>
              <div>
                <div className="text-sm font-black text-[#263D64]">美术老师的口头通知</div>
                <div className="text-xs text-[#263D64]/60">仔细听老师说，做个安静听话的好孩子</div>
              </div>
            </div>

            {/* Sound Wave Animation when playing */}
            <div className="flex items-center gap-1.5 h-8 px-4 bg-white/80 rounded-2xl border border-[#263D64]/10">
              {[10, 20, 14, 24, 12, 20, 10, 16].map((h, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full bg-[#F4C66A] transition-all duration-300 ${
                    isPlaying ? 'animate-pulse' : 'opacity-30'
                  }`}
                  style={{ height: isPlaying ? `${h}px` : '6px' }}
                />
              ))}
              <span className="text-xs font-black text-[#263D64] ml-2">
                {isPlaying ? '🤫 正在安静听老师说话...' : hasListened ? '✓ 老师播报完毕' : '等待播放'}
              </span>
            </div>
          </div>

        {/* Audio Player Controls with differentiated speed & hint toggles */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#263D64]/10">
          <div className="flex items-center gap-3">
            {/* Play / Pause */}
            <button
              onClick={handleTogglePlay}
              className={`w-14 h-14 rounded-2xl font-black text-xl flex items-center justify-center shadow-md transition-all ${
                isPlaying
                  ? 'bg-[#F28C75] text-white hover:bg-[#F28C75]/90'
                  : 'bg-[#F4C66A] text-[#263D64] hover:bg-[#F4C66A]/90 scale-105'
              }`}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>

            {/* Replay */}
            <button
              onClick={handleReplay}
              title="重听一遍"
              className="p-3 rounded-2xl bg-[#FFF5E5] hover:bg-amber-100 text-[#263D64] border border-[#263D64]/15 transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重听</span>
            </button>

            {/* Explorer Speed Toggle */}
            {isExplorer && (
              <div className="flex items-center gap-1 bg-[#FFF5E5] p-1 rounded-xl border border-[#263D64]/10 text-[11px] font-bold text-[#263D64]">
                <button
                  onClick={() => setPlaybackRate(0.8)}
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    playbackRate === 0.8 ? 'bg-[#F4C66A] text-[#263D64] font-black' : 'hover:bg-white'
                  }`}
                >
                  🐢 慢速伴读
                </button>
                <button
                  onClick={() => setPlaybackRate(1.0)}
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    playbackRate === 1.0 ? 'bg-[#F4C66A] text-[#263D64] font-black' : 'hover:bg-white'
                  }`}
                >
                  🐇 标准原速
                </button>
              </div>
            )}
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 text-xs font-bold text-[#263D64]">
            {volume > 0 ? <Volume2 className="w-4 h-4 text-[#8CBF9E]" /> : <VolumeX className="w-4 h-4 text-[#F28C75]" />}
            <span className="hidden sm:inline">音量:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 sm:w-28 accent-[#F4C66A] cursor-pointer"
            />
          </div>

          {/* Mode Guidance Callout */}
          {isDecoder ? (
            <button
              onClick={() => setShowDecoderHint(!showDecoderHint)}
              className="text-xs font-bold text-[#263D64] bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-200 flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-sky-600" />
              <span>{showDecoderHint ? '收起解密线索' : '💡 查看解密提示'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
              <span>🎧 专注聆听模式 · 用耳朵捕捉重点</span>
            </div>
          )}
        </div>

        {/* Decoder voluntary hint box */}
        {isDecoder && showDecoderHint && (
          <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200 text-xs text-sky-900 leading-relaxed space-y-1">
            <div className="font-black text-sky-950">💡 独立解密提示（供自主查阅）：</div>
            <div>• 注意听通知开头所说的科目名称。</div>
            <div>• 老师特别提到要带四样用于做拼贴画的手工材料，不要与画画或量尺混淆。</div>
            <div>• 听听通知结尾对准备好的物品提出的动作要求（放进哪里？）。</div>
          </div>
        )}

        <div className="p-3 bg-white/70 rounded-2xl text-center text-xs text-[#263D64]/70 font-bold border border-[#263D64]/10">
          💡 听力提示：请安静聆听老师的录音通知，边听边记下重要信息，不需要阅读文字哦！
        </div>
        </div>
      </div>

      {/* Four-Grid Note Card (Step 2) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#8CBF9E] text-white font-black text-xs">
            第 2 步
          </span>
          <span className="font-black text-sm text-[#263D64]">把用品盖在记录卡上</span>
        </div>
        <div className="storybook-card rounded-3xl p-6 sm:p-8 space-y-5 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-[#263D64] flex items-center gap-2">
                <span>📋</span>
                <span>四格重点记录卡（含第5、6拓展格）</span>
              </h2>
              <p className="text-xs text-[#263D64]/70">
                老师通知要准备哪些东西？从下方桌上散落的一堆文具图章中点选，盖入格子里！
              </p>
            </div>
          </div>

          {/* 6 Slots Grid (第一格 到 第六格) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: '记录格', val: slot1, setVal: setSlot1 },
              { label: '记录格', val: slot2, setVal: setSlot2 },
              { label: '记录格', val: slot3, setVal: setSlot3 },
              { label: '记录格', val: slot4, setVal: setSlot4 },
              { label: '拓展格', val: slot5, setVal: setSlot5 },
              { label: '拓展格', val: slot6, setVal: setSlot6 },
            ].map((grid, idx) => {
              const stampImg = getStampImage(grid.val);

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center min-h-[125px] text-center transition-all ${
                    grid.val
                      ? 'bg-amber-50 border-[#F4C66A] shadow-xs'
                      : 'bg-[#FFF5E5]/50 border-dashed border-[#263D64]/20'
                  }`}
                >
                  <span className="text-[10px] font-bold text-[#263D64]/60 mb-1">{grid.label}</span>
                  {grid.val ? (
                    <div className="flex flex-col items-center space-y-1.5 animate-in zoom-in-75 duration-150">
                      {stampImg ? (
                        <div className="w-12 h-12 flex items-center justify-center">
                          <img src={stampImg} alt="已盖图章" className="w-full h-full object-contain pointer-events-none drop-shadow-xs" />
                        </div>
                      ) : (
                        <div className="text-xs font-black text-[#263D64]">{grid.val}</div>
                      )}
                      <button
                        onClick={() => grid.setVal('')}
                        className="px-2 py-0.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-black cursor-pointer transition-colors"
                      >
                        清除重填
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-[#263D64]/40 font-bold">待盖图章</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desk Stationery Pile - Scattered / Jumbled (桌面散落的文具图章堆，打乱不规则呈现) */}
          <div className="p-4 sm:p-6 bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7]/40 to-[#FFF7ED] rounded-3xl border-2 border-dashed border-[#F59E0B]/50 space-y-3 relative shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs sm:text-sm font-black text-[#263D64] flex items-center gap-1.5">
                <Sticker className="w-4 h-4 text-[#F59E0B]" />
                <span>点选桌上散落的用品图章，盖入记录卡格子里：</span>
              </div>
              <button
                type="button"
                onClick={handleShufflePile}
                className="self-start sm:self-auto px-3 py-1 rounded-xl bg-white/90 hover:bg-white text-amber-800 border border-amber-300 text-xs font-bold flex items-center gap-1 shadow-xs hover:shadow transition-all cursor-pointer active:scale-95"
              >
                <span>🎲</span>
                <span>打乱桌面堆放</span>
              </button>
            </div>

            {/* The tactile jumbled pile container */}
            <div className="relative min-h-[190px] sm:min-h-[220px] flex items-center justify-center py-5 px-3 select-none overflow-hidden rounded-2xl bg-white/50 border border-amber-200/50 shadow-inner">
              {/* Scattered doodle backdrop for playful immersion */}
              <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-around text-4xl text-amber-900/10 font-black">
                <span>✏️</span>
                <span>✂️</span>
                <span>📏</span>
                <span>🧴</span>
              </div>

              {/* The scattered items cluster (像一堆文具那样错落打乱呈现) */}
              <div className="relative flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 max-w-xl mx-auto z-10">
                {[
                  { name: '剪刀', img: ART_MATERIAL_IMAGES.scissors, defaultTilt: -12, defaultX: -6, defaultY: 4 },
                  { name: '胶水', img: ART_MATERIAL_IMAGES.glue, defaultTilt: 8, defaultX: 6, defaultY: -6 },
                  { name: '彩色纸', img: ART_MATERIAL_IMAGES.coloredPaper, defaultTilt: -6, defaultX: 10, defaultY: 6 },
                  { name: '贴纸', img: ART_MATERIAL_IMAGES.stickers, defaultTilt: 14, defaultX: -8, defaultY: -4 },
                  { name: '铅笔', img: ART_MATERIAL_IMAGES.pencil, defaultTilt: -18, defaultX: 4, defaultY: -8 },
                  { name: '直尺', img: ART_MATERIAL_IMAGES.ruler, defaultTilt: 12, defaultX: -10, defaultY: 8 },
                ].map((st, idx) => {
                  const rot = pileRotations[idx] ?? st.defaultTilt;
                  const offX = pileOffsets[idx]?.x ?? st.defaultX;
                  const offY = pileOffsets[idx]?.y ?? st.defaultY;

                  return (
                    <button
                      key={st.name}
                      type="button"
                      onClick={() => handleStampSelect(st.name)}
                      aria-label={`图章选项`}
                      style={{
                        transform: `rotate(${rot}deg) translate(${offX}px, ${offY}px)`,
                      }}
                      className="group relative p-2.5 sm:p-3 bg-white border-2 border-amber-300 hover:border-amber-500 rounded-2xl sm:rounded-3xl shadow-md hover:shadow-2xl transition-all duration-200 cursor-pointer hover:z-30 hover:scale-120 active:scale-90 active:rotate-0 flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 touch-manipulation"
                    >
                      <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center pointer-events-none">
                        <img
                          src={st.img}
                          alt="美术用品图章"
                          className="w-full h-full object-contain filter drop-shadow-xs group-hover:scale-105 transition-transform"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-[#263D64]/60 text-center font-medium">
              💡 提示：桌上像真的美术桌一样散落着一堆文具用品图章，点选任意图章即可自动盖入卡片！
            </p>
          </div>
        </div>
      </div>

      {/* 3 Check Questions (Step 3) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#F28C75] text-white font-black text-xs">
            第 3 步
          </span>
          <span className="font-black text-sm text-[#263D64]">动脑筋选一选</span>
        </div>
        <div className="storybook-card rounded-3xl p-6 sm:p-8 space-y-6 bg-white">
          <h2 className="text-xl font-black text-[#263D64] flex items-center gap-2">
            <span>❓</span>
            <span>回答三个小问题</span>
          </h2>

        {/* Q1 */}
        <div className="p-4 rounded-2xl bg-[#FFF5E5]/60 border border-[#263D64]/10 space-y-3">
          <div className="text-sm font-black text-[#263D64]">1. 老师在口头通知中交代，明天要上什么课？</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'art', label: '🎨 美术课' },
              { id: 'pe', label: '⚽ 体育课' },
              { id: 'music', label: '🎵 音乐课' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setQ1Answer(opt.id)}
                className={`py-3 px-4 rounded-xl font-black text-sm border-2 text-left transition-all ${
                  q1Answer === opt.id
                    ? 'bg-[#263D64] text-white border-[#263D64] shadow-md'
                    : 'bg-white text-[#263D64] border-[#263D64]/20 hover:border-[#263D64]/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Q2 */}
        <div className="p-4 rounded-2xl bg-[#FFF5E5]/60 border border-[#263D64]/10 space-y-3">
          <div className="text-sm font-black text-[#263D64]">
            2. 老师要求大家准备好哪四样东西？（在正确的用品上打勾）
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {[
              { name: '胶水', img: ART_MATERIAL_IMAGES.glue },
              { name: '彩色纸', img: ART_MATERIAL_IMAGES.coloredPaper },
              { name: '剪刀', img: ART_MATERIAL_IMAGES.scissors },
              { name: '贴纸', img: ART_MATERIAL_IMAGES.stickers },
              { name: '铅笔', img: ART_MATERIAL_IMAGES.pencil },
              { name: '直尺', img: ART_MATERIAL_IMAGES.ruler },
            ].map((item) => {
              const isChecked = q2Answer.includes(item.name);
              return (
                <button
                  key={item.name}
                  onClick={() => handleToggleQ2Item(item.name)}
                  aria-label={item.name}
                  className={`p-4 rounded-3xl border-2 flex items-center justify-center relative transition-all cursor-pointer h-28 sm:h-32 ${
                    isChecked
                      ? 'bg-amber-50 border-[#F4C66A] ring-3 ring-[#F4C66A]/40 shadow-xs'
                      : 'bg-white border-[#263D64]/15 hover:border-[#263D64]/40 hover:bg-amber-50/30'
                  }`}
                >
                  {/* 图片纯视觉呈现，卡片及图片底部绝对无任何文字 */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                    <img
                      src={item.img}
                      alt="手工材料选项"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </div>
                  {isChecked && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#263D64] text-[#F4C66A] flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Q3 */}
        <div className="p-4 rounded-2xl bg-[#FFF5E5]/60 border border-[#263D64]/10 space-y-3">
          <div className="text-sm font-black text-[#263D64]">
            3. 老师特别提醒大家要把用品放在哪里？
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'bag', label: '🎒 放进书包' },
              { id: 'home', label: '🏠 放在家里' },
              { id: 'desk', label: '🪑 放在课桌' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setQ3Answer(opt.id)}
                className={`py-3 px-4 rounded-xl font-black text-sm border-2 text-left transition-all ${
                  q3Answer === opt.id
                    ? 'bg-[#263D64] text-white border-[#263D64] shadow-md'
                    : 'bg-white text-[#263D64] border-[#263D64]/20 hover:border-[#263D64]/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Master Mode Exclusive Question 4: 理由与依据说明 */}
        {isMaster && (
          <div className="p-4 rounded-2xl bg-purple-50/70 border-2 border-purple-200 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2 py-0.5 rounded-md bg-purple-600 text-white">
                大师专属题 4
              </span>
              <div className="text-sm font-black text-[#263D64]">
                【理由与依据说明】：老师在通知最后要求大家把用品收纳好并带来的最主要依据是什么？
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  id: 'art_ready',
                  label: '🎯 保证明天到校上美术课时能准时拿出来使用，防止遗漏忘带（主要依据）',
                },
                {
                  id: 'teacher_check',
                  label: '⚠️ 老师明天进班要逐一突击检查书包整齐度',
                },
                {
                  id: 'casual',
                  label: '💭 只是随口客套，放在家里书桌抽屉也可以',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setQ4MasterAnswer(opt.id)}
                  className={`py-3 px-4 rounded-xl font-black text-xs sm:text-sm border-2 text-left transition-all ${
                    q4MasterAnswer === opt.id
                      ? 'bg-purple-900 text-white border-purple-900 shadow-md'
                      : 'bg-white text-[#263D64] border-purple-200 hover:border-purple-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Master Mode Exclusive Question 5: 干扰信息过滤与排查 */}
        {isMaster && (
          <div className="p-4 rounded-2xl bg-purple-50/70 border-2 border-purple-200 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2 py-0.5 rounded-md bg-purple-600 text-white">
                大师专属题 5
              </span>
              <div className="text-sm font-black text-[#263D64]">
                【干扰信息辨析排查】：如果同学小明问你“老师在通知里有没有叫我们带彩色笔和尺？”，你该如何依据听到的通知回答他？
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  id: 'filter_correct',
                  label: '🛡️ 明确告诉他：老师通知里并没有叫大家带彩色笔和尺，只需要带通知交代的四样手工材料',
                },
                {
                  id: 'filter_agree',
                  label: '❓ 附和他：既然都是文具，就顺便带去吧',
                },
                {
                  id: 'filter_ignore',
                  label: '🤷 告诉他不知道，自己没听清楚',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setQ5MasterAnswer(opt.id)}
                  className={`py-3 px-4 rounded-xl font-black text-xs sm:text-sm border-2 text-left transition-all ${
                    q5MasterAnswer === opt.id
                      ? 'bg-purple-900 text-white border-purple-900 shadow-md'
                      : 'bg-white text-[#263D64] border-purple-200 hover:border-purple-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Banner (Child-Friendly Error Guidance & Remediation) */}
        {(feedback.message || feedback.title) && (
          <div
            className={`p-5 rounded-3xl border-3 space-y-3 shadow-xs ${
              feedback.isSuccess
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2 font-black text-base">
              {feedback.isSuccess ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : (
                <span className="text-xl shrink-0">🧡</span>
              )}
              <span>{feedback.title}</span>
            </div>

            {feedback.hints && feedback.hints.length > 0 && (
              <div className="space-y-1.5 bg-white/90 p-3.5 rounded-2xl border border-amber-200 text-xs sm:text-sm font-bold text-amber-900">
                {feedback.hints.map((hint, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span>{hint}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs sm:text-sm font-bold opacity-90 leading-relaxed">
              {feedback.message}
            </p>

            {!feedback.isSuccess && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleReplay}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>🎧 点击再听一次老师通知</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Verification Action */}
        <div className="pt-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={handleVerify}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#F4C66A] hover:bg-[#F4C66A]/90 text-[#263D64] font-black text-base shadow-md transition-all flex items-center justify-center gap-2 min-h-[52px] cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 text-[#263D64]" />
              <span>提交检查 · 领取闪亮星星徽章</span>
            </button>
          </div>

          {/* Prominent Next Level Card (Clear Next Step for 7-year-olds) */}
          {isBadgeEarned && (
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-100 to-emerald-100 border-2 border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md animate-in fade-in">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/images/badges/badge-star.svg"
                  alt="闪亮星星徽章"
                  className="w-12 h-12 object-contain drop-shadow-sm"
                />
                <div>
                  <div className="text-base font-black text-emerald-950">
                    太棒啦！你已经获得了【闪亮星星徽章】！
                  </div>
                  <div className="text-xs text-emerald-800 font-bold mt-0.5">
                    点击右侧按钮，前往下一关搜查失落的艺术用品吧！
                  </div>
                </div>
              </div>
              <button
                onClick={onNextLevel}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#263D64] hover:bg-[#263D64]/90 text-white font-black text-base shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 cursor-pointer min-h-[52px] shrink-0"
              >
                <span>前往第 2 关：失落材料搜查局</span>
                <ArrowRight className="w-5 h-5 text-[#F4C66A]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
};
