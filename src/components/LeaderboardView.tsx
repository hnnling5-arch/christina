import React, { useState, useEffect, useCallback } from 'react';
import { LeaderboardEntry, LearningMode, StudentProfile } from '../types';
import { storageService } from '../services/storage';
import { AVATARS, CLASS_OPTIONS, MODE_INFO } from '../data/constants';
import { Trophy, Filter, RefreshCw, ShieldCheck, Database, Info } from 'lucide-react';
import { getDbConnectionInfo, DbConnectionInfo } from '../services/firebase';

interface LeaderboardViewProps {
  student: StudentProfile | null;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ student }) => {
  const [activeMode, setActiveMode] = useState<LearningMode>(student?.mode || 'explorer');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbInfo, setDbInfo] = useState<DbConnectionInfo>(getDbConnectionInfo());
  const [dataSourceText, setDataSourceText] = useState<string>('');

  const loadLeaderboardData = useCallback(async (mode: LearningMode, cFilter: string) => {
    setIsLoading(true);
    try {
      const result = await storageService.fetchLeaderboardFromDb(mode, cFilter);
      setEntries(result.entries);
      setDataSourceText(result.source);
      setDbInfo(getDbConnectionInfo());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboardData(activeMode, classFilter);
  }, [activeMode, classFilter, loadLeaderboardData]);

  const topTen = entries.slice(0, 10);

  // Find student's own entry
  const myIndex = entries.findIndex((e) => e.studentId === student?.anonymousId);
  const myRank = myIndex >= 0 ? myIndex + 1 : null;
  const myEntry = myIndex >= 0 ? entries[myIndex] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
          <Trophy className="w-4 h-4 text-amber-600" />
          <span>三大独立排行榜 · 隐私安全保护</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#263D64]">寻宝风云榜</h1>
        <p className="text-xs sm:text-sm text-[#263D64]/70 max-w-xl mx-auto">
          依三种不同学习挑战模式设立独立排行榜。榜单仅严格显示昵称、积分与名次，全面杜绝隐私泄露与非正式成绩篡改。
        </p>
      </div>

      {/* Database Status Alert Banner */}
      <div
        className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs ${
          dbInfo.isDemo
            ? 'bg-amber-50/90 border-amber-300 text-amber-900'
            : 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
        }`}
      >
        <div className="flex items-start sm:items-center gap-2.5">
          <Database className={`w-5 h-5 shrink-0 ${dbInfo.isDemo ? 'text-amber-600' : 'text-emerald-600'}`} />
          <div>
            <div className="font-black text-sm flex items-center gap-2">
              <span>{dbInfo.isDemo ? '🟡 本地模拟数据库 (Demo Mode)' : '🟢 Firebase Firestore 实时云端数据库'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/80 border border-current">
                {dbInfo.isDemo ? '演示模式' : '已连接'}
              </span>
            </div>
            <p className="text-xs opacity-90 mt-0.5">
              {dbInfo.isDemo
                ? '当前排行榜成绩读取自本地模拟数据库（未连接云端 Firestore，绝不伪称已连接真实数据库）。'
                : '当前排行榜成绩实时从 Firebase Firestore 云端数据库安全读取。'}
            </p>
          </div>
        </div>

        <button
          onClick={() => loadLeaderboardData(activeMode, classFilter)}
          disabled={isLoading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white text-[#263D64] border border-[#263D64]/20 hover:bg-amber-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#F4C66A]' : ''}`} />
          <span>{isLoading ? '读取中...' : '刷新数据库'}</span>
        </button>
      </div>

      {/* 3 Independent Modes Tabs */}
      <div className="space-y-2">
        <div className="flex p-1.5 bg-white/90 rounded-2xl border-2 border-[#263D64]/10 shadow-xs max-w-xl mx-auto">
          {(['explorer', 'decoder', 'master'] as const).map((mKey) => {
            const info = MODE_INFO[mKey];
            const isActive = activeMode === mKey;
            return (
              <button
                key={mKey}
                onClick={() => setActiveMode(mKey)}
                className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#263D64] text-white shadow-md'
                    : 'text-[#263D64]/70 hover:text-[#263D64] hover:bg-amber-50'
                }`}
              >
                {info.title}
              </button>
            );
          })}
        </div>

        {/* Current Active Mode Description */}
        <div className="text-center text-xs font-bold text-[#263D64]/70">
          独立榜单：
          <span className="text-[#263D64] font-black underline underline-offset-4 decoration-[#F4C66A]">
            {MODE_INFO[activeMode].title}专属榜
          </span>
          {' · '}
          {activeMode === 'explorer' && '（多重支架 · 语音伴读 · 基础认知）'}
          {activeMode === 'decoder' && '（独立聆听 · 自主笔记 · 4选6材料排查）'}
          {activeMode === 'master' && '（高阶辨析 · 干扰项理由陈述 · 科学课情境迁移）'}
        </div>
      </div>

      {/* Class Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#263D64]/10 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-[#263D64]">
          <Filter className="w-4 h-4 text-[#F28C75]" />
          <span>班级筛选：</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setClassFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              classFilter === 'ALL'
                ? 'bg-[#F4C66A] text-[#263D64] font-black shadow-2xs'
                : 'bg-[#FFF5E5] text-[#263D64]/70 hover:bg-amber-100'
            }`}
          >
            全校展示
          </button>
          {CLASS_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => setClassFilter(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                classFilter === c
                  ? 'bg-[#F4C66A] text-[#263D64] font-black shadow-2xs'
                  : 'bg-[#FFF5E5] text-[#263D64]/70 hover:bg-amber-100'
              }`}
            >
              {c} 班
            </button>
          ))}
        </div>
      </div>

      {/* Student's Own Rank Card */}
      {student && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-100/90 to-orange-100/90 border-2 border-[#F4C66A] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-xs">
              {AVATARS.find((a) => a.id === student.avatarId)?.emoji || '🦁'}
            </div>
            <div>
              <div className="text-xs font-bold text-[#263D64]/60 flex items-center gap-1.5">
                <span>你的个人成绩位置 ({MODE_INFO[activeMode].title}独立榜)</span>
                {student.mode !== activeMode && (
                  <span className="text-[#F28C75] font-bold">
                    (当前注册为: {MODE_INFO[student.mode].title})
                  </span>
                )}
              </div>
              <div className="text-sm font-black text-[#263D64]">
                寻宝昵称：{student.nickname}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-[#263D64]/60 font-bold">榜单名次</div>
              <div className="text-lg font-black text-[#F28C75]">
                {myRank ? `第 ${myRank} 名` : student.mode === activeMode ? '努力闯关中' : '未在此榜挑战'}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-[#263D64]/60 font-bold">正式积分</div>
              <div className="text-lg font-black text-[#263D64]">
                {myEntry?.score ? `${myEntry.score} 分` : '0 分'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security & Anti-tampering Notice */}
      <div className="p-3 bg-white/70 rounded-2xl border border-[#263D64]/10 flex items-center gap-2 text-xs text-[#263D64]/80">
        <ShieldCheck className="w-4 h-4 text-[#8CBF9E] shrink-0" />
        <span>
          <strong>成绩防篡改与隐私规范：</strong>
          排行榜仅呈现【名次】、【寻宝昵称】与【积分】。客户端严禁直接任意修改正式成绩，所有积分由关卡核实后单向安全累积。
        </span>
      </div>

      {/* Leaderboard Table: Strictly displaying [名次] [昵称] [分数] */}
      <div className="storybook-card rounded-3xl overflow-hidden bg-white shadow-md border-2 border-[#263D64]/15">
        <div className="p-4 bg-[#FFF5E5] border-b-2 border-[#263D64]/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#263D64]" />
            <h3 className="font-black text-[#263D64] text-sm sm:text-base">
              {MODE_INFO[activeMode].title} · 荣誉名次榜
            </h3>
          </div>
          <span className="text-xs text-[#263D64]/60 font-bold">
            读取来源: {dataSourceText || (dbInfo.isDemo ? '本地模拟数据库' : '云端数据库')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFFBF2] border-b-2 border-[#263D64]/10 text-xs font-black text-[#263D64]">
                <th className="py-4 px-6 text-center w-24">名次</th>
                <th className="py-4 px-6">游戏寻宝昵称</th>
                <th className="py-4 px-6 text-right w-32">积分</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263D64]/10 text-sm font-bold text-[#263D64]">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-xs text-[#263D64]/60 font-bold">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#F4C66A]" />
                      <span>正在从数据库安全加载最新成绩...</span>
                    </div>
                  </td>
                </tr>
              ) : topTen.length > 0 ? (
                topTen.map((entry, idx) => {
                  const rank = idx + 1;
                  const avatar = AVATARS.find((a) => a.id === entry.avatarId) || AVATARS[0];
                  const isMe = entry.studentId === student?.anonymousId;

                  return (
                    <tr
                      key={`${entry.studentId}_${entry.mode}`}
                      className={`transition-colors ${
                        isMe
                          ? 'bg-amber-100/60 font-black'
                          : idx % 2 === 0
                          ? 'bg-white'
                          : 'bg-[#FFFBF2]/40'
                      } hover:bg-amber-50`}
                    >
                      {/* 1. 名次 */}
                      <td className="py-4 px-6 text-center">
                        {rank === 1 ? (
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-2xl" title="第1名">🥇</span>
                            <span className="text-xs font-black text-amber-700">第 1 名</span>
                          </div>
                        ) : rank === 2 ? (
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-2xl" title="第2名">🥈</span>
                            <span className="text-xs font-black text-slate-600">第 2 名</span>
                          </div>
                        ) : rank === 3 ? (
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-2xl" title="第3名">🥉</span>
                            <span className="text-xs font-black text-amber-800">第 3 名</span>
                          </div>
                        ) : (
                          <span className="text-sm font-black text-[#263D64]/70">
                            第 {rank} 名
                          </span>
                        )}
                      </td>

                      {/* 2. 昵称 (with cartoon avatar emoji) */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl shrink-0">{avatar.emoji}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base font-black text-[#263D64]">
                              {entry.nickname}
                            </span>
                            {isMe && (
                              <span className="text-[10px] bg-[#263D64] text-white px-2 py-0.5 rounded-full font-bold">
                                你
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. 分数 */}
                      <td className="py-4 px-6 text-right">
                        <span className="font-mono text-lg font-black text-[#F28C75] tabular-nums">
                          {entry.score}
                        </span>
                        <span className="text-xs text-[#263D64]/60 ml-1 font-bold">分</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-xs text-[#263D64]/50">
                    该班级暂无挑战记录，快快成为本模式第一个上榜的寻宝小达人吧！
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
