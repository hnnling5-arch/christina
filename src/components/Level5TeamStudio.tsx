import React, { useState, useEffect, useRef } from 'react';
import { GameProgress, StudentProfile, TeamProject } from '../types';
import { storageService } from '../services/storage';
import { audioService } from '../services/audio';
import { AVATARS } from '../data/constants';
import { PRESET_CREATIVE_STICKERS } from '../utils/stickerGenerator';
import confetti from 'canvas-confetti';
import {
  Users,
  Sparkles,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Clock,
  ShieldAlert,
  ArrowRight,
  LogOut,
  Layers,
  Palette,
  Check,
  Eye,
  Shuffle,
  Volume2,
} from 'lucide-react';

interface Level5Props {
  student: StudentProfile | null;
  progress: GameProgress;
  onUpdateProgress: (updated: GameProgress) => void;
  onOpenTeacherModal: () => void;
  onBackToRoadmap?: () => void;
  onGoToLeaderboard?: () => void;
  onGoToDraw?: () => void;
  onOpenCeremonyModal?: () => void; // Kept for interface compatibility
}

const TIMEOUT_SECONDS = 5;

// The image uploaded by user featuring the 4 craft characters
export const CRAFT_PUZZLE_IMAGE = '/assets/aistudio/image_3486e58f.png';

export interface PuzzlePiece {
  id: number;
  row: number; // 0 or 1
  col: number; // 0, 1, or 2
  title: string;
  characterDesc: string;
  colorName: string;
  colorHex: string;
  isPlaced: boolean; // Placed into puzzle board
  isCut: boolean; // Trimmed with scissors
  cutStyle: 'normal' | 'jigsaw' | 'wavy' | 'zigzag';
  isGlued: boolean; // Sealed with glue
  placedBy: string;
  scatterRot: number; // degrees for scattered tray
  scatterOffset: number; // px offset for scattered feel
}

const INITIAL_PUZZLE_PIECES: PuzzlePiece[] = [
  {
    id: 1,
    row: 0,
    col: 0,
    title: '剪刀刀刃与小手',
    characterDesc: '可爱的银色圆头剪刀刀刃、眨眼笑容与招手小白手',
    colorName: '银红剪刀',
    colorHex: '#F87171',
    isPlaced: false,
    isCut: false,
    cutStyle: 'normal',
    isGlued: false,
    placedBy: '',
    scatterRot: -9,
    scatterOffset: -4,
  },
  {
    id: 2,
    row: 0,
    col: 1,
    title: '彩色纸小萌友',
    characterDesc: '红、黄、绿、蓝层层叠起的彩色手工纸与开心笑脸',
    colorName: '缤纷彩纸',
    colorHex: '#EF4444',
    isPlaced: false,
    isCut: false,
    cutStyle: 'normal',
    isGlued: false,
    placedBy: '',
    scatterRot: 7,
    scatterOffset: 5,
  },
  {
    id: 3,
    row: 0,
    col: 2,
    title: '胶水瓶盖与星光',
    characterDesc: '橙色螺旋旋钮瓶盖、金色小光芒与背景粉星',
    colorName: '阳光暖橙',
    colorHex: '#FB923C',
    isPlaced: false,
    isCut: false,
    cutStyle: 'normal',
    isGlued: false,
    placedBy: '',
    scatterRot: -12,
    scatterOffset: -2,
  },
  {
    id: 4,
    row: 1,
    col: 0,
    title: '剪刀手柄与小脚',
    characterDesc: '红色圆圆双孔剪刀手柄，踩着可爱咖啡色小脚丫',
    colorName: '手柄朱红',
    colorHex: '#DC2626',
    isPlaced: false,
    isCut: false,
    cutStyle: 'normal',
    isGlued: false,
    placedBy: '',
    scatterRot: 11,
    scatterOffset: 6,
  },
  {
    id: 5,
    row: 1,
    col: 1,
    title: '胶水瓶身与底座',
    characterDesc: '白底蓝标胶水瓶、眨眼萌脸与稳固站立的小脚',
    colorName: '瓶身明蓝',
    colorHex: '#3B82F6',
    isPlaced: false,
    isCut: false,
    cutStyle: 'normal',
    isGlued: false,
    placedBy: '',
    scatterRot: -6,
    scatterOffset: -5,
  },
  {
    id: 6,
    row: 1,
    col: 2,
    title: '快乐星星贴纸萌友',
    characterDesc: '金黄灿烂五角星贴纸萌友，开怀大笑比出胜利耶手势',
    colorName: '星芒金黄',
    colorHex: '#FBBF24',
    isPlaced: false,
    isCut: false,
    cutStyle: 'normal',
    isGlued: false,
    placedBy: '',
    scatterRot: 8,
    scatterOffset: 3,
  },
];

interface PlacedSticker {
  id: string;
  dataUrl: string;
  label: string;
  x: number; // percentage
  y: number; // percentage
  addedBy: string;
}

export const Level5TeamStudio: React.FC<Level5Props> = ({
  student,
  progress,
  onUpdateProgress,
  onOpenTeacherModal,
  onBackToRoadmap,
  onGoToLeaderboard,
  onGoToDraw,
}) => {
  // Matching state: 'idle' | 'waiting' | 'matched'
  const [matchStatus, setMatchStatus] = useState<'idle' | 'waiting' | 'matched'>('idle');
  const [waitingCount, setWaitingCount] = useState<number>(0);
  const [waitingPeers, setWaitingPeers] = useState<StudentProfile[]>([]);
  const [matchedTeam, setMatchedTeam] = useState<StudentProfile[]>([]);
  const [currentTeamProject, setCurrentTeamProject] = useState<TeamProject | null>(null);
  const [isJoining, setIsJoining] = useState<boolean>(false);

  // Active Tool selection: 'paper' | 'scissors' | 'glue' | 'sticker'
  const [selectedTool, setSelectedTool] = useState<'paper' | 'scissors' | 'glue' | 'sticker'>('paper');

  // Puzzle activity state
  const [puzzlePieces, setPuzzlePieces] = useState<PuzzlePiece[]>(INITIAL_PUZZLE_PIECES);
  const [scatteredOrder, setScatteredOrder] = useState<number[]>([3, 1, 6, 2, 5, 4]); // Initial shuffled order
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [projectTitle, setProjectTitle] = useState<string>('剪刀·彩纸·胶水·贴纸 好朋友大拼图');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showOriginalRef, setShowOriginalRef] = useState<boolean>(false);
  const [actionLog, setActionLog] = useState<string[]>([
    '欢迎来到三人拼图工坊！四大手工好伙伴的画卷已打散，快把散落的碎片拼入底板！',
  ]);

  // Selected puzzle piece to work on
  const [selectedPieceId, setSelectedPieceId] = useState<number>(1);

  // Drag and drop state
  const [draggedPieceId, setDraggedPieceId] = useState<number | null>(null);
  const [dragOverSlotId, setDragOverSlotId] = useState<number | null>(null);
  const touchPieceRef = useRef<number | null>(null);

  // Timeout handling for matching
  const [countdown, setCountdown] = useState<number>(TIMEOUT_SECONDS);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout timer
  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Auto fill with AI teammates if no human peers online
  const handleAutoFillWithAI = async () => {
    if (!student) return;
    clearTimer();
    const team = await storageService.createTeamWithAIPeers(student, waitingPeers);
    setCurrentTeamProject(team);
    setMatchedTeam(team.members);
    setMatchStatus('matched');
    audioService.playCelebrationChime();
    logAction(`AI 伙伴 [小星] 与 [小乐] 已加入小队，拼图工坊正式开工！`);
  };

  // Start timeout countdown
  const startTimer = () => {
    clearTimer();
    setCountdown(TIMEOUT_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearTimer();
          handleAutoFillWithAI();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const logAction = (msg: string) => {
    setActionLog((prev) => [msg, ...prev.slice(0, 5)]);
  };

  // Initial State Check & Real-time Subscription
  useEffect(() => {
    if (!student) return;

    const existingTeam = storageService.findStudentTeam(student.anonymousId, student.classCode);
    if (existingTeam) {
      setCurrentTeamProject(existingTeam);
      setMatchedTeam(existingTeam.members);
      setProjectTitle(existingTeam.title);
      setIsSubmitted(existingTeam.status === 'submitted');
      setMatchStatus('matched');
      return;
    }

    const queue = storageService.getMatchmakingQueue(student.classCode);
    const inQueue = queue.some((s) => s.anonymousId === student.anonymousId);
    if (inQueue) {
      setMatchStatus('waiting');
      setWaitingCount(queue.length);
      setWaitingPeers(queue);
      startTimer();
    }

    const unsubscribe = storageService.subscribeMatchmaking(
      student.classCode,
      student.anonymousId,
      (updatedQueue, team) => {
        if (team) {
          setCurrentTeamProject(team);
          setMatchedTeam(team.members);
          setProjectTitle(team.title);
          setIsSubmitted(team.status === 'submitted');
          setMatchStatus('matched');
          clearTimer();
          audioService.playCelebrationChime();
        } else {
          const inQ = updatedQueue.some((s) => s.anonymousId === student.anonymousId);
          setWaitingCount(updatedQueue.length);
          setWaitingPeers(updatedQueue);
          if (!inQ && matchStatus === 'waiting') {
            setMatchStatus('idle');
            clearTimer();
          }
        }
      }
    );

    return () => {
      unsubscribe();
      clearTimer();
    };
  }, [student]);

  // Join matchmaking
  const handleJoinQueue = async () => {
    if (!student || isJoining) return;
    setIsJoining(true);

    try {
      const result = await storageService.joinMatchmakingQueue(student);

      if (result.status === 'already_matched' && result.matchedTeam) {
        setCurrentTeamProject(result.matchedTeam);
        setMatchedTeam(result.matchedTeam.members);
        setProjectTitle(result.matchedTeam.title);
        setIsSubmitted(result.matchedTeam.status === 'submitted');
        setMatchStatus('matched');
        return;
      }

      if (result.status === 'matched' && result.matchedTeam) {
        setCurrentTeamProject(result.matchedTeam);
        setMatchedTeam(result.matchedTeam.members);
        setProjectTitle(result.matchedTeam.title);
        setMatchStatus('matched');
        clearTimer();
        audioService.playCelebrationChime();
      } else {
        setMatchStatus('waiting');
        setWaitingCount(result.queueCount);
        setWaitingPeers(storageService.getMatchmakingQueue(student.classCode));
        startTimer();
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveQueue = async () => {
    if (!student) return;
    clearTimer();
    await storageService.leaveMatchmakingQueue(student.anonymousId, student.classCode);
    setMatchStatus('idle');
  };

  // =========================================================================
  // SCATTER & SHUFFLE MECHANISM ("打散")
  // =========================================================================
  const handleShuffleScatter = () => {
    audioService.playStampSound();
    // Randomize the order of unplaced pieces and update slight rotation tilts
    const unplacedIds = puzzlePieces.filter((p) => !p.isPlaced).map((p) => p.id);
    const shuffled = [...unplacedIds].sort(() => Math.random() - 0.5);
    setScatteredOrder(shuffled);

    setPuzzlePieces((prev) =>
      prev.map((p) => ({
        ...p,
        scatterRot: Math.floor(Math.random() * 26) - 13, // -13deg to +12deg
        scatterOffset: Math.floor(Math.random() * 14) - 7,
      }))
    );
    logAction('🎲 碎片已打散！请从小桌上拿起碎片放入对应的底板槽中！');
  };

  // =========================================================================
  // DRAG AND DROP HANDLERS (Mouse & Touch)
  // =========================================================================
  const handleDragStart = (e: React.DragEvent, pieceId: number) => {
    e.dataTransfer.setData('text/plain', String(pieceId));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedPieceId(pieceId);
  };

  const handleDragEnd = () => {
    setDraggedPieceId(null);
    setDragOverSlotId(null);
  };

  const handleSlotDragOver = (e: React.DragEvent, slotId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlotId !== slotId) {
      setDragOverSlotId(slotId);
    }
  };

  const handleSlotDragLeave = () => {
    setDragOverSlotId(null);
  };

  const handleSlotDrop = (e: React.DragEvent, targetSlotId: number) => {
    e.preventDefault();
    setDragOverSlotId(null);
    const pieceIdStr = e.dataTransfer.getData('text/plain') || (draggedPieceId !== null ? String(draggedPieceId) : '');
    const pieceId = parseInt(pieceIdStr, 10);
    setDraggedPieceId(null);

    if (isNaN(pieceId)) return;

    if (pieceId === targetSlotId) {
      handlePlacePiece(pieceId);
    } else {
      audioService.playStampSound();
      logAction(`🧩 这是碎片 #${pieceId}，试着拖到其它格子里看看！`);
    }
  };

  // Touch Drag-and-Drop fallback for iPads / touch screens
  const handleTouchStart = (pieceId: number) => {
    touchPieceRef.current = pieceId;
    setDraggedPieceId(pieceId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchPieceRef.current) return;
    const touch = e.touches[0];
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    const slotEl = targetElement?.closest('[data-slot-id]');
    if (slotEl) {
      const slotId = parseInt(slotEl.getAttribute('data-slot-id') || '', 10);
      if (!isNaN(slotId)) {
        setDragOverSlotId(slotId);
        return;
      }
    }
    setDragOverSlotId(null);
  };

  const handleTouchEnd = () => {
    const pieceId = touchPieceRef.current;
    touchPieceRef.current = null;
    const targetSlot = dragOverSlotId;
    setDraggedPieceId(null);
    setDragOverSlotId(null);

    if (pieceId && targetSlot) {
      if (pieceId === targetSlot) {
        handlePlacePiece(pieceId);
      } else {
        audioService.playStampSound();
        logAction(`🧩 碎片 #${pieceId} 与当前格子不吻合，试着拖到对应格子！`);
      }
    }
  };

  // =========================================================================
  // 4 CRAFT TOOLS ON THE PUZZLE (Paper, Scissors, Glue, Stickers)
  // =========================================================================

  // Tool 1: 📄 拿起散落的拼图碎片并放入底板 (Place scattered puzzle piece)
  const handlePlacePiece = (pieceId: number) => {
    audioService.playStampSound();
    const studentName = student?.nickname || '声音小画师';

    setPuzzlePieces((prev) =>
      prev.map((p) => {
        if (p.id === pieceId) {
          return {
            ...p,
            isPlaced: true,
            placedBy: studentName,
          };
        }
        return p;
      })
    );
    setSelectedPieceId(pieceId);
    const targetPiece = puzzlePieces.find((p) => p.id === pieceId);
    logAction(`🧩 [${studentName} (你)] 拿起了散落的【${targetPiece?.title}】，精准拼入底板！`);
  };

  // Tool 2: ✂️ 剪刀 (Cut & shape puzzle piece edges)
  const handleCutPiece = (pieceId: number, cutStyle: PuzzlePiece['cutStyle']) => {
    audioService.playStampSound();
    const studentName = student?.nickname || '声音小画师';

    setPuzzlePieces((prev) =>
      prev.map((p) => {
        if (p.id === pieceId) {
          return {
            ...p,
            isCut: true,
            cutStyle,
          };
        }
        return p;
      })
    );
    const cutName =
      cutStyle === 'jigsaw'
        ? '互锁拼图齿牙'
        : cutStyle === 'wavy'
        ? '波浪圆弧花边'
        : cutStyle === 'zigzag'
        ? '锯齿咬合边'
        : '平整对齐边';
    logAction(`✂️ [${studentName} (你)] 拿起安全剪刀，将【${puzzlePieces.find((p) => p.id === pieceId)?.title}】剪出【${cutName}】！`);
  };

  // Tool 3: 🧴 胶水 (Glue & paste puzzle piece firmly)
  const handleGluePiece = (pieceId: number) => {
    audioService.playCelebrationChime();
    const studentName = student?.nickname || '声音小画师';

    setPuzzlePieces((prev) =>
      prev.map((p) => {
        if (p.id === pieceId) {
          return {
            ...p,
            isGlued: true,
          };
        }
        return p;
      })
    );
    logAction(`🧴 [${studentName} (你)] 涂抹手工胶水，将【${puzzlePieces.find((p) => p.id === pieceId)?.title}】牢牢粘合在底板上！`);
  };

  // Tool 4: ⭐ 贴纸 (Add cute die-cut sticker with contour white outline)
  const handleAddStickerToPuzzle = (st: (typeof PRESET_CREATIVE_STICKERS)[0]) => {
    audioService.playStampSound();
    const studentName = student?.nickname || '声音小画师';

    const newSticker: PlacedSticker = {
      id: `stk_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      dataUrl: st.dataUrl,
      label: st.label,
      x: 18 + Math.floor(Math.random() * 64),
      y: 18 + Math.floor(Math.random() * 64),
      addedBy: studentName,
    };

    setPlacedStickers((prev) => [...prev, newSticker]);
    logAction(`⭐ [${studentName} (你)] 在拼图上贴上了带白边的【${st.label}】贴纸进行点缀！`);
  };

  // Remove a sticker
  const handleRemoveSticker = (stickerId: string) => {
    setPlacedStickers((prev) => prev.filter((s) => s.id !== stickerId));
  };

  // Cooperative helper: Teammate actions
  const handleTeammateAssist = () => {
    audioService.playCelebrationChime();
    const peer1 = matchedTeam[1]?.nickname || '小星伙伴';
    const peer2 = matchedTeam[2]?.nickname || '小乐伙伴';

    // Find first unplaced piece from scattered table
    const unplaced = puzzlePieces.find((p) => !p.isPlaced);
    const unglued = puzzlePieces.find((p) => p.isPlaced && !p.isGlued);

    if (unplaced) {
      setPuzzlePieces((prev) =>
        prev.map((p) =>
          p.id === unplaced.id
            ? { ...p, isPlaced: true, isCut: true, cutStyle: 'jigsaw', placedBy: peer1 }
            : p
        )
      );
      setSelectedPieceId(unplaced.id);
      logAction(`🤝 队友 [${peer1}] 从散落碎片中找到了【${unplaced.title}】，修剪齿牙后拼入底板！`);
      return;
    }

    if (unglued) {
      setPuzzlePieces((prev) =>
        prev.map((p) => (p.id === unglued.id ? { ...p, isGlued: true } : p))
      );
      setSelectedPieceId(unglued.id);
      logAction(`🤝 队友 [${peer2}] 拿起胶水瓶，帮小队牢牢粘固了【${unglued.title}】！`);
      return;
    }

    // Add a random preset sticker from teammate
    const randomSt = PRESET_CREATIVE_STICKERS[Math.floor(Math.random() * PRESET_CREATIVE_STICKERS.length)];
    const newSticker: PlacedSticker = {
      id: `stk_peer_${Date.now()}`,
      dataUrl: randomSt.dataUrl,
      label: randomSt.label,
      x: 25 + Math.floor(Math.random() * 50),
      y: 25 + Math.floor(Math.random() * 50),
      addedBy: peer1,
    };
    setPlacedStickers((prev) => [...prev, newSticker]);
    logAction(`🤝 队友 [${peer1}] 挑选了白边贴纸【${randomSt.label}】，贴在画面中心点亮作品！`);
  };

  // Submit Collaborative Puzzle
  const handleSubmitPuzzle = () => {
    if (!student) return;

    const teamId = currentTeamProject?.teamId || `team_${student.classCode}_${Date.now()}`;
    const project: TeamProject = {
      teamId,
      classCode: student.classCode,
      title: projectTitle.trim() || '剪刀·彩纸·胶水·贴纸 好朋友大拼图',
      members: matchedTeam,
      elements: [],
      status: 'submitted',
      createdAt: currentTeamProject?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storageService.saveTeamProject(project);
    setIsSubmitted(true);
    audioService.playCelebrationChime();

    try {
      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.5 },
      });
    } catch (e) {
      // ignore
    }

    const updated: GameProgress = {
      ...progress,
      currentLevel: 5,
      completed: true,
      score: progress.score + 100,
      completedTasks: Array.from(new Set([...progress.completedTasks, 'level5_team_puzzle'])),
      updatedAt: new Date().toISOString(),
    };
    onUpdateProgress(updated);
  };

  const placedCount = puzzlePieces.filter((p) => p.isPlaced).length;
  const gluedCount = puzzlePieces.filter((p) => p.isGlued).length;
  const unplacedPieces = puzzlePieces.filter((p) => !p.isPlaced);

  const currentSelectedPiece = puzzlePieces.find((p) => p.id === selectedPieceId) || puzzlePieces[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBackToRoadmap && (
            <button
              onClick={onBackToRoadmap}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-[#263D64]/15 hover:bg-amber-50 text-xs font-bold text-[#263D64] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>← 返回路线图</span>
            </button>
          )}
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold">
          <Palette className="w-4 h-4 text-purple-700" />
          <span>终极关卡五 · 三人手工拼图大挑战</span>
        </div>
        <button
          onClick={onOpenTeacherModal}
          className="text-xs font-bold text-[#263D64] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-[#F28C75]" />
          <span>教师手动分组</span>
        </button>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-[#263D64]">
          四大材料萌友 · 三人艺术拼图工坊
        </h1>
        <p className="text-xs sm:text-sm text-[#263D64]/70 max-w-xl mx-auto">
          通知要求的四大手工材料：<strong>剪刀、贴纸、胶水、彩色纸</strong>欢聚一堂！全班三人合作，把散落的画卷碎片拼接完整！
        </p>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 flex items-center gap-3 text-amber-900 shadow-2xs">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
        <div className="text-xs sm:text-sm font-bold leading-relaxed">
          <strong>安全操作小提醒：</strong>
          在真实课堂使用剪刀时，务必使用<strong>学生安全圆头剪刀</strong>并在<strong>老师或家长监督下</strong>操作，轻拿轻放、严禁嬉戏奔跑！
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MATCHMAKING LOBBY                                                      */}
      {/* ========================================================================= */}
      {matchStatus !== 'matched' && (
        <div className="storybook-card rounded-3xl p-6 sm:p-10 bg-white text-center space-y-6 shadow-md border-2 border-[#263D64]/10">
          <div className="w-20 h-20 rounded-3xl bg-[#FFF5E5] border-2 border-[#F4C66A] mx-auto flex items-center justify-center shadow-xs">
            <Users className="w-10 h-10 text-[#F4C66A]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#263D64]">
              {student ? `【班级 ${student.classCode}】三人拼图小队就绪室` : '三人拼图小队就绪室'}
            </h2>
            <p className="text-xs sm:text-sm text-[#263D64]/70 max-w-lg mx-auto">
              系统优先为您连接同班正在等待的同学；若当前无同学在线，5秒后自动安排两位AI伙伴加入小队，随时开拼！
            </p>
          </div>

          {matchStatus === 'waiting' ? (
            <div className="space-y-5 max-w-md mx-auto bg-[#FFF5E5] p-6 rounded-3xl border-2 border-[#F4C66A]/40 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#263D64] flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#F4C66A]" />
                  <span>匹配检索中 · 满 3 人即刻成组</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#263D64] text-white text-xs font-black">
                  {waitingCount} / 3 人
                </span>
              </div>

              <div className="flex items-center justify-center gap-3 py-2">
                {[0, 1, 2].map((slotIdx) => {
                  const peer = waitingPeers[slotIdx];
                  if (peer) {
                    const av = AVATARS.find((a) => a.id === peer.avatarId) || AVATARS[0];
                    const isMe = peer.anonymousId === student?.anonymousId;
                    return (
                      <div
                        key={peer.anonymousId}
                        className={`w-20 h-24 rounded-2xl border-2 p-2 flex flex-col items-center justify-center text-center transition-all ${
                          isMe
                            ? 'bg-amber-100 border-[#F4C66A] shadow-md ring-2 ring-[#F4C66A]'
                            : 'bg-white border-[#263D64]/20'
                        }`}
                      >
                        <span className="text-2xl mb-1">{av.emoji}</span>
                        <span className="text-[10px] font-black text-[#263D64] truncate max-w-full">
                          {peer.nickname}
                        </span>
                        <span className="text-[9px] text-[#263D64]/60 font-bold">
                          {isMe ? '你已就位' : '已就位'}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={`empty_${slotIdx}`}
                      className="w-20 h-24 rounded-2xl border-2 border-dashed border-[#263D64]/25 bg-white/60 flex flex-col items-center justify-center text-center p-2 animate-pulse"
                    >
                      <Clock className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[10px] font-bold text-[#263D64]/50">等待队友</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-center gap-2 text-xs text-[#263D64]/80 font-bold">
                  <Clock className="w-3.5 h-3.5 text-[#F28C75]" />
                  <span>
                    {countdown > 0
                      ? `检索同班同学中：${countdown} 秒（无人将直接加入两位AI队友）`
                      : '正在安排两位AI伙伴加入小队...'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAutoFillWithAI}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>无需等待，立即加入两位AI队友组队</span>
                </button>
              </div>

              <div>
                <button
                  onClick={handleLeaveQueue}
                  className="px-5 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#263D64] border border-[#263D64]/20 text-xs font-black flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500" />
                  <span>退出等待队列</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-md mx-auto">
              <button
                onClick={handleJoinQueue}
                disabled={isJoining}
                className="w-full py-4 px-8 rounded-2xl bg-[#F4C66A] hover:bg-[#F4C66A]/90 text-[#263D64] font-black text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Users className="w-5 h-5 text-[#263D64]" />
                <span>{isJoining ? '正在进入队列...' : '寻找队友 (进入三人拼图队列)'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MATCHED TEAM PUZZLE STUDIO WORKSPACE                                    */}
      {/* ========================================================================= */}
      {matchStatus === 'matched' && (
        <div className="space-y-6 animate-in zoom-in-95 duration-300">
          {/* Team Members Header */}
          <div className="storybook-card rounded-3xl p-5 bg-white border-2 border-[#263D64]/10 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-[#8CBF9E] flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>三人手工小队已就位！运用剪刀、贴纸、胶水、彩色纸完成拼图</span>
                </div>
                <h2 className="text-lg font-black text-[#263D64] mt-0.5">
                  班级 {student?.classCode} · 四大材料艺术拼图组
                </h2>
              </div>

              {/* 3 Members Avatars */}
              <div className="flex items-center gap-2">
                {matchedTeam.map((mem) => {
                  const av = AVATARS.find((a) => a.id === mem.avatarId) || AVATARS[0];
                  const isMe = mem.anonymousId === student?.anonymousId;
                  return (
                    <div
                      key={mem.anonymousId}
                      className={`px-3 py-1.5 rounded-2xl border-2 flex items-center gap-2 text-xs font-bold ${
                        isMe
                          ? 'bg-amber-100 border-[#F4C66A] text-[#263D64] ring-2 ring-[#F4C66A]'
                          : 'bg-white border-[#263D64]/15 text-[#263D64]'
                      }`}
                    >
                      <span className="text-lg">{av.emoji}</span>
                      <div>
                        <div>
                          {mem.nickname} {isMe && '(你)'}
                        </div>
                        <div className="text-[10px] text-[#263D64]/60 font-medium">寻宝队员</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Progress & Assist Button */}
            <div className="mt-4 pt-3 border-t border-[#263D64]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2 font-bold text-[#263D64]">
                <span>拼图制作进度：</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black">
                  已拼接 {placedCount} / 6 块
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-black">
                  已涂胶固定 {gluedCount} / 6 块
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-black">
                  贴纸装饰 {placedStickers.length} 枚
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOriginalRef(!showOriginalRef)}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-700" />
                  <span>{showOriginalRef ? '隐藏原画' : '查看原画参考图'}</span>
                </button>

                {!isSubmitted && (
                  <button
                    type="button"
                    onClick={handleTeammateAssist}
                    className="px-3 py-1.5 rounded-xl bg-[#263D64] hover:bg-[#263D64]/90 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Users className="w-3.5 h-3.5 text-amber-300" />
                    <span>邀请队友协助拼贴</span>
                  </button>
                )}
              </div>
            </div>

            {/* Reference Image Modal / Dropdown */}
            {showOriginalRef && (
              <div className="mt-4 p-4 bg-amber-50 rounded-2xl border-2 border-amber-200 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-black text-[#263D64] flex items-center gap-1.5">
                    <span>🖼️ 原画参考图：剪刀、彩色纸、胶水与贴纸四大好朋友</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowOriginalRef(false)}
                    className="text-xs text-amber-900/70 hover:text-amber-900 font-bold cursor-pointer"
                  >
                    ✕ 关闭
                  </button>
                </div>
                <div className="max-w-md mx-auto rounded-xl overflow-hidden shadow-md border-2 border-white">
                  <img
                    src={CRAFT_PUZZLE_IMAGE}
                    alt="四大手工好朋友原画"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Puzzle Title Input */}
          <div className="storybook-card rounded-2xl p-4 bg-white flex flex-col sm:flex-row items-center gap-3 border border-[#263D64]/10 shadow-xs">
            <label className="text-xs sm:text-sm font-black text-[#263D64] whitespace-nowrap">
              🖼️ 巨型艺术拼图作品名称：
            </label>
            <input
              type="text"
              value={projectTitle}
              maxLength={25}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="例如：剪刀·彩纸·胶水·贴纸 好朋友大拼图"
              className="flex-1 w-full px-4 py-2 bg-[#FFF5E5] rounded-xl border border-[#263D64]/20 text-sm font-black text-[#263D64] focus:outline-hidden"
            />
          </div>

          {/* 4 CORE MATERIALS TOOL SELECTOR BAR (Scissors, Stickers, Glue, Colored Paper) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                id: 'paper' as const,
                name: '散落拼图碎片',
                icon: '🧩',
                desc: '从散落桌拾起拼入底板',
                color: 'bg-emerald-50 border-emerald-400 text-emerald-950',
              },
              {
                id: 'scissors' as const,
                name: '安全圆头剪刀',
                icon: '✂️',
                desc: '修剪齿牙与互锁花边',
                color: 'bg-rose-50 border-rose-400 text-rose-950',
              },
              {
                id: 'glue' as const,
                name: '手工胶水',
                icon: '🧴',
                desc: '牢固粘合防止松散',
                color: 'bg-amber-50 border-amber-400 text-amber-950',
              },
              {
                id: 'sticker' as const,
                name: '精选白边贴纸',
                icon: '⭐',
                desc: '贴在画卷上萌趣点缀',
                color: 'bg-purple-50 border-purple-400 text-purple-950',
              },
            ].map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => setSelectedTool(tool.id)}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer shadow-xs ${
                  selectedTool === tool.id
                    ? `${tool.color} ring-3 ring-amber-400 scale-102 font-black shadow-md`
                    : 'bg-white border-[#263D64]/15 hover:border-amber-300'
                }`}
              >
                <div className="text-2xl mb-1">{tool.icon}</div>
                <div className="text-sm font-black text-[#263D64]">{tool.name}</div>
                <div className="text-[11px] text-[#263D64]/65 mt-0.5">{tool.desc}</div>
              </button>
            ))}
          </div>

          {/* ========================================================================= */}
          {/* SCATTERED PUZZLE PIECES TRAY ("打散的碎片工坊桌" - 支持拖拉方式)             */}
          {/* ========================================================================= */}
          <div className="storybook-card rounded-3xl p-5 bg-[#FFF9F0] border-2 border-amber-300 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎨</span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[#263D64]">
                    散落的拼图碎片工坊桌 (拖拉入槽)
                  </h3>
                  <p className="text-[11px] text-[#263D64]/70">
                    按住任意碎片<strong>拖拉</strong>放入下方粉红底板中；也可点击右侧按钮重新打散！
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleShuffleScatter}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-[#263D64] rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>🎲 重新打散碎片</span>
              </button>
            </div>

            {/* Scattered pieces cards: Pure tiles with drag-and-drop, ZERO bottom text/buttons */}
            {unplacedPieces.length === 0 ? (
              <div className="p-4 bg-emerald-100 rounded-2xl text-center text-xs font-black text-emerald-900 border border-emerald-300 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>太棒了！所有碎片都已全部拖入拼图底板中！快使用剪刀修边与涂胶水吧！</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
                {puzzlePieces
                  .filter((p) => !p.isPlaced)
                  .map((piece) => {
                    const isBeingDragged = draggedPieceId === piece.id;

                    return (
                      <div
                        key={piece.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, piece.id)}
                        onDragEnd={handleDragEnd}
                        onTouchStart={() => handleTouchStart(piece.id)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onClick={() => handlePlacePiece(piece.id)}
                        title={`按住拖拽碎片 #${piece.id} 放入底板对应格子`}
                        className={`group relative bg-white p-2 rounded-2xl border-2 border-amber-300/90 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-grab active:cursor-grabbing select-none flex flex-col items-center justify-center aspect-[4/3] ${
                          isBeingDragged ? 'opacity-40 scale-95 ring-3 ring-amber-400' : ''
                        }`}
                        style={{
                          transform: `rotate(${piece.scatterRot}deg) translateY(${piece.scatterOffset}px)`,
                        }}
                      >
                        {/* Slice visual preview from the uploaded image - clean, NO text at bottom */}
                        <div
                          className="w-full h-full rounded-xl border border-amber-200 overflow-hidden shadow-inner relative"
                          style={{
                            backgroundImage: `url(${CRAFT_PUZZLE_IMAGE})`,
                            backgroundSize: '300% 200%',
                            backgroundPosition: `${piece.col * 50}% ${piece.row * 100}%`,
                          }}
                        >
                          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                          <span className="absolute top-1.5 left-1.5 bg-amber-400 text-[#263D64] text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs pointer-events-none">
                            碎片 #{piece.id}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* THE COLLABORATIVE PUZZLE BOARD (3x2 JIGSAW SECTIONS)                      */}
          {/* ========================================================================= */}
          <div className="storybook-card rounded-3xl p-6 bg-white space-y-4 border-2 border-[#263D64]/10 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#263D64] flex items-center gap-2">
                <span>🧩</span>
                <span>展厅巨型拼图底板 (将上方碎片拖拉放入对应格子)</span>
              </h3>
              <div className="text-xs text-[#263D64]/60 font-medium">
                {isSubmitted ? '已正式参展' : '完整拼成四大材料好朋友'}
              </div>
            </div>

            {/* The 6-piece Puzzle Canvas Grid (3 columns x 2 rows = exact 3:2 aspect ratio of image!) */}
            <div className="relative w-full rounded-3xl border-4 border-pink-300 bg-gradient-to-br from-pink-200 via-rose-100 to-pink-300 p-3 sm:p-5 shadow-inner overflow-hidden">
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 w-full aspect-[3/2] max-h-[520px]">
                {puzzlePieces.map((piece) => {
                  const isSelected = selectedPieceId === piece.id;
                  const isDragOver = dragOverSlotId === piece.id;

                  return (
                    <div
                      key={piece.id}
                      data-slot-id={piece.id}
                      onDragOver={(e) => handleSlotDragOver(e, piece.id)}
                      onDragLeave={handleSlotDragLeave}
                      onDrop={(e) => handleSlotDrop(e, piece.id)}
                      onClick={() => {
                        if (!piece.isPlaced) {
                          handlePlacePiece(piece.id);
                        } else {
                          setSelectedPieceId(piece.id);
                        }
                      }}
                      className={`relative w-full h-full rounded-2xl transition-all cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
                        isDragOver
                          ? 'ring-4 ring-pink-500 scale-105 z-30 shadow-xl bg-pink-100'
                          : isSelected
                          ? 'ring-3 ring-pink-500 scale-[1.02] z-20 shadow-lg'
                          : 'z-10'
                      } ${
                        piece.isPlaced
                          ? piece.isGlued
                            ? 'border-2 border-emerald-400 shadow-md ring-2 ring-emerald-300/60'
                            : 'border-2 border-pink-400 shadow-sm'
                          : isDragOver
                          ? 'border-2 border-dashed border-pink-500 bg-pink-50/90'
                          : 'border-2 border-dashed border-pink-300/90 bg-white/70 hover:bg-white/90 shadow-2xs hover:shadow-sm'
                      }`}
                    >
                      {/* PIECE CONTENT */}
                      {piece.isPlaced ? (
                        <div
                          className="w-full h-full relative flex flex-col justify-between p-2"
                          style={{
                            backgroundImage: `url(${CRAFT_PUZZLE_IMAGE})`,
                            backgroundSize: '300% 200%',
                            backgroundPosition: `${piece.col * 50}% ${piece.row * 100}%`,
                          }}
                        >
                          {/* Jigsaw notch indicator / Cut decoration */}
                          {piece.isCut && (
                            <div className="absolute inset-0 pointer-events-none border-2 border-white/60 rounded-xl" />
                          )}

                          {/* Top Badges */}
                          <div className="flex items-center justify-between z-10">
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-black/60 text-white shadow-xs backdrop-blur-xs">
                              {piece.title}
                            </span>

                            {piece.isGlued ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black shadow-xs flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" />
                                <span>已粘牢</span>
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black shadow-xs animate-pulse">
                                待涂胶
                              </span>
                            )}
                          </div>

                          {/* Cut style indicator if cut */}
                          {piece.isCut && (
                            <div className="self-center z-10">
                              <span className="text-[9px] bg-white/80 text-[#263D64] font-black px-2 py-0.5 rounded-full shadow-xs">
                                ✂️ {piece.cutStyle === 'jigsaw' ? '互锁齿牙' : piece.cutStyle}
                              </span>
                            </div>
                          )}

                          {/* NO BOTTOM CONTENT - completely clean */}
                        </div>
                      ) : (
                        /* CLEAN PUZZLE GRID BOX: Pure clean slot without hint spoiling and NO text at bottom */
                        <div className="w-full h-full relative flex flex-col items-center justify-center p-3 text-center">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-transform ${
                            isDragOver ? 'scale-125 bg-pink-400 text-white shadow-md' : 'bg-pink-100/90 text-pink-500 border border-pink-300 shadow-2xs'
                          }`}>
                            🧩
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Placed Stickers Layer on the puzzle board (with contour white outline) */}
              {placedStickers.map((st) => (
                <div
                  key={st.id}
                  onClick={() => handleRemoveSticker(st.id)}
                  title={`${st.label} (由 ${st.addedBy} 粘贴，点击撕下)`}
                  className="absolute cursor-pointer hover:scale-125 transition-transform active:scale-95 group z-30"
                  style={{
                    left: `${st.x}%`,
                    top: `${st.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div
                    className="w-12 h-12 flex items-center justify-center select-none"
                    style={{
                      filter:
                        'drop-shadow(2.5px 0 0 #ffffff) drop-shadow(-2.5px 0 0 #ffffff) drop-shadow(0 2.5px 0 #ffffff) drop-shadow(0 -2.5px 0 #ffffff) drop-shadow(1.5px 1.5px 0 #ffffff) drop-shadow(-1.5px -1.5px 0 #ffffff) drop-shadow(1.5px -1.5px 0 #ffffff) drop-shadow(-1.5px 1.5px 0 #ffffff) drop-shadow(0 3px 6px rgba(0,0,0,0.25))',
                    }}
                  >
                    <img src={st.dataUrl} alt={st.label} className="w-full h-full object-contain pointer-events-none" />
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none transition-opacity">
                    {st.addedBy} ✕
                  </span>
                </div>
              ))}
            </div>

            {/* TOOLBOX ACTIONS FOR THE SELECTED TOOL */}
            <div className="p-4 bg-[#FFF5E5] rounded-2xl border-2 border-[#263D64]/10 space-y-3">
              {/* TOOL: 拼图块 / 彩色纸 */}
              {selectedTool === 'paper' && (
                <div className="space-y-2">
                  <div className="text-xs font-black text-[#263D64] flex items-center justify-between">
                    <span>🧩 拼图碎片管理：点击拾起散落碎片并拼入底板：</span>
                    <span className="text-[10px] text-amber-800">
                      进度：{placedCount} / 6 块
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {puzzlePieces.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        disabled={p.isPlaced}
                        onClick={() => handlePlacePiece(p.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs ${
                          p.isPlaced
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-white hover:bg-amber-100 border-2 border-amber-300 text-[#263D64] cursor-pointer active:scale-95'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.colorHex }} />
                        <span>{p.isPlaced ? `已拼入：${p.title}` : `+ 拼入：碎片 #${p.id}`}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TOOL: 剪刀 */}
              {selectedTool === 'scissors' && (
                <div className="space-y-2">
                  <div className="text-xs font-black text-[#263D64] flex items-center justify-between">
                    <span>
                      ✂️ 安全剪刀操作：为【{currentSelectedPiece.title}】修剪互锁边缘：
                    </span>
                    <span className="text-[10px] text-rose-800">在底板上点击选择不同碎片修剪</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'jigsaw' as const, label: '✂️ 剪出互锁拼图齿牙' },
                      { id: 'wavy' as const, label: '✂️ 剪出波浪圆弧花边' },
                      { id: 'zigzag' as const, label: '✂️ 剪出紧密锯齿咬合边' },
                      { id: 'normal' as const, label: '✂️ 剪整齐平滑边' },
                    ].map((cut) => (
                      <button
                        key={cut.id}
                        type="button"
                        disabled={!currentSelectedPiece.isPlaced}
                        onClick={() => handleCutPiece(selectedPieceId, cut.id)}
                        className="px-4 py-2 rounded-xl bg-white border-2 border-rose-300 hover:border-rose-500 hover:bg-rose-50 text-rose-950 text-xs font-black shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                      >
                        {cut.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TOOL: 胶水 */}
              {selectedTool === 'glue' && (
                <div className="space-y-2">
                  <div className="text-xs font-black text-[#263D64] flex items-center justify-between">
                    <span>
                      🧴 胶水粘合操作：牢牢固定【{currentSelectedPiece.title}】：
                    </span>
                    <span className="text-[10px] text-amber-800">涂好胶水后画面牢固不松散</span>
                  </div>
                  <button
                    type="button"
                    disabled={!currentSelectedPiece.isPlaced || currentSelectedPiece.isGlued}
                    onClick={() => handleGluePiece(selectedPieceId)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                  >
                    <span>
                      {currentSelectedPiece.isGlued
                        ? `✓ 此碎片已成功涂抹胶水并牢牢粘固！`
                        : `🧴 为【${currentSelectedPiece.title}】涂抹胶水并牢牢固定`}
                    </span>
                  </button>
                </div>
              )}

              {/* TOOL: 贴纸 */}
              {selectedTool === 'sticker' && (
                <div className="space-y-2">
                  <div className="text-xs font-black text-[#263D64] flex items-center justify-between">
                    <span>⭐ 艺术白边贴纸：精选萌趣白边贴纸点缀画面：</span>
                    <span className="text-[10px] text-purple-800">点击贴纸即可贴到底板上</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_CREATIVE_STICKERS.slice(0, 8).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleAddStickerToPuzzle(st)}
                        className="p-1.5 bg-white hover:bg-purple-50 border border-purple-200 hover:border-purple-400 rounded-xl flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-950 transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        <img
                          src={st.dataUrl}
                          alt={st.label}
                          className="w-6 h-6 object-contain"
                          style={{
                            filter: 'drop-shadow(1px 0 0 #fff) drop-shadow(-1px 0 0 #fff) drop-shadow(0 1px 0 #fff) drop-shadow(0 -1px 0 #fff)',
                          }}
                        />
                        <span>+ {st.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Team Collaborative Activity Log */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-[#263D64]/10 text-xs space-y-1">
              <div className="font-black text-[#263D64] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>小队合作动态记录：</span>
              </div>
              {actionLog.map((log, i) => (
                <div key={i} className="text-[#263D64]/75 truncate">
                  • {log}
                </div>
              ))}
            </div>

            {/* Submission & Next Step Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[#263D64]/70 font-medium">
                {isSubmitted ? (
                  <span className="text-emerald-700 font-black flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>恭喜全组成员！剪刀、彩纸、胶水、贴纸四大好朋友拼图已圆满完成并提交参展！</span>
                  </span>
                ) : (
                  <span>三位同学讨论确认拼图完整美观后，点击提交大展参展！</span>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {!isSubmitted ? (
                  <button
                    onClick={handleSubmitPuzzle}
                    disabled={placedCount === 0}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#F4C66A] hover:bg-[#F4C66A]/90 text-[#263D64] font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-[#263D64]" />
                    <span>提交三人合作拼图作品 (+100积分)</span>
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {onGoToDraw && (
                      <button
                        type="button"
                        onClick={onGoToDraw}
                        className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 animate-pulse"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>前往创艺园地（已解锁，开启仪式与奖状） →</span>
                      </button>
                    )}
                    {onGoToLeaderboard && (
                      <button
                        onClick={onGoToLeaderboard}
                        className="px-6 py-3.5 rounded-2xl bg-[#263D64] text-white font-black text-sm shadow-md hover:bg-[#263D64]/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>查看排行榜 →</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
