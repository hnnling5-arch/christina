import React, { useState } from 'react';
import { StudentProfile, LearningMode } from '../types';
import { AVATARS, CLASS_OPTIONS, MODE_INFO } from '../data/constants';
import { APPROVED_NICKNAMES } from '../game/rules';
import { ShieldCheck, Dices, X, Sparkles, Check, Lock, UserCheck } from 'lucide-react';
import { ensureAnonymousAuth, getDbConnectionInfo } from '../services/firebase';

interface StudentEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudent: StudentProfile | null;
  onSave: (student: StudentProfile) => void;
}

export const StudentEntryModal: React.FC<StudentEntryModalProps> = ({
  isOpen,
  onClose,
  currentStudent,
  onSave,
}) => {
  const [classCode, setClassCode] = useState<string>(currentStudent?.classCode || '1A');
  const [avatarId, setAvatarId] = useState<string>(currentStudent?.avatarId || 'lion');
  const [selectedNickname, setSelectedNickname] = useState<string>(
    currentStudent?.nickname || APPROVED_NICKNAMES[0]
  );
  const [nicknameBatchOffset, setNicknameBatchOffset] = useState<number>(0);
  const [mode, setMode] = useState<LearningMode>(currentStudent?.mode || 'explorer');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Show a rolling window of 8 nicknames from the approved list
  const BATCH_SIZE = 8;
  const currentBatch = APPROVED_NICKNAMES.slice(
    nicknameBatchOffset,
    nicknameBatchOffset + BATCH_SIZE
  );

  const handleNextNicknameBatch = () => {
    const nextOffset = (nicknameBatchOffset + BATCH_SIZE) % APPROVED_NICKNAMES.length;
    setNicknameBatchOffset(nextOffset);
    // Auto-pick the first one of next batch if current isn't in it
    const nextBatch = APPROVED_NICKNAMES.slice(nextOffset, nextOffset + BATCH_SIZE);
    if (!nextBatch.includes(selectedNickname as any)) {
      setSelectedNickname(nextBatch[0]);
    }
  };

  const handleRandomSelect = () => {
    const randomIdx = Math.floor(Math.random() * APPROVED_NICKNAMES.length);
    setSelectedNickname(APPROVED_NICKNAMES[randomIdx]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Authenticate anonymously via Firebase Auth
      let anonUid = currentStudent?.anonymousId;
      if (!anonUid) {
        const firebaseUid = await ensureAnonymousAuth();
        anonUid = firebaseUid || `anon_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      }

      const newProfile: StudentProfile = {
        anonymousId: anonUid,
        classCode,
        nickname: selectedNickname,
        avatarId,
        mode,
        createdAt: currentStudent?.createdAt || new Date().toISOString(),
      };

      onSave(newProfile);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const dbInfo = getDbConnectionInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FFF5E5] border-4 border-[#263D64]/20 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        {currentStudent && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/80 hover:bg-white text-[#263D64] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8CBF9E]/20 text-[#263D64] text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4 text-[#8CBF9E]" />
            <span>隐私安全保护 · 无须且不得输入真实姓名</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#263D64]">开启你的声音寻宝之旅</h2>
          <p className="text-xs sm:text-sm text-[#263D64]/70 mt-1 max-w-lg mx-auto">
            根据华小隐私规范，学生只能选择预设的班级、可爱卡通昵称、动物伙伴头像及挑战模式。
          </p>
        </div>

        {/* DB Connection & Auth Security Banner */}
        <div className="mb-6 p-3.5 rounded-2xl bg-white/90 border border-[#263D64]/15 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#8CBF9E] shrink-0" />
            <div>
              <span className="font-black text-[#263D64]">匿名身份验证：</span>
              <span className="text-[#263D64]/70">保障每名学生只能修改自己的游戏资料和成绩</span>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-black shrink-0 ${
              dbInfo.isDemo
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
            }`}
          >
            {dbInfo.isDemo ? '🟡 Demo 演示模式' : '🟢 云端数据库已同步'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Class */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-black text-[#263D64] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#263D64] text-white text-xs flex items-center justify-center font-bold">1</span>
                <span>选择你的班级代码</span>
              </label>
              <span className="text-xs text-[#263D64]/60 font-bold">当前选择: {classCode} 班</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {CLASS_OPTIONS.map((c) => {
                const isSelected = classCode === c;
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setClassCode(c)}
                    className={`py-2.5 rounded-xl font-black text-sm border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#263D64] text-white border-[#263D64] shadow-md scale-105'
                        : 'bg-white text-[#263D64] border-[#263D64]/20 hover:border-[#263D64]/50'
                    }`}
                  >
                    {c} 班
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Choose Game Nickname (Selection Only - NO Free text name entry) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-black text-[#263D64] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#263D64] text-white text-xs flex items-center justify-center font-bold">2</span>
                <span>选择游戏寻宝昵称 (严禁使用真实姓名)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRandomSelect}
                  className="text-xs font-bold text-[#263D64] bg-white px-2.5 py-1 rounded-lg border border-[#263D64]/20 hover:bg-amber-50 flex items-center gap-1 transition-colors cursor-pointer"
                  title="随机挑选一个昵称"
                >
                  <Dices className="w-3.5 h-3.5 text-[#F4C66A]" />
                  <span>随机选</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextNicknameBatch}
                  className="text-xs font-bold text-[#263D64] bg-white px-2.5 py-1 rounded-lg border border-[#263D64]/20 hover:bg-amber-50 transition-colors cursor-pointer"
                >
                  换一批 🔄
                </button>
              </div>
            </div>

            {/* Selected Nickname Display Badge */}
            <div className="p-3 bg-amber-100/70 rounded-2xl border-2 border-[#F4C66A] flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#263D64]" />
                <span className="text-xs text-[#263D64]/70 font-bold">当前选定昵称：</span>
                <span className="text-sm font-black text-[#263D64] tracking-wide">
                  {selectedNickname}
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#8CBF9E] bg-white px-2 py-0.5 rounded-md">
                ✅ 安全无隐私泄露
              </span>
            </div>

            {/* Nickname Selection Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {currentBatch.map((nick) => {
                const isSelected = selectedNickname === nick;
                return (
                  <button
                    type="button"
                    key={nick}
                    onClick={() => setSelectedNickname(nick)}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all border-2 text-center cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#263D64] text-white border-[#263D64] shadow-sm scale-102'
                        : 'bg-white text-[#263D64] border-[#263D64]/15 hover:border-[#263D64]/40 hover:bg-amber-50/50'
                    }`}
                  >
                    <span>{nick}</span>
                    {isSelected && (
                      <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-[#F4C66A] flex items-center justify-center text-[8px] text-[#263D64]">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#263D64]/60 mt-1.5">
              🔒 学生只能从系统提供的趣味卡通昵称中点选，杜绝输入学生本人或同学的真实姓名。
            </p>
          </div>

          {/* Step 3: Choose Avatar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-black text-[#263D64] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#263D64] text-white text-xs flex items-center justify-center font-bold">3</span>
                <span>挑选卡通头像伙伴</span>
              </label>
              <span className="text-xs text-[#263D64]/60 font-bold">
                {AVATARS.find((a) => a.id === avatarId)?.name}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {AVATARS.map((av) => {
                const isSelected = avatarId === av.id;
                return (
                  <button
                    type="button"
                    key={av.id}
                    onClick={() => setAvatarId(av.id)}
                    className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-100 border-[#F4C66A] shadow-md ring-2 ring-[#F4C66A] scale-105'
                        : 'bg-white border-[#263D64]/10 hover:border-[#263D64]/30'
                    }`}
                  >
                    <span className="text-3xl mb-1">{av.emoji}</span>
                    <span className="text-[11px] font-bold text-[#263D64] leading-tight">{av.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Three Modes Selection */}
          <div>
            <label className="block text-sm font-black text-[#263D64] mb-2 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#263D64] text-white text-xs flex items-center justify-center font-bold">4</span>
              <span>选一个你喜欢的玩法，开始冒险吧！</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: 'explorer' as LearningMode, title: '小小探索家', tag: '慢速重听 · 温和提示' },
                { key: 'decoder' as LearningMode, title: '独立解密员', tag: '独立自主 · 边听边记' },
                { key: 'master' as LearningMode, title: '声音密码大师', tag: '大显身手 · 精彩挑战' },
              ].map((m) => {
                const isSelected = mode === m.key;
                return (
                  <button
                    type="button"
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    className={`p-3.5 rounded-2xl text-left border-2 transition-all relative cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 shadow-md ring-2 ring-amber-400 border-[#263D64]'
                        : 'bg-white border-[#263D64]/15 hover:border-amber-300'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#263D64] text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <div className="text-base font-black text-[#263D64] mb-1">{m.title}</div>
                    <div className="text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md inline-block">
                      {m.tag}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-[#F4C66A] hover:bg-[#F4C66A]/90 text-[#263D64] font-black text-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-[#263D64]" />
              <span>{isSubmitting ? '正在安全接入中...' : '整装待发 · 开启大冒险！'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
