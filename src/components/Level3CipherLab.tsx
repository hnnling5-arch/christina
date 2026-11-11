import React, { useState } from 'react';
import { GameProgress, StudentProfile } from '../types';
import { verifyCipherAnswer, TARGET_MATERIALS } from '../game/rules';
import { audioService } from '../services/audio';
import { ART_MATERIAL_IMAGES } from '../data/constants';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  CheckCircle2,
  Mic,
  MicOff,
  Volume2,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
} from 'lucide-react';

interface Level3Props {
  student: StudentProfile | null;
  progress: GameProgress;
  onUpdateProgress: (updated: GameProgress) => void;
  onNextLevel: () => void;
  onBackToLevel2: () => void;
  onBackToRoadmap?: () => void;
}

export const Level3CipherLab: React.FC<Level3Props> = ({
  student,
  progress,
  onUpdateProgress,
  onNextLevel,
  onBackToLevel2,
  onBackToRoadmap,
}) => {
  // Task 1: 填一填
  const [task1Answer, setTask1Answer] = useState<string>('');

  // Task 2: 找一找 (4 out of 6)
  const [task2Answer, setTask2Answer] = useState<string[]>([]);

  // Task 3: 排一排 (Order sequence)
  const [task3Order, setTask3Order] = useState<string[]>([
    'bring_to_school',
    'listen_class',
    'put_in_bag',
    'prepare_items',
  ]);

  // Task 4: 选一选
  const [task4Answer, setTask4Answer] = useState<string>('');

  // Master mode exclusive: 结构剖析 Task 4B
  const [task4BMasterAnswer, setTask4BMasterAnswer] = useState<string>('');

  // Task 5: 说一说 (Oral practice simulator)
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [hasRecorded, setHasRecorded] = useState<boolean>(false);
  const isExplorer = student?.mode === 'explorer';
  const isMaster = student?.mode === 'master';
  const isDecoder = student?.mode === 'decoder';

  const defaultOral = '根据老师的口头通知，明天上课需要准备好四样美术材料，并收纳好带到学校。';

  const [oralSentence, setOralSentence] = useState<string>(defaultOral);

  const [feedback, setFeedback] = useState<{
    submitted: boolean;
    allPassed?: boolean;
    details?: string[];
  }>({ submitted: false });

  // Move item up/down in Task 3
  const moveTask3Item = (index: number, direction: 'up' | 'down') => {
    const newArr = [...task3Order];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newArr.length) return;
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setTask3Order(newArr);
  };

  const task3Labels: Record<string, { title: string; desc: string }> = {
    listen_class: { title: '明确课程', desc: '听清明天要上的是什么课' },
    prepare_items: { title: '准备材料', desc: '按通知要求备齐所需的手工用具' },
    put_in_bag: { title: '妥善收纳', desc: '把准备好的用品放进书包' },
    bring_to_school: { title: '准时携带', desc: '明天上学记得带到学校来' },
  };

  const handleToggleTask2 = (item: string) => {
    if (task2Answer.includes(item)) {
      setTask2Answer(task2Answer.filter((i) => i !== item));
    } else {
      if (task2Answer.length < 4) {
        setTask2Answer([...task2Answer, item]);
      }
    }
  };

  const handleSimulateRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setHasRecorded(true);
      audioService.playCelebrationChime();
    } else {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setHasRecorded(true);
      }, 3500);
    }
  };

  const handlePlaySampleOral = () => {
    audioService.playTeacherNotice();
  };

  const handleSubmitAll = () => {
    const t1 = verifyCipherAnswer('fillBlank', task1Answer);
    const t2 = verifyCipherAnswer('pickFour', task2Answer);
    const t3 = verifyCipherAnswer('sortOrder', task3Order);
    const t4 = verifyCipherAnswer('locationChoice', task4Answer);
    const t4b = !isMaster || task4BMasterAnswer === 'struct_action';
    const t5 = hasRecorded || isExplorer;

    const errors: string[] = [];
    if (!t1.isCorrect) errors.push('第1题【填一填】：明天上的是什么课呢？再听听通知开头哦！');
    if (!t2.isCorrect) errors.push('第2题【找一找】：仔细回想老师要求的四样手工用具，请选齐四样哦！');
    if (!t3.isCorrect) errors.push('第3题【排一排】：想一想做事的合理顺序（先知道课程、再备齐材料、然后收好、最后带来）！');
    if (!t4.isCorrect) errors.push('第4题【选一选】：老师提醒要把准备好的用品收在哪里呢？再听听通知结尾！');
    if (isMaster && !t4b) errors.push('【大师结构剖析】：放进书包与带来学校属于‘核心注意事项与携带执行要求’！');
    if (!t5) errors.push('第5题【说一说】：请点击麦克风练习朗读口头回应句型！');

    if (errors.length === 0) {
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

      const level3Bonus = isMaster ? 120 : isDecoder ? 100 : 80;

      const updated: GameProgress = {
        ...progress,
        currentLevel: Math.max(progress.currentLevel, 4),
        badges: {
          ...progress.badges,
          scissors: true,
        },
        score: progress.badges.scissors ? progress.score : progress.score + level3Bonus,
        completedTasks: Array.from(new Set([...progress.completedTasks, 'level3_cipher_lab'])),
        selfOralResponse: oralSentence,
        updatedAt: new Date().toISOString(),
      };
      onUpdateProgress(updated);
      setFeedback({
        submitted: true,
        allPassed: true,
        details: [
          isMaster
            ? '太卓越了！声音密码大师顺利破解五重实验与通知结构要素剖析！恭喜荣获【魔法灯笼徽章】(+120分)！'
            : isDecoder
            ? '太棒了！独立完成排序、辨析与口头转述！恭喜荣获【魔法灯笼徽章】(+100分)！'
            : '五重密码实验全部破解成功！恭喜你荣获【魔法灯笼徽章】(+80分)！'
        ],
      });
    } else {
      setFeedback({
        submitted: true,
        allPassed: false,
        details: errors,
      });
    }
  };

  const isBadgeEarned = progress.badges.scissors;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBackToLevel2 && (
            <button
              onClick={onBackToLevel2}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-[#263D64]/15 hover:bg-amber-50 text-xs font-bold text-[#263D64] transition-colors flex items-center gap-1"
            >
              <span>← 返回第 2 关</span>
            </button>
          )}
          {onBackToRoadmap && (
            <button
              onClick={onBackToRoadmap}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-[#263D64]/15 hover:bg-amber-50 text-xs font-bold text-[#263D64] transition-colors flex items-center gap-1"
            >
              <span>路线图</span>
            </button>
          )}
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-900 text-xs font-bold">
          <span>关卡三 · 声音密码实验室</span>
        </div>
        <div className="w-16" />
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-[#263D64]">五重密码大破解</h1>
        <p className="text-xs sm:text-sm text-[#263D64]/70 max-w-xl mx-auto">
          完成填一填、找一找、排一排、选一选与说一说，破解声音密码，领取魔法灯笼徽章！
        </p>
      </div>

      {/* 5 Tasks Container */}
      <div className="space-y-6">
        {/* Task 1: 填一填 */}
        <div className="storybook-card rounded-3xl p-6 bg-white space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#F4C66A] text-[#263D64] font-black text-sm flex items-center justify-center">
              1
            </span>
            <h2 className="text-base font-black text-[#263D64]">【填一填】：根据通知，明天准备上什么课？</h2>
          </div>
          <div className="p-4 bg-[#FFF5E5] rounded-2xl border border-[#263D64]/10 flex flex-wrap items-center gap-3">
            <span className="font-bold text-sm sm:text-base text-[#263D64]">明天准备上</span>
            <div className="flex gap-2">
              {['美术', '华文', '数学', '音乐'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setTask1Answer(opt)}
                  className={`px-4 py-2 rounded-xl text-sm font-black border-2 transition-all ${
                    task1Answer === opt
                      ? 'bg-[#263D64] text-white border-[#263D64] shadow-sm'
                      : 'bg-white text-[#263D64] border-[#263D64]/20 hover:border-[#263D64]/40'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <span className="font-bold text-sm sm:text-base text-[#263D64]">课。</span>
          </div>
        </div>

        {/* Task 2: 找一找 */}
        <div className="storybook-card rounded-3xl p-6 bg-white space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#F4C66A] text-[#263D64] font-black text-sm flex items-center justify-center">
              2
            </span>
            <h2 className="text-base font-black text-[#263D64]">
              【找一找】：从六张用品中选出四种正确用品（已选 {task2Answer.length} / 4）
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { name: '胶水', img: ART_MATERIAL_IMAGES.glue },
              { name: '彩色纸', img: ART_MATERIAL_IMAGES.coloredPaper },
              { name: '剪刀', img: ART_MATERIAL_IMAGES.scissors },
              { name: '贴纸', img: ART_MATERIAL_IMAGES.stickers },
              { name: '铅笔', img: ART_MATERIAL_IMAGES.pencil },
              { name: '尺', img: ART_MATERIAL_IMAGES.ruler },
            ].map((item) => {
              const isSelected = task2Answer.includes(item.name);
              return (
                <button
                  key={item.name}
                  data-cipher-item={item.name}
                  onClick={() => handleToggleTask2(item.name)}
                  aria-label={item.name}
                  className={`p-3 rounded-2xl border-2 flex items-center justify-center relative transition-all cursor-pointer h-24 sm:h-28 ${
                    isSelected
                      ? 'bg-amber-100 border-[#F4C66A] text-[#263D64] shadow-xs ring-2 ring-[#F4C66A]'
                      : 'bg-[#FFF5E5]/50 border-[#263D64]/15 hover:border-[#263D64]/30 hover:bg-white'
                  }`}
                >
                  {/* 图片纯视觉呈现，卡片及图片底部绝对无任何文字 */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
                    <img
                      src={item.img}
                      alt="手工用品选项"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#263D64] text-[#F4C66A] flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Task 3: 排一排 */}
        <div className="storybook-card rounded-3xl p-6 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#F4C66A] text-[#263D64] font-black text-sm flex items-center justify-center">
                3
              </span>
              <h2 className="text-base font-black text-[#263D64]">
                【排一排】：将准备要求按合理先后顺序排列（使用上下箭头调整）
              </h2>
            </div>
            {isExplorer && (
              <button
                onClick={() =>
                  setTask3Order(['listen_class', 'prepare_items', 'put_in_bag', 'bring_to_school'])
                }
                className="text-xs font-bold text-[#8CBF9E] hover:underline"
              >
                一键排顺 (探索家支架)
              </button>
            )}
          </div>

          <div className="space-y-2">
            {task3Order.map((key, index) => {
              const item = task3Labels[key];
              return (
                <div
                  key={key}
                  className="p-3 bg-[#FFF5E5] rounded-2xl border border-[#263D64]/15 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#263D64] text-white font-black text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <div className="text-sm font-black text-[#263D64]">{item.title}</div>
                      <div className="text-xs text-[#263D64]/65">{item.desc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveTask3Item(index, 'up')}
                      disabled={index === 0}
                      className="w-10 h-10 rounded-xl bg-white border-2 border-[#263D64]/20 disabled:opacity-20 hover:bg-amber-100 flex items-center justify-center text-[#263D64] active:scale-90 transition-all cursor-pointer shadow-2xs"
                      title="上移"
                    >
                      <ArrowUp className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTask3Item(index, 'down')}
                      disabled={index === task3Order.length - 1}
                      className="w-10 h-10 rounded-xl bg-white border-2 border-[#263D64]/20 disabled:opacity-20 hover:bg-amber-100 flex items-center justify-center text-[#263D64] active:scale-90 transition-all cursor-pointer shadow-2xs"
                      title="下移"
                    >
                      <ArrowDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task 4: 选一选 */}
        <div className="storybook-card rounded-3xl p-6 bg-white space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#F4C66A] text-[#263D64] font-black text-sm flex items-center justify-center">
              4
            </span>
            <h2 className="text-base font-black text-[#263D64]">
              【选一选】：老师提醒大家要把四样用品放在哪里？
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'bag', label: '🎒 收纳进书包' },
              { id: 'desk', label: '🪑 放在家里书桌抽屉里' },
              { id: 'pocket', label: '👖 随手塞进衣服口袋' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTask4Answer(opt.id)}
                className={`p-3.5 rounded-xl font-black text-sm border-2 text-left transition-all ${
                  task4Answer === opt.id
                    ? 'bg-[#263D64] text-white border-[#263D64] shadow-md'
                    : 'bg-[#FFF5E5]/50 text-[#263D64] border-[#263D64]/20 hover:border-[#263D64]/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Master Exclusive Task 4B: 通知结构要素剖析 */}
        {isMaster && (
          <div className="storybook-card rounded-3xl p-6 bg-purple-50/80 border-2 border-purple-300 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-purple-600 text-white font-black text-sm flex items-center justify-center">
                ⚡
              </span>
              <h2 className="text-base font-black text-[#263D64]">
                【结构要素深度剖析】：口头通知结尾交代用品存放位置与带到学校的提醒，属于哪一类结构要素？
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'struct_action', label: '🎯 核心注意事项与携带执行要求（听力落实重点）' },
                { id: 'struct_greeting', label: '👋 开头称呼与问候语' },
                { id: 'struct_subject', label: '📚 仅是课程科目介绍' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTask4BMasterAnswer(opt.id)}
                  className={`p-3.5 rounded-xl font-black text-xs sm:text-sm border-2 text-left transition-all ${
                    task4BMasterAnswer === opt.id
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

        {/* Task 5: 说一说 (Oral Response Simulator) */}
        <div className="storybook-card-warm rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#F28C75] text-white font-black text-sm flex items-center justify-center">
                5
              </span>
              <h2 className="text-base font-black text-[#263D64]">
                【说一说】：口头回应练习（SP 1.2.1 适当回应能力）
              </h2>
            </div>
            <button
              onClick={handlePlaySampleOral}
              className="text-xs font-bold text-[#263D64] bg-white border border-[#263D64]/20 hover:bg-amber-50 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#8CBF9E]" />
              <span>听示范通知</span>
            </button>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#263D64]/10 space-y-3">
            <div className="text-xs text-[#263D64]/70 font-bold">请练习用以下表达支架向爸爸妈妈或同伴复述要求：</div>
            <div className="text-base font-black text-[#263D64] bg-[#FFF5E5] p-3 rounded-xl border border-dashed border-[#F4C66A] leading-relaxed">
              “根据老师的口头通知，明天上______课需要准备好四样材料，并整齐收纳在______里带到学校。”
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={handleSimulateRecord}
                className={`px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition-all ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse shadow-md'
                    : hasRecorded
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#F4C66A] text-[#263D64] hover:bg-[#F4C66A]/90'
                }`}
              >
                {isRecording ? <Mic className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
                <span>{isRecording ? '正在录音中... (请大胆朗读)' : hasRecorded ? '✓ 已完成口头练习' : '开始练习朗读'}</span>
              </button>

              <span className="text-xs text-[#263D64]/60">
                {hasRecorded ? '🌟 表达清晰，发音自然！' : '按住麦克风，说出你听到的通知重点。'}
              </span>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback.submitted && feedback.details && (
          <div
            className={`p-5 rounded-3xl border-3 space-y-3 shadow-xs ${
              feedback.allPassed
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2 font-black text-base">
              {feedback.allPassed ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : (
                <span className="text-xl shrink-0">🧡</span>
              )}
              <span>
                {feedback.allPassed
                  ? '🎉 太棒了！五道题目全部破解成功！'
                  : '别着急，这几道题再想一想哦！'}
              </span>
            </div>

            <div className="space-y-1.5 bg-white/90 p-3.5 rounded-2xl border border-amber-200 text-xs sm:text-sm font-bold text-amber-900">
              {feedback.details.map((msg, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span>{msg}</span>
                </div>
              ))}
            </div>

            {!feedback.allPassed && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => audioService.playTeacherNotice()}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>🎧 点击再听一次老师通知</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Submit Action */}
        <div className="pt-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={handleSubmitAll}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#F4C66A] hover:bg-[#F4C66A]/90 text-[#263D64] font-black text-base shadow-md transition-all flex items-center justify-center gap-2 min-h-[52px] cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 text-[#263D64]" />
              <span>核对五道题目 · 领取魔法灯笼徽章</span>
            </button>
          </div>

          {/* Prominent Next Level Card */}
          {isBadgeEarned && (
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-100 to-emerald-100 border-2 border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md animate-in fade-in">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/images/badges/badge-lantern.svg"
                  alt="魔法灯笼徽章"
                  className="w-12 h-12 object-contain drop-shadow-sm"
                />
                <div>
                  <div className="text-base font-black text-emerald-950">
                    太棒啦！你已经获得了【魔法灯笼徽章】！
                  </div>
                  <div className="text-xs text-emerald-800 font-bold mt-0.5">
                    声音密码全部解开，快前往艺术材料仓库验收全部徽章吧！
                  </div>
                </div>
              </div>
              <button
                onClick={onNextLevel}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#263D64] hover:bg-[#263D64]/90 text-white font-black text-base shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 cursor-pointer min-h-[52px] shrink-0"
              >
                <span>前往第 4 关：艺术材料仓库</span>
                <ArrowRight className="w-5 h-5 text-[#F4C66A]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
