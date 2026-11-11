import React from 'react';
import { StudentProfile } from '../types';
import { AVATARS } from '../data/constants';
import { Volume2, VolumeX, ShieldAlert, BookOpen, Map, Award, Users, Trophy, Palette, Lock } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  student: StudentProfile | null;
  onOpenEntryModal: () => void;
  onOpenTeacherModal: () => void;
  isDemoMode: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isCompleted?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  student,
  onOpenEntryModal,
  onOpenTeacherModal,
  isDemoMode,
  soundEnabled,
  onToggleSound,
  isCompleted = false,
}) => {
  const currentAvatar = AVATARS.find((a) => a.id === student?.avatarId) || AVATARS[0];

  const navLinks = [
    { id: 'home', label: '首页', icon: BookOpen },
    { id: 'quest', label: '我的任务', icon: Award },
    { id: 'roadmap', label: '我的冒险', icon: Map },
    { id: 'warehouse', label: '收藏徽章', icon: Award },
    {
      id: 'draw',
      label: isCompleted ? '创艺园地' : '创艺园地 🔒',
      icon: isCompleted ? Palette : Lock,
    },
    { id: 'leaderboard', label: '看看谁先完成', icon: Trophy },
    { id: 'studio', label: '找朋友一起创作', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FFF5E5]/95 backdrop-blur-md border-b-2 border-[#263D64]/10 shadow-xs">
      {/* Top Database Status Banner */}
      <div
        className={`border-b px-4 py-1.5 text-center text-xs font-bold flex items-center justify-center gap-2 ${
          isDemoMode
            ? 'bg-amber-100/90 border-amber-300 text-amber-900'
            : 'bg-emerald-100/90 border-emerald-300 text-emerald-900'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full inline-block ${
            isDemoMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
          }`}
        />
        <span>
          {isDemoMode
            ? '演示模式 (Demo Mode)：当前使用本地存储，尚未连接云端真实 Firestore 数据库。'
            : '云端模式：Firebase Firestore 实时云端数据库已成功连接。'}
        </span>
      </div>

      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single text wordmark with Palette icon */}
        <button
          onClick={() => onSelectTab('home')}
          className="text-lg sm:text-xl font-black tracking-tight text-[#263D64] flex items-center gap-2 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Palette className="w-6 h-6 text-amber-500 fill-amber-200" />
          <span>失落的艺术展</span>
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav className="hidden xl:flex items-center gap-5 text-sm font-bold text-[#263D64]/75">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onSelectTab(link.id)}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-[#263D64] text-[#263D64] font-black'
                    : 'border-transparent hover:text-[#263D64]'
                }`}
              >
                <Icon className="w-4 h-4 text-amber-600" />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action or Student profile pill */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? '静音' : '开启声音'}
            title={soundEnabled ? '声音已开启' : '声音已静音'}
            className="p-2 rounded-xl bg-white border border-[#263D64]/15 hover:bg-amber-50 text-[#263D64] transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#8CBF9E]" /> : <VolumeX className="w-4 h-4 text-[#F28C75]" />}
          </button>

          {/* Student Status or Switch Profile Button */}
          {student ? (
            <button
              onClick={onOpenEntryModal}
              title="切换学生角色或班级"
              className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border-2 border-[#263D64]/15 hover:border-[#F4C66A] shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-xs font-black text-amber-900">
                {student.nickname.charAt(0)}
              </div>
              <div className="text-left leading-tight hidden sm:block">
                <div className="text-xs font-black text-[#263D64]">{student.nickname}</div>
                <div className="text-[10px] text-[#263D64]/60 font-medium">班级 {student.classCode}</div>
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenEntryModal}
              className="px-4 py-2 text-xs font-bold text-[#263D64] bg-[#F4C66A] rounded-xl hover:bg-[#F4C66A]/90 shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              学生登入
            </button>
          )}

          {/* Teacher Portal button */}
          <button
            onClick={onOpenTeacherModal}
            className="p-2 sm:px-3 sm:py-2 text-xs font-bold text-[#263D64] bg-white border border-[#263D64]/20 rounded-xl hover:bg-blue-50 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-[#263D64]" />
            <span className="hidden sm:inline">教师管理</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="xl:hidden flex items-center justify-around border-t border-[#263D64]/10 bg-white/70 py-2 px-2 overflow-x-auto text-xs font-bold text-[#263D64]/80">
        {navLinks.map((link) => {
          const isActive = currentTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onSelectTab(link.id)}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap cursor-pointer ${
                isActive ? 'bg-[#F4C66A] text-[#263D64] font-black' : 'hover:bg-amber-50'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
