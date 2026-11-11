import React, { useState, useEffect } from 'react';
import { StudentProfile, GameProgress } from './types';
import { storageService } from './services/storage';
import { audioService } from './services/audio';
import { subscribeDbStatus } from './services/firebase';
import { Navbar } from './components/Navbar';
import { HeroHome } from './components/HeroHome';
import { RoadmapView } from './components/RoadmapView';
import { Level1SoundArchive } from './components/Level1SoundArchive';
import { Level2MaterialSearch } from './components/Level2MaterialSearch';
import { Level3CipherLab } from './components/Level3CipherLab';
import { Level4MaterialWarehouse } from './components/Level4MaterialWarehouse';
import { Level5TeamStudio } from './components/Level5TeamStudio';
import { LeaderboardView } from './components/LeaderboardView';
import { StudentEntryModal } from './components/StudentEntryModal';
import { TeacherPortalModal } from './components/TeacherPortalModal';
import { ExtendedLearningModal } from './components/ExtendedLearningModal';
import { DrawStudio } from './components/DrawStudio';
import { ExhibitionCeremonyModal } from './components/ExhibitionCeremonyModal';
import { ShieldCheck, Heart, Sparkles, Award, Lock } from 'lucide-react';

export default function App() {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [progress, setProgress] = useState<GameProgress>(
    storageService.createInitialProgress('temp', '1A', 'explorer')
  );

  const [activeLevel, setActiveLevel] = useState<number>(1);
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isEntryModalOpen, setIsEntryModalOpen] = useState<boolean>(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState<boolean>(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [isCeremonyModalOpen, setIsCeremonyModalOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [isDemo, setIsDemo] = useState<boolean>(storageService.isDemoMode());

  // Initialize student & progress on mount and listen to DB connectivity
  useEffect(() => {
    const unsubscribeDb = subscribeDbStatus((info) => {
      setIsDemo(info.isDemo);
    });

    // Check for ?autostart=1
    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart') === '1';

    let storedStudent = storageService.getStudent();

    if (!storedStudent && autostart) {
      storedStudent = {
        anonymousId: 'student_autostart_1a',
        classCode: '1A',
        nickname: '彩虹小画师',
        avatarId: 'lion',
        mode: 'explorer',
        createdAt: new Date().toISOString(),
      };
      storageService.saveStudent(storedStudent);
    }

    if (storedStudent) {
      setStudent(storedStudent);
      const userProgress = storageService.getProgress(storedStudent.anonymousId, storedStudent.mode);
      setProgress(userProgress);
      setActiveLevel(userProgress.currentLevel || 1);
    } else {
      // First time visiting: open student selection modal
      setIsEntryModalOpen(true);
    }

    return () => {
      unsubscribeDb();
    };
  }, []);

  const handleSaveStudent = async (newProfile: StudentProfile) => {
    await storageService.saveStudent(newProfile);
    setStudent(newProfile);
    const userProgress = storageService.getProgress(newProfile.anonymousId, newProfile.mode);
    userProgress.mode = newProfile.mode;
    userProgress.classCode = newProfile.classCode;
    await storageService.saveProgress(userProgress);
    setProgress(userProgress);
    setActiveLevel(userProgress.currentLevel || 1);
    audioService.playCelebrationChime();
  };

  const handleUpdateProgress = (updatedProgress: GameProgress) => {
    setProgress(updatedProgress);
    storageService.saveProgress(updatedProgress);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioService.setVolume(next ? 1.0 : 0.0);
  };

  const handleStartQuest = () => {
    setActiveLevel(progress.currentLevel || 1);
    setCurrentTab('quest');
  };

  const handleNavigateToLevel = (level: number) => {
    setActiveLevel(level);
    const updated = {
      ...progress,
      currentLevel: Math.max(progress.currentLevel, level),
    };
    handleUpdateProgress(updated);
    setCurrentTab('quest');
  };

  return (
    <div className="min-h-screen flex flex-col paper-texture">
      {/* Navigation Top Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'quest') {
            setActiveLevel(progress.currentLevel || 1);
          }
          setCurrentTab(tab);
        }}
        student={student}
        onOpenEntryModal={() => setIsEntryModalOpen(true)}
        onOpenTeacherModal={() => setIsTeacherModalOpen(true)}
        isDemoMode={isDemo}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        isCompleted={Boolean(progress.completed)}
      />

      {/* Main Content Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Celebration Banner when completed all tasks */}
        {progress.completed && (
          <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-yellow-100 fill-current shrink-0" />
              <div>
                <h3 className="font-black text-base text-white">
                  恭喜完成全部任务！艺术展已正式开放！
                </h3>
                <p className="text-xs text-amber-100 font-bold">
                  大展灯光全部亮起，快来开启开幕仪式、领取荣誉奖状，并进入创艺园地自由创作吧！
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsCeremonyModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-white text-[#263D64] font-black text-xs shadow-md hover:bg-amber-50 transition-all cursor-pointer whitespace-nowrap active:scale-95"
              >
                领取我的奖状 →
              </button>
              <button
                onClick={() => setCurrentTab('draw')}
                className="px-4 py-2.5 rounded-2xl bg-[#263D64] text-white font-black text-xs shadow-md hover:bg-[#263D64]/90 transition-all cursor-pointer whitespace-nowrap active:scale-95"
              >
                进入创艺园地 →
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: 首页 (Home) */}
        {currentTab === 'home' && (
          <HeroHome
            student={student}
            progress={progress}
            onStartQuest={handleStartQuest}
            onNavigateToLevel={handleNavigateToLevel}
            onOpenRoadmap={() => setCurrentTab('roadmap')}
            onOpenBadges={() => setCurrentTab('warehouse')}
            onOpenDraw={() => setCurrentTab('draw')}
            onOpenStudio={() => {
              handleNavigateToLevel(5);
              setCurrentTab('quest');
            }}
          />
        )}

        {/* TAB: 创艺园地 (Student Free Creative Garden & Micro-lesson) */}
        {currentTab === 'draw' &&
          (progress.completed ? (
            <DrawStudio
              student={student}
              progress={progress}
              onUpdateProgress={handleUpdateProgress}
              onBackToRoadmap={() => setCurrentTab('roadmap')}
              onOpenCeremonyModal={() => setIsCeremonyModalOpen(true)}
            />
          ) : (
            <div className="max-w-2xl mx-auto my-12 p-8 rounded-3xl storybook-card bg-white text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 border-2 border-amber-300 mx-auto flex items-center justify-center text-amber-700 shadow-xs">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-[#263D64]">【创艺园地】尚未解锁</h2>
              <p className="text-sm font-medium text-[#263D64]/70 leading-relaxed max-w-lg mx-auto">
                《创艺园地》是为完成声音寻宝大冒险的小画家准备的自由拼贴展厅！<br />
                <strong>重要提示：</strong>创艺园地只能在完成所有关卡（第 1 关至第 5 关全部通关）后才能打开。
                通关后，你可以在此开启盛大开幕仪式并领取荣誉奖状！
              </p>
              <button
                onClick={() => {
                  setActiveLevel(progress.currentLevel || 1);
                  setCurrentTab('quest');
                }}
                className="px-6 py-3 rounded-2xl bg-[#F4C66A] text-[#263D64] font-black text-sm shadow-md hover:bg-[#F4C66A]/90 transition-all cursor-pointer active:scale-95 inline-flex items-center gap-2"
              >
                <span>前往关卡进行探险</span>
              </button>
            </div>
          ))}

        {/* TAB 2: 我的任务 (Active Quest Level) */}
        {currentTab === 'quest' && (
          <div>
            {activeLevel === 1 && (
              <Level1SoundArchive
                student={student}
                progress={progress}
                onUpdateProgress={handleUpdateProgress}
                onNextLevel={() => handleNavigateToLevel(2)}
                onBackToRoadmap={() => setCurrentTab('roadmap')}
              />
            )}
            {activeLevel === 2 && (
              <Level2MaterialSearch
                student={student}
                progress={progress}
                onUpdateProgress={handleUpdateProgress}
                onNextLevel={() => handleNavigateToLevel(3)}
                onBackToLevel1={() => handleNavigateToLevel(1)}
                onBackToRoadmap={() => setCurrentTab('roadmap')}
              />
            )}
            {activeLevel === 3 && (
              <Level3CipherLab
                student={student}
                progress={progress}
                onUpdateProgress={handleUpdateProgress}
                onNextLevel={() => handleNavigateToLevel(4)}
                onBackToLevel2={() => handleNavigateToLevel(2)}
                onBackToRoadmap={() => setCurrentTab('roadmap')}
              />
            )}
            {activeLevel === 4 && (
              <Level4MaterialWarehouse
                student={student}
                progress={progress}
                onUpdateProgress={handleUpdateProgress}
                onNavigateToLevel={handleNavigateToLevel}
                onOpenStudio={() => {
                  handleNavigateToLevel(5);
                  setCurrentTab('quest');
                }}
                onBackToRoadmap={() => setCurrentTab('roadmap')}
              />
            )}
            {activeLevel === 5 && (
              <Level5TeamStudio
                student={student}
                progress={progress}
                onUpdateProgress={handleUpdateProgress}
                onOpenTeacherModal={() => setIsTeacherModalOpen(true)}
                onBackToRoadmap={() => setCurrentTab('roadmap')}
                onGoToLeaderboard={() => setCurrentTab('leaderboard')}
                onGoToDraw={() => setCurrentTab('draw')}
              />
            )}
          </div>
        )}

        {/* TAB 3: 学习路线 (Roadmap) */}
        {currentTab === 'roadmap' && (
          <RoadmapView
            progress={progress}
            student={student}
            onNavigateToLevel={handleNavigateToLevel}
            onOpenStudio={() => {
              handleNavigateToLevel(5);
              setCurrentTab('quest');
            }}
          />
        )}

        {/* TAB 4: 我的材料 (Material Badges Warehouse) */}
        {currentTab === 'warehouse' && (
          <Level4MaterialWarehouse
            student={student}
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
            onNavigateToLevel={handleNavigateToLevel}
            onOpenStudio={() => {
              handleNavigateToLevel(5);
              setCurrentTab('quest');
            }}
            onBackToRoadmap={() => setCurrentTab('roadmap')}
          />
        )}

        {/* TAB 5: 排行榜 (Leaderboards) */}
        {currentTab === 'leaderboard' && <LeaderboardView student={student} />}

        {/* TAB 6: 团队工作室 (Level 5 Collaborative Collage) */}
        {currentTab === 'studio' && (
          <Level5TeamStudio
            student={student}
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
            onOpenTeacherModal={() => setIsTeacherModalOpen(true)}
            onGoToLeaderboard={() => setCurrentTab('leaderboard')}
            onGoToDraw={() => setCurrentTab('draw')}
          />
        )}
      </main>

      {/* Exhibition Opening Ceremony & Certificate Modal */}
      <ExhibitionCeremonyModal
        isOpen={isCeremonyModalOpen}
        onClose={() => setIsCeremonyModalOpen(false)}
        student={student}
        progress={progress}
        onOpenDraw={() => setCurrentTab('draw')}
      />

      {/* Child-Friendly Footer */}
      <footer className="border-t border-[#263D64]/10 bg-white/70 py-6 mt-12 text-center text-xs text-[#263D64]/70 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold">
          <span>马来西亚华小华文课程标准 (KSSR Semakan)</span>
          <span>·</span>
          <span>SP 1.2.1 聆听通知与要求</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-[#8CBF9E]" />
            <span>学生隐私零资料留存保护</span>
          </span>
        </div>
        <p className="text-[11px] text-[#263D64]/50">
          《失落的艺术展——声音密码大冒险》互动学习系统 · CASPER儿童友好人机交互设计
        </p>
      </footer>

      {/* Modals */}
      <StudentEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        currentStudent={student}
        onSave={handleSaveStudent}
      />

      <TeacherPortalModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        onRefreshData={() => {
          if (student) {
            setProgress(storageService.getProgress(student.anonymousId));
          }
        }}
      />

      <ExtendedLearningModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onReturnToStudio={() => {
          setIsVideoModalOpen(false);
          setCurrentTab('studio');
        }}
      />
    </div>
  );
}
