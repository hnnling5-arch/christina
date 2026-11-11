import React, { useState, useEffect } from 'react';
import { GameProgress, StudentProfile } from '../types';
import { audioService } from '../services/audio';
import { ART_MATERIAL_IMAGES, BADGE_DETAILS } from '../data/constants';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  Check,
} from 'lucide-react';

interface Level2Props {
  student: StudentProfile | null;
  progress: GameProgress;
  onUpdateProgress: (updated: GameProgress) => void;
  onNextLevel: () => void;
  onBackToLevel1: () => void;
  onBackToRoadmap?: () => void;
}

interface MaterialItem {
  id: string;
  name: string;
  image: string;
  isSaid: boolean; // true if teacher notice mentioned it, false if distractor
}

// 6 craft & tool items: 4 mentioned in audio + 2 distractors
const BASE_ITEMS: MaterialItem[] = [
  { id: 'glue', name: '胶水', image: ART_MATERIAL_IMAGES.glue, isSaid: true },
  { id: 'paper', name: '彩色纸', image: ART_MATERIAL_IMAGES.coloredPaper, isSaid: true },
  { id: 'scissors', name: '剪刀', image: ART_MATERIAL_IMAGES.scissors, isSaid: true },
  { id: 'sticker', name: '贴纸', image: ART_MATERIAL_IMAGES.stickers, isSaid: true },
  { id: 'pencil', name: '铅笔', image: ART_MATERIAL_IMAGES.pencil, isSaid: false },
  { id: 'ruler', name: '直尺', image: ART_MATERIAL_IMAGES.ruler, isSaid: false },
];

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const Level2MaterialSearch: React.FC<Level2Props> = ({
  student,
  progress,
  onUpdateProgress,
  onNextLevel,
  onBackToLevel1,
  onBackToRoadmap,
}) => {
  const isExplorer = student?.mode === 'explorer';
  const isMaster = student?.mode === 'master';
  const isDecoder = student?.mode === 'decoder';

  // Shuffle items on initial load so they are never grouped or ordered predictably
  const [shuffledItems] = useState<MaterialItem[]>(() => shuffleArray(BASE_ITEMS));

  // Placement buckets: IDs in "老师说", "老师没说"
  const [saidIds, setSaidIds] = useState<string[]>([]);
  const [notSaidIds, setNotSaidIds] = useState<string[]>([]);

  // Active drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<'said' | 'notSaid' | null>(null);

  // Selected item for tablet tap-to-move
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Audio state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(isExplorer ? 0.85 : 1.0);
  const [audioStatus, setAudioStatus] = useState<string>('就绪，点击播放聆听');
  const [volume, setVolume] = useState<number>(1.0);

  // Verification & feedback state
  const [feedback, setFeedback] = useState<{
    show: boolean;
    isCorrect?: boolean;
    title?: string;
    message?: string;
  }>({ show: false });

  // Subscribe to audio service
  useEffect(() => {
    const unsub = audioService.subscribe((playing) => {
      setIsPlaying(playing);
      if (playing) {
        setAudioStatus('正在播放老师通知...');
      } else {
        setAudioStatus('已暂停 / 就绪');
      }
    });
    return () => unsub();
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioService.pause();
    } else {
      audioService.playTeacherNotice(playbackRate, () => {
        setAudioStatus('播放完毕，请将用品分类');
      });
    }
  };

  const handleReplay = () => {
    audioService.stop();
    audioService.playTeacherNotice(playbackRate, () => {
      setAudioStatus('播放完毕，请将用品分类');
    });
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    audioService.setPlaybackRate(rate);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    audioService.setVolume(v);
  };

  // Place item into a target zone
  const moveItemTo = (itemId: string, target: 'said' | 'notSaid' | 'pool') => {
    audioService.playStampSound();
    setSaidIds((prev) => prev.filter((id) => id !== itemId));
    setNotSaidIds((prev) => prev.filter((id) => id !== itemId));

    if (target === 'said') {
      setSaidIds((prev) => [...prev.filter((id) => id !== itemId), itemId]);
    } else if (target === 'notSaid') {
      setNotSaidIds((prev) => [...prev.filter((id) => id !== itemId), itemId]);
    }
    setSelectedItemId(null);
    setFeedback({ show: false });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, zone: 'said' | 'notSaid') => {
    e.preventDefault();
    if (activeZone !== zone) setActiveZone(zone);
  };

  const handleDragLeave = () => {
    setActiveZone(null);
  };

  const handleDrop = (e: React.DragEvent, zone: 'said' | 'notSaid') => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedId;
    if (id) {
      moveItemTo(id, zone);
    }
    setDraggedId(null);
    setActiveZone(null);
  };

  // Check answers
  const handleVerify = () => {
    const totalPlaced = saidIds.length + notSaidIds.length;
    if (totalPlaced < 6) {
      setFeedback({
        show: true,
        isCorrect: false,
        title: '还没整理完哦',
        message: `还有 ${6 - totalPlaced} 样用品还在下方等待分类，请把它们全部送到正确的地方吧！`,
      });
      return;
    }

    // Check classification:
    // All 4 mentioned must be in saidIds, both 2 distractors in notSaidIds
    const saidCorrect =
      saidIds.length === 4 &&
      saidIds.every((id) => BASE_ITEMS.find((it) => it.id === id)?.isSaid === true);

    const notSaidCorrect =
      notSaidIds.length === 2 &&
      notSaidIds.every((id) => BASE_ITEMS.find((it) => it.id === id)?.isSaid === false);

    if (saidCorrect && notSaidCorrect) {
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

      const scoreDelta = isMaster ? 150 : isDecoder ? 120 : 100;
      const updatedProgress: GameProgress = {
        ...progress,
        currentLevel: Math.max(progress.currentLevel, 3),
        badges: {
          ...progress.badges,
          paper: true, // Unlocks 艺术画框徽章
        },
        score: progress.badges.paper ? progress.score : progress.score + scoreDelta,
        completedTasks: Array.from(new Set([...progress.completedTasks, 'level2_material_search'])),
        updatedAt: new Date().toISOString(),
      };

      onUpdateProgress(updatedProgress);
      setFeedback({
        show: true,
        isCorrect: true,
        title: '太棒了！分类完全正确！',
        message: '你听得非常仔细！准确找出了老师交代的所有用品，收获【艺术画框徽章】！',
      });
    } else {
      setFeedback({
        show: true,
        isCorrect: false,
        title: '再听一听，想一想！',
        message: '分类里有放错的地方哦。点击下方播放器再听一次老师通知，重新把它们送到正确的地方吧！',
      });
    }
  };

  const handleReset = () => {
    setSaidIds([]);
    setNotSaidIds([]);
    setSelectedItemId(null);
    setFeedback({ show: false });
  };

  const unplacedItems = shuffledItems.filter(
    (item) => !saidIds.includes(item.id) && !notSaidIds.includes(item.id)
  );

  const saidItemsList = shuffledItems.filter((item) => saidIds.includes(item.id));
  const notSaidItemsList = shuffledItems.filter((item) => notSaidIds.includes(item.id));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        {onBackToRoadmap ? (
          <button
            onClick={onBackToRoadmap}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-[#263D64]/15 hover:bg-amber-50 text-xs font-bold text-[#263D64] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>回冒险图</span>
          </button>
        ) : (
          <button
            onClick={onBackToLevel1}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-[#263D64]/15 hover:bg-amber-50 text-xs font-bold text-[#263D64] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>回第 1 关</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300">
            第 2 关 · 失落材料搜查局
          </span>
          {progress.badges.paper && (
            <span className="flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300">
              <Check className="w-3.5 h-3.5" />
              <span>已通关</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Mission Card */}
      <div className="storybook-card rounded-3xl p-6 sm:p-8 bg-white space-y-6">
        {/* Title and Simple Child Instruction */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-[#263D64]">失落材料搜查局</h1>
          <p className="text-sm font-bold text-[#263D64]/80">
            听一听老师的通知，把图片送到正确的地方！
          </p>
          <p className="text-xs text-[#263D64]/60">
            （可以拖动卡片，也可以点击卡片直接送入分类区域）
          </p>
        </div>

        {/* 2 Classification Zones (老师说 VS 老师没说) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Zone A: 老师说 */}
          <div
            onDragOver={(e) => handleDragOver(e, 'said')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'said')}
            className={`p-4 sm:p-5 rounded-3xl border-3 transition-all min-h-[220px] flex flex-col ${
              activeZone === 'said'
                ? 'bg-emerald-100/70 border-emerald-500 scale-[1.01] shadow-lg'
                : 'bg-emerald-50/50 border-emerald-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-200">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                <h2 className="text-lg font-black text-emerald-950">老师说</h2>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                已放 {saidItemsList.length} 样
              </span>
            </div>

            {/* Dropped items grid */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 items-start">
              {saidItemsList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => moveItemTo(item.id, 'pool')}
                  title="点击移回待分类区"
                  className="group relative p-2.5 bg-white border-2 border-emerald-300 hover:border-emerald-500 rounded-2xl shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center h-24"
                >
                  <div className="w-16 h-16 flex items-center justify-center pointer-events-none">
                    <img
                      src={item.image}
                      alt="用品卡片"
                      className="w-full h-full object-contain filter drop-shadow-xs"
                    />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    ×
                  </span>
                </div>
              ))}

              {saidItemsList.length === 0 && (
                <div className="col-span-full h-32 flex flex-col items-center justify-center text-center border-2 border-dashed border-emerald-300/70 rounded-2xl p-4">
                  <p className="text-xs font-bold text-emerald-700">
                    老师通知里提到要准备的用品，拖放到这里
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Zone B: 老师没说 */}
          <div
            onDragOver={(e) => handleDragOver(e, 'notSaid')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'notSaid')}
            className={`p-4 sm:p-5 rounded-3xl border-3 transition-all min-h-[220px] flex flex-col ${
              activeZone === 'notSaid'
                ? 'bg-rose-100/70 border-rose-500 scale-[1.01] shadow-lg'
                : 'bg-rose-50/40 border-rose-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-rose-200">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500" />
                <h2 className="text-lg font-black text-rose-950">老师没说</h2>
              </div>
              <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full">
                已放 {notSaidItemsList.length} 样
              </span>
            </div>

            {/* Dropped items grid */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 items-start">
              {notSaidItemsList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => moveItemTo(item.id, 'pool')}
                  title="点击移回待分类区"
                  className="group relative p-2.5 bg-white border-2 border-rose-300 hover:border-rose-500 rounded-2xl shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center h-24"
                >
                  <div className="w-16 h-16 flex items-center justify-center pointer-events-none">
                    <img
                      src={item.image}
                      alt="用品卡片"
                      className="w-full h-full object-contain filter drop-shadow-xs"
                    />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    ×
                  </span>
                </div>
              ))}

              {notSaidItemsList.length === 0 && (
                <div className="col-span-full h-32 flex flex-col items-center justify-center text-center border-2 border-dashed border-rose-300/70 rounded-2xl p-4">
                  <p className="text-xs font-bold text-rose-700">
                    老师通知里没有提到的干扰用品，拖放到这里
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Unplaced Pool - 6 Randomly Shuffled Cards */}
        <div className="p-4 sm:p-5 bg-amber-50/60 rounded-3xl border-2 border-amber-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black text-[#263D64]">
              待分类的用品（已随机打乱，共 6 样）：
            </h3>
            {unplacedItems.length < 6 && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-amber-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>全部重放</span>
              </button>
            )}
          </div>

          {unplacedItems.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {unplacedItems.map((item) => {
                const isSelected = selectedItemId === item.id;
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onClick={() =>
                      setSelectedItemId(isSelected ? null : item.id)
                    }
                    className={`relative p-2.5 bg-white border-2 rounded-2xl shadow-xs transition-all cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95 flex flex-col items-center justify-center h-24 sm:h-28 touch-manipulation select-none ${
                      isSelected
                        ? 'border-amber-500 ring-4 ring-amber-300/50 bg-amber-50'
                        : 'border-[#263D64]/15 hover:border-amber-400'
                    }`}
                  >
                    {/* Pure visual presentation: NO text on cards, NO text under pictures */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center pointer-events-none">
                      <img
                        src={item.image}
                        alt="待分类用品"
                        className="w-full h-full object-contain filter drop-shadow-xs"
                      />
                    </div>

                    {/* Quick tap selector buttons for tablet / touch convenience */}
                    {isSelected && (
                      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white p-1 rounded-xl shadow-lg border border-amber-300 z-30 whitespace-nowrap animate-in fade-in zoom-in-90 duration-150">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveItemTo(item.id, 'said');
                          }}
                          className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black cursor-pointer"
                        >
                          送到 老师说
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveItemTo(item.id, 'notSaid');
                          }}
                          className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-black cursor-pointer"
                        >
                          送到 老师没说
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-xs font-bold text-emerald-800 bg-emerald-50 rounded-2xl border border-emerald-200">
              六样用品都已放入上方区域！确认无误后点击下方【完成分类】吧！
            </div>
          )}
        </div>

        {/* Feedback Message Banner */}
        {feedback.show && (
          <div
            className={`p-4 rounded-2xl border-2 space-y-1 animate-in fade-in duration-200 ${
              feedback.isCorrect
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-5 h-5 ${
                  feedback.isCorrect ? 'text-emerald-600' : 'text-amber-600'
                }`}
              />
              <h4 className="font-black text-sm">{feedback.title}</h4>
            </div>
            <p className="text-xs font-bold pl-7 leading-relaxed">{feedback.message}</p>
          </div>
        )}

        {/* Submit or Next Step Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            重置分类
          </button>

          {feedback.isCorrect ? (
            <button
              type="button"
              onClick={onNextLevel}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>继续前进 · 进入第 3 关</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleVerify}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>完成分类 · 提交检查</span>
            </button>
          )}
        </div>

        {/* Bottom Audio Player (Teacher Notice MP3) */}
        <div className="pt-4 border-t border-[#263D64]/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-[#263D64]">教师口头通知录音</span>
            </div>
            <span className="text-[11px] text-[#263D64]/60 font-medium">{audioStatus}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white border border-[#263D64]/20 hover:border-amber-400 text-[#263D64]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>暂停播放</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>播放录音</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReplay}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#263D64]/20 hover:bg-amber-50 text-[#263D64] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重新播放</span>
            </button>

            <div className="flex items-center gap-1 ml-auto">
              <span className="text-[11px] text-[#263D64]/60 mr-1">语速:</span>
              {[
                { label: '慢速 0.85x', val: 0.85 },
                { label: '原速 1.0x', val: 1.0 },
              ].map((rate) => (
                <button
                  key={rate.val}
                  type="button"
                  onClick={() => handleRateChange(rate.val)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    playbackRate === rate.val
                      ? 'bg-[#263D64] text-white'
                      : 'bg-slate-100 text-[#263D64]/70 hover:bg-slate-200'
                  }`}
                >
                  {rate.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#263D64]/60">音量:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 accent-amber-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
