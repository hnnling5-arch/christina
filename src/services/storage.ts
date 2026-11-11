import {
  StudentProfile,
  GameProgress,
  LeaderboardEntry,
  TeamProject,
  TeacherEvaluation,
  AppSettings,
  LearningMode,
} from '../types';
import {
  verifyScoreIncrease,
  validateStudentCanJoinQueue,
  executeMatchmakingTransaction,
  removeStudentFromQueue,
  createManualTeacherTeam,
} from '../game/rules';
import { TEACHER_NOTICE_AUDIO_SRC } from '../data/constants';
import {
  db,
  auth,
  isFirebaseConfigured,
  handleFirestoreError,
  OperationType,
  getDbConnectionInfo,
} from './firebase';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  runTransaction,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';

const STORAGE_KEYS = {
  CURRENT_STUDENT: 'lost_art_student',
  PROGRESS: 'lost_art_progress',
  LEADERBOARD: 'lost_art_leaderboards',
  MATCHMAKING_QUEUE: 'lost_art_match_queue',
  TEAM_PROJECTS: 'lost_art_teams',
  EVALUATIONS: 'lost_art_evaluations',
  APP_SETTINGS: 'lost_art_settings',
};

// Initial default settings
const defaultSettings: AppSettings = {
  audioNoticeUrl: TEACHER_NOTICE_AUDIO_SRC,
  youtubeVideoUrl: 'https://youtu.be/zb6YamXD8eU?si=CjUG6zWT6rEPQORX',
  updatedAt: new Date().toISOString(),
};

// Seed sample classmate peers for realistic class leaderboard and matchmaking
const SEED_LEADERBOARDS: LeaderboardEntry[] = [
  { studentId: 'peer_1', nickname: '剪纸小能手', avatarId: 'rabbit', classCode: '1A', mode: 'explorer', score: 380, completed: true, badgesCount: 4, updatedAt: '2026-11-08T08:30:00Z' },
  { studentId: 'peer_2', nickname: '彩虹小画师', avatarId: 'lion', classCode: '1A', mode: 'explorer', score: 360, completed: true, badgesCount: 4, updatedAt: '2026-11-08T09:15:00Z' },
  { studentId: 'peer_3', nickname: '星星探宝员', avatarId: 'fox', classCode: '1A', mode: 'explorer', score: 340, completed: false, badgesCount: 3, updatedAt: '2026-11-08T10:00:00Z' },
  { studentId: 'peer_4', nickname: '纸飞机船长', avatarId: 'bear', classCode: '1A', mode: 'decoder', score: 440, completed: true, badgesCount: 4, updatedAt: '2026-11-08T08:45:00Z' },
  { studentId: 'peer_5', nickname: '拼贴小博士', avatarId: 'panda', classCode: '1A', mode: 'decoder', score: 420, completed: true, badgesCount: 4, updatedAt: '2026-11-08T09:30:00Z' },
  { studentId: 'peer_6', nickname: '阳光小水彩', avatarId: 'koala', classCode: '1A', mode: 'decoder', score: 390, completed: false, badgesCount: 3, updatedAt: '2026-11-08T10:20:00Z' },
  { studentId: 'peer_7', nickname: '声音密码王', avatarId: 'fox', classCode: '1A', mode: 'master', score: 490, completed: true, badgesCount: 4, updatedAt: '2026-11-08T08:20:00Z' },
  { studentId: 'peer_8', nickname: '折纸小松鼠', avatarId: 'rabbit', classCode: '1A', mode: 'master', score: 470, completed: true, badgesCount: 4, updatedAt: '2026-11-08T09:40:00Z' },
  { studentId: 'peer_9', nickname: '魔法胶水狮', avatarId: 'lion', classCode: '1B', mode: 'explorer', score: 350, completed: true, badgesCount: 4, updatedAt: '2026-11-08T11:00:00Z' },
  { studentId: 'peer_10', nickname: '智慧小熊', avatarId: 'bear', classCode: '1B', mode: 'decoder', score: 410, completed: true, badgesCount: 4, updatedAt: '2026-11-08T11:30:00Z' },
];

const SEED_TEAMS: TeamProject[] = [
  {
    teamId: 'team_seed_1',
    classCode: '1A',
    title: '奇妙森林大冒险',
    members: [
      { anonymousId: 'peer_1', classCode: '1A', nickname: '剪纸小能手', avatarId: 'rabbit', mode: 'explorer', createdAt: '2026-11-08T08:00:00Z' },
      { anonymousId: 'peer_2', classCode: '1A', nickname: '彩虹小画师', avatarId: 'lion', mode: 'explorer', createdAt: '2026-11-08T08:00:00Z' },
      { anonymousId: 'peer_4', classCode: '1A', nickname: '纸飞机船长', avatarId: 'bear', mode: 'decoder', createdAt: '2026-11-08T08:00:00Z' },
    ],
    elements: [
      { id: 'el1', category: 'background', name: '草地与蓝天', svgIcon: 'landscape', x: 50, y: 50, size: 90, rotation: 0, color: '#8CBF9E', contributorName: '剪纸小能手', roleIndex: 0 },
      { id: 'el2', category: 'cutout', name: '快乐太阳', svgIcon: 'sun', x: 25, y: 25, size: 50, rotation: 10, color: '#F4C66A', contributorName: '彩虹小画师', roleIndex: 1 },
      { id: 'el3', category: 'cutout', name: '绿色大树', svgIcon: 'tree', x: 75, y: 55, size: 60, rotation: 0, color: '#4A7C59', contributorName: '彩虹小画师', roleIndex: 1 },
      { id: 'el4', category: 'sticker', name: '闪烁金星', svgIcon: 'star', x: 30, y: 70, size: 30, rotation: 15, color: '#F4C66A', contributorName: '纸飞机船长', roleIndex: 2 },
      { id: 'el5', category: 'sticker', name: '欢乐音符', svgIcon: 'music', x: 60, y: 30, size: 35, rotation: -10, color: '#F28C75', contributorName: '纸飞机船长', roleIndex: 2 },
    ],
    status: 'submitted',
    createdAt: '2026-11-08T10:30:00Z',
    updatedAt: '2026-11-08T10:45:00Z',
  },
];

// BroadcastChannel for instant cross-tab real-time matching synchronization
let matchChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    matchChannel = new BroadcastChannel('lost_art_matchmaking_v2');
  } catch (e) {
    console.warn('BroadcastChannel not supported:', e);
  }
}

class StorageService {
  constructor() {
    this.initLocalStorage();
  }

  private initLocalStorage() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.LEADERBOARD)) {
      localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(SEED_LEADERBOARDS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TEAM_PROJECTS)) {
      localStorage.setItem(STORAGE_KEYS.TEAM_PROJECTS, JSON.stringify(SEED_TEAMS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.APP_SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(defaultSettings));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MATCHMAKING_QUEUE)) {
      localStorage.setItem(STORAGE_KEYS.MATCHMAKING_QUEUE, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVALUATIONS)) {
      const seedEval: TeacherEvaluation[] = [
        {
          studentId: 'peer_1',
          classCode: '1A',
          nickname: '剪纸小能手',
          mode: 'explorer',
          quietListening: 5,
          noteTaking: 4,
          reflectiveThinking: 4,
          contentComprehension: 5,
          fourMaterials: 5,
          appropriateResponse: 5,
          oralExpression: 4,
          teacherRemarks: '聆听专注，四样用品全部掌握，在小组拼贴中积极协作！',
          gradedAt: '2026-11-08T11:00:00Z',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(seedEval));
    }
  }

  public isDemoMode(): boolean {
    return getDbConnectionInfo().isDemo;
  }

  public getDbStatusDetail() {
    return getDbConnectionInfo();
  }

  // Student Profile
  public getStudent(): StudentProfile | null {
    if (typeof window === 'undefined') return null;
    const str = localStorage.getItem(STORAGE_KEYS.CURRENT_STUDENT);
    return str ? JSON.parse(str) : null;
  }

  public async saveStudent(student: StudentProfile): Promise<void> {
    if (typeof window === 'undefined') return;
    const current = this.getStudent();
    if (current && current.anonymousId && current.anonymousId !== student.anonymousId) {
      console.warn('Unauthorized student profile modification attempt blocked.');
      return;
    }
    localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, JSON.stringify(student));

    if (!this.isDemoMode() && db && auth?.currentUser?.uid === student.anonymousId) {
      try {
        await setDoc(doc(db, 'students', student.anonymousId), student);
      } catch (err) {
        console.warn('Firestore student save fallback to local:', err);
      }
    }
  }

  public clearStudent() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_STUDENT);
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
  }

  // Progress & Badges (Mode-Separated)
  public getProgress(studentId: string, mode?: LearningMode): GameProgress {
    const student = this.getStudent();
    const targetMode = mode || student?.mode || 'explorer';
    const classCode = student?.classCode || '1A';

    if (typeof window === 'undefined') {
      return this.createInitialProgress(studentId, classCode, targetMode);
    }

    const modeKey = `${STORAGE_KEYS.PROGRESS}_${studentId}_${targetMode}`;
    const modeStr = localStorage.getItem(modeKey);
    if (modeStr) {
      const p: GameProgress = JSON.parse(modeStr);
      if (p.studentId === studentId && p.mode === targetMode) return p;
    }

    const legacyStr = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    if (legacyStr) {
      const p: GameProgress = JSON.parse(legacyStr);
      if (p.studentId === studentId && p.mode === targetMode) {
        localStorage.setItem(modeKey, JSON.stringify(p));
        return p;
      }
    }

    const initial = this.createInitialProgress(studentId, classCode, targetMode);
    this.saveProgress(initial);
    return initial;
  }

  public createInitialProgress(studentId: string, classCode: string, mode: LearningMode): GameProgress {
    const baseScore = mode === 'master' ? 80 : mode === 'decoder' ? 60 : 50;

    return {
      studentId,
      classCode,
      mode,
      currentLevel: 1,
      badges: {
        glue: false,
        paper: false,
        scissors: false,
        sticker: false,
      },
      score: baseScore,
      completedTasks: [],
      fourGridNotes: {
        slot1: '',
        slot2: '',
        slot3: '',
        slot4: '',
        drawings: [],
      },
      completed: false,
      updatedAt: new Date().toISOString(),
    };
  }

  public async saveProgress(progress: GameProgress): Promise<void> {
    if (typeof window === 'undefined') return;
    const student = this.getStudent();

    if (student && student.anonymousId !== progress.studentId) {
      console.warn('Unauthorized progress update: Student ID mismatch blocked.');
      return;
    }

    const modeKey = `${STORAGE_KEYS.PROGRESS}_${progress.studentId}_${progress.mode}`;
    const existingStr = localStorage.getItem(modeKey);
    let verifiedScore = progress.score;
    if (existingStr) {
      const existing: GameProgress = JSON.parse(existingStr);
      const scoreCheck = verifyScoreIncrease(existing.score, progress.score, 200);
      if (!scoreCheck.valid) {
        console.warn(`Anti-tampering alert: ${scoreCheck.reason}`);
        verifiedScore = scoreCheck.safeScore;
      }
    }

    const safeProgress: GameProgress = {
      ...progress,
      score: Math.min(1000, Math.max(0, verifiedScore)),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(modeKey, JSON.stringify(safeProgress));
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(safeProgress));

    if (student) {
      const badgesCount = Object.values(safeProgress.badges).filter(Boolean).length;
      await this.updateLeaderboard({
        studentId: student.anonymousId,
        nickname: student.nickname,
        avatarId: student.avatarId,
        classCode: student.classCode,
        mode: safeProgress.mode,
        score: safeProgress.score,
        completed: safeProgress.completed,
        badgesCount,
        updatedAt: new Date().toISOString(),
      });
    }

    if (!this.isDemoMode() && db && auth?.currentUser?.uid === safeProgress.studentId) {
      try {
        await setDoc(doc(db, 'progress', safeProgress.studentId), safeProgress);
      } catch (err) {
        console.warn('Firestore progress save fallback to local:', err);
      }
    }
  }

  // Leaderboard
  public getLeaderboard(mode?: LearningMode, classCode?: string): LeaderboardEntry[] {
    if (typeof window === 'undefined') return SEED_LEADERBOARDS;
    const str = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
    let list: LeaderboardEntry[] = str ? JSON.parse(str) : SEED_LEADERBOARDS;

    if (mode) {
      list = list.filter((item) => item.mode === mode);
    }
    if (classCode && classCode !== 'ALL') {
      list = list.filter((item) => item.classCode === classCode);
    }

    return list.sort((a, b) => b.score - a.score);
  }

  public async fetchLeaderboardFromDb(mode: LearningMode, classCode?: string): Promise<{
    entries: LeaderboardEntry[];
    isLiveDb: boolean;
    source: string;
  }> {
    if (!this.isDemoMode() && db) {
      const pathForGetDocs = 'leaderboards';
      try {
        const q = query(collection(db, pathForGetDocs), where('mode', '==', mode));
        const querySnapshot = await getDocs(q);
        const liveEntries: LeaderboardEntry[] = [];
        querySnapshot.forEach((d) => {
          const data = d.data() as LeaderboardEntry;
          if (data && data.nickname && typeof data.score === 'number') {
            liveEntries.push(data);
          }
        });

        if (liveEntries.length > 0) {
          let filtered = liveEntries;
          if (classCode && classCode !== 'ALL') {
            filtered = filtered.filter((e) => e.classCode === classCode);
          }
          filtered.sort((a, b) => b.score - a.score);
          return {
            entries: filtered,
            isLiveDb: true,
            source: 'Firebase Firestore 云端数据库',
          };
        }
      } catch (err) {
        console.warn('Firestore leaderboard query error, using local fallback:', err);
      }
    }

    const local = this.getLeaderboard(mode, classCode);
    return {
      entries: local,
      isLiveDb: false,
      source: '本地模拟数据库 (Demo Mode)',
    };
  }

  public async updateLeaderboard(entry: LeaderboardEntry): Promise<void> {
    if (typeof window === 'undefined') return;
    const student = this.getStudent();

    if (student && entry.studentId !== student.anonymousId) {
      console.warn('Unauthorized leaderboard update: Student ID mismatch blocked.');
      return;
    }

    const str = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
    const list: LeaderboardEntry[] = str ? JSON.parse(str) : [...SEED_LEADERBOARDS];
    const index = list.findIndex((e) => e.studentId === entry.studentId && e.mode === entry.mode);
    let safeScore = Math.min(1000, Math.max(0, entry.score));

    if (index >= 0) {
      const existing = list[index];
      const check = verifyScoreIncrease(existing.score, entry.score, 200);
      safeScore = check.safeScore;
      list[index] = { ...existing, ...entry, score: safeScore, updatedAt: new Date().toISOString() };
    } else {
      list.push({ ...entry, score: safeScore, updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(list));

    if (!this.isDemoMode() && db && auth?.currentUser?.uid === entry.studentId) {
      try {
        const safeEntry = {
          ...entry,
          score: safeScore,
          updatedAt: new Date().toISOString(),
        };
        const docId = `${entry.studentId}_${entry.mode}`;
        await setDoc(doc(db, 'leaderboards', docId), safeEntry);
      } catch (err) {
        console.warn('Firestore leaderboard entry write error:', err);
      }
    }
  }

  // =========================================================================
  // TRUE 3-PLAYER MATCHMAKING & TEAM SYSTEM (TRANSACTIONAL & ZERO FAKE DATA)
  // =========================================================================

  /**
   * Broadcasts a real-time event to all listening browser tabs and components
   */
  private broadcastMatchEvent(event: {
    type: 'QUEUE_UPDATE' | 'TEAM_MATCHED' | 'TEAM_DISSOLVED' | 'COLLAGE_UPDATE';
    classCode: string;
    payload?: any;
  }) {
    if (matchChannel) {
      try {
        matchChannel.postMessage(event);
      } catch (e) {
        console.warn('Broadcast failed:', e);
      }
    }
    // Also trigger window custom event for same-tab reactivity
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lost_art_match_event', { detail: event }));
    }
  }

  /**
   * Gets the active waiting queue for a given class
   */
  public getMatchmakingQueue(classCode?: string): StudentProfile[] {
    if (typeof window === 'undefined') return [];
    const str = localStorage.getItem(STORAGE_KEYS.MATCHMAKING_QUEUE);
    const list: StudentProfile[] = str ? JSON.parse(str) : [];
    if (!classCode || classCode === 'ALL') return list;
    return list.filter((s) => s.classCode === classCode);
  }

  /**
   * Finds the existing team of a student if already matched
   */
  public findStudentTeam(studentId: string, classCode?: string): TeamProject | null {
    const teams = this.getTeamProjects(classCode);
    return (
      teams.find((t) => t.members.some((m) => m.anonymousId === studentId)) || null
    );
  }

  /**
   * Atomic Matchmaking Join with Reliability Gates:
   * - Prevents duplicate clicks
   * - Reconnects already-matched student
   * - Enforces single team per student
   * - Transactionally pairs 3 students when 3 are waiting
   */
  public async joinMatchmakingQueue(
    student: StudentProfile,
    sessionId: string = 'default_session'
  ): Promise<{
    status: 'matched' | 'waiting' | 'already_matched' | 'error';
    matchedTeam: TeamProject | null;
    queueCount: number;
    errorReason?: string;
  }> {
    if (typeof window === 'undefined') {
      return { status: 'error', matchedTeam: null, queueCount: 0, errorReason: 'Window not available' };
    }

    // Gate 1: Check if already matched into a team (disallow multiple teams & handle re-join)
    const existingTeams = this.getTeamProjects(student.classCode);
    const preCheck = validateStudentCanJoinQueue(student, this.getMatchmakingQueue(student.classCode), existingTeams);
    if (!preCheck.canJoin) {
      if (preCheck.existingTeam) {
        return {
          status: 'already_matched',
          matchedTeam: preCheck.existingTeam,
          queueCount: 0,
          errorReason: preCheck.reason,
        };
      }
      // If already in queue, return current waiting status
      const currentQueue = this.getMatchmakingQueue(student.classCode);
      return {
        status: 'waiting',
        matchedTeam: null,
        queueCount: currentQueue.length,
        errorReason: preCheck.reason,
      };
    }

    // Firestore Transaction Path (when connected to live cloud DB)
    const firestore = db;
    if (!this.isDemoMode() && firestore) {
      try {
        const queueDocRef = doc(firestore, 'matchmaking', `queue_${student.classCode}`);
        let formedTeam: TeamProject | null = null;
        let finalQueueCount = 1;

        await runTransaction(firestore, async (transaction) => {
          const snapshot = await transaction.get(queueDocRef);
          let currentWaiting: StudentProfile[] = [];
          if (snapshot.exists()) {
            const data = snapshot.data();
            currentWaiting = Array.isArray(data.waitingStudents) ? data.waitingStudents : [];
          }

          // Invariant: duplicate click check inside transaction
          if (currentWaiting.some((s) => s.anonymousId === student.anonymousId)) {
            finalQueueCount = currentWaiting.length;
            return;
          }

          // Transactional matching logic
          const result = executeMatchmakingTransaction(currentWaiting, student, sessionId);
          if (result.newTeam) {
            formedTeam = result.newTeam;
            finalQueueCount = 0;
            // Write team doc atomically
            const newTeamRef = doc(firestore, 'teams', result.newTeam.teamId);
            transaction.set(newTeamRef, result.newTeam);
            // Update queue doc
            transaction.set(queueDocRef, {
              classCode: student.classCode,
              waitingStudents: result.updatedQueue,
              updatedAt: new Date().toISOString(),
            });
          } else {
            finalQueueCount = result.updatedQueue.length;
            transaction.set(queueDocRef, {
              classCode: student.classCode,
              waitingStudents: result.updatedQueue,
              updatedAt: new Date().toISOString(),
            });
          }
        });

        // Mirror locally and broadcast
        if (formedTeam) {
          this.saveTeamProject(formedTeam);
          this.broadcastMatchEvent({
            type: 'TEAM_MATCHED',
            classCode: student.classCode,
            payload: formedTeam,
          });
          return { status: 'matched', matchedTeam: formedTeam, queueCount: 0 };
        } else {
          this.broadcastMatchEvent({
            type: 'QUEUE_UPDATE',
            classCode: student.classCode,
            payload: { queueCount: finalQueueCount },
          });
          return { status: 'waiting', matchedTeam: null, queueCount: finalQueueCount };
        }
      } catch (dbError) {
        console.warn('Firestore matchmaking transaction error, falling back to local transactional queue:', dbError);
      }
    }

    // Local Shared Transaction Path (Demo Mode & Cross-Tab Synced)
    const rawQueueStr = localStorage.getItem(STORAGE_KEYS.MATCHMAKING_QUEUE);
    let allQueue: StudentProfile[] = rawQueueStr ? JSON.parse(rawQueueStr) : [];

    const txResult = executeMatchmakingTransaction(allQueue, student, sessionId);
    localStorage.setItem(STORAGE_KEYS.MATCHMAKING_QUEUE, JSON.stringify(txResult.updatedQueue));

    if (txResult.newTeam) {
      this.saveTeamProject(txResult.newTeam);
      this.broadcastMatchEvent({
        type: 'TEAM_MATCHED',
        classCode: student.classCode,
        payload: txResult.newTeam,
      });
      return {
        status: 'matched',
        matchedTeam: txResult.newTeam,
        queueCount: 0,
      };
    } else {
      const classCount = txResult.updatedQueue.filter((s) => s.classCode === student.classCode).length;
      this.broadcastMatchEvent({
        type: 'QUEUE_UPDATE',
        classCode: student.classCode,
        payload: { queueCount: classCount },
      });
      return {
        status: 'waiting',
        matchedTeam: null,
        queueCount: classCount,
      };
    }
  }

  /**
   * Leaves or cancels the waiting queue
   */
  public async leaveMatchmakingQueue(studentId: string, classCode: string): Promise<void> {
    if (typeof window === 'undefined') return;

    // Local storage queue update
    const rawQueueStr = localStorage.getItem(STORAGE_KEYS.MATCHMAKING_QUEUE);
    if (rawQueueStr) {
      const allQueue: StudentProfile[] = JSON.parse(rawQueueStr);
      const updated = removeStudentFromQueue(allQueue, studentId);
      localStorage.setItem(STORAGE_KEYS.MATCHMAKING_QUEUE, JSON.stringify(updated));
    }

    // Live DB update if connected
    const firestore = db;
    if (!this.isDemoMode() && firestore) {
      try {
        const queueDocRef = doc(firestore, 'matchmaking', `queue_${classCode}`);
        await runTransaction(firestore, async (tx) => {
          const snap = await tx.get(queueDocRef);
          if (snap.exists()) {
            const data = snap.data();
            const waiting = Array.isArray(data.waitingStudents) ? data.waitingStudents : [];
            const filtered = removeStudentFromQueue(waiting, studentId);
            tx.update(queueDocRef, {
              waitingStudents: filtered,
              updatedAt: new Date().toISOString(),
            });
          }
        });
      } catch (e) {
        console.warn('Firestore queue leave error:', e);
      }
    }

    this.broadcastMatchEvent({
      type: 'QUEUE_UPDATE',
      classCode,
      payload: { studentId, action: 'left' },
    });
  }

  /**
   * Immediately pairs the student with AI classmates if no real peers are waiting,
   * ensuring the child is never stuck waiting.
   */
  public async createTeamWithAIPeers(
    student: StudentProfile,
    waitingRealPeers: StudentProfile[] = []
  ): Promise<TeamProject> {
    const aiCandidates = [
      { nickname: '小艺同学 (AI)', avatarId: 'rabbit' },
      { nickname: '小晨同学 (AI)', avatarId: 'cat' },
      { nickname: '小乐同学 (AI)', avatarId: 'dog' },
    ];

    const teamMembers: StudentProfile[] = [student];

    // If there is already 1 other real classmate waiting, keep them!
    const otherRealPeers = waitingRealPeers.filter((s) => s.anonymousId !== student.anonymousId);
    if (otherRealPeers.length > 0) {
      teamMembers.push(otherRealPeers[0]);
    }

    // Fill remaining slots with AI teammates up to 3
    let aiIdx = 0;
    while (teamMembers.length < 3) {
      const candidate = aiCandidates[aiIdx % aiCandidates.length];
      teamMembers.push({
        anonymousId: `ai_bot_${Date.now()}_${aiIdx + 1}`,
        nickname: candidate.nickname,
        classCode: student.classCode,
        avatarId: candidate.avatarId,
        mode: student.mode,
        createdAt: new Date().toISOString(),
      });
      aiIdx++;
    }

    // Clean student from waiting queue
    await this.leaveMatchmakingQueue(student.anonymousId, student.classCode);
    for (const m of otherRealPeers) {
      await this.leaveMatchmakingQueue(m.anonymousId, student.classCode);
    }

    const { newTeam } = createManualTeacherTeam(
      teamMembers,
      `【${student.classCode}班】奇妙艺术拼贴小组`,
      student.classCode
    );

    this.saveTeamProject(newTeam);
    this.broadcastMatchEvent({
      type: 'TEAM_MATCHED',
      classCode: student.classCode,
      payload: newTeam,
    });

    return newTeam;
  }

  /**
   * Real-time subscription to Matchmaking & Team events
   */
  public subscribeMatchmaking(
    classCode: string,
    studentId: string,
    onQueueUpdate: (queue: StudentProfile[], team: TeamProject | null) => void
  ): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleEvent = (eventData: any) => {
      if (!eventData || eventData.classCode !== classCode) return;
      const currentQueue = this.getMatchmakingQueue(classCode);
      const studentTeam = this.findStudentTeam(studentId, classCode);

      if (eventData.type === 'TEAM_MATCHED' && eventData.payload) {
        const team: TeamProject = eventData.payload;
        if (team.members.some((m) => m.anonymousId === studentId)) {
          onQueueUpdate(currentQueue, team);
          return;
        }
      }

      onQueueUpdate(currentQueue, studentTeam);
    };

    // 1. BroadcastChannel listener (instant cross-tab sync)
    const channelListener = (e: MessageEvent) => {
      handleEvent(e.data);
    };
    if (matchChannel) {
      matchChannel.addEventListener('message', channelListener);
    }

    // 2. Storage event listener (fallback for storage mutations)
    const storageListener = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.MATCHMAKING_QUEUE || e.key === STORAGE_KEYS.TEAM_PROJECTS) {
        const currentQueue = this.getMatchmakingQueue(classCode);
        const studentTeam = this.findStudentTeam(studentId, classCode);
        onQueueUpdate(currentQueue, studentTeam);
      }
    };
    window.addEventListener('storage', storageListener);

    // 3. Custom DOM event listener (same-tab reactivity)
    const customListener = (e: Event) => {
      const customEvent = e as CustomEvent;
      handleEvent(customEvent.detail);
    };
    window.addEventListener('lost_art_match_event', customListener);

    // Initial trigger
    const initialQueue = this.getMatchmakingQueue(classCode);
    const initialTeam = this.findStudentTeam(studentId, classCode);
    onQueueUpdate(initialQueue, initialTeam);

    return () => {
      if (matchChannel) {
        matchChannel.removeEventListener('message', channelListener);
      }
      window.removeEventListener('storage', storageListener);
      window.removeEventListener('lost_art_match_event', customListener);
    };
  }

  // Team Projects
  public getTeamProjects(classCode?: string): TeamProject[] {
    if (typeof window === 'undefined') return SEED_TEAMS;
    const str = localStorage.getItem(STORAGE_KEYS.TEAM_PROJECTS);
    const list: TeamProject[] = str ? JSON.parse(str) : SEED_TEAMS;
    if (classCode && classCode !== 'ALL') {
      return list.filter((t) => t.classCode === classCode);
    }
    return list;
  }

  public saveTeamProject(project: TeamProject) {
    if (typeof window === 'undefined') return;
    const list = this.getTeamProjects();
    const idx = list.findIndex((t) => t.teamId === project.teamId);
    if (idx >= 0) {
      list[idx] = project;
    } else {
      list.push(project);
    }
    localStorage.setItem(STORAGE_KEYS.TEAM_PROJECTS, JSON.stringify(list));

    if (!this.isDemoMode() && db) {
      try {
        setDoc(doc(db, 'teams', project.teamId), project).catch((err) =>
          console.warn('Firestore team save error:', err)
        );
      } catch (e) {
        // ignore
      }
    }

    this.broadcastMatchEvent({
      type: 'COLLAGE_UPDATE',
      classCode: project.classCode,
      payload: project,
    });
  }

  /**
   * Teacher Manual Grouping:
   * Fallback feature allowing the teacher to group 2-4 students directly into a team
   */
  public manualCreateTeam(
    selectedStudents: StudentProfile[],
    teamTitle: string,
    classCode: string
  ): TeamProject {
    const { newTeam } = createManualTeacherTeam(selectedStudents, teamTitle, classCode);

    // Save the new team
    this.saveTeamProject(newTeam);

    // Remove these students from any waiting queue
    const selectedIds = new Set(selectedStudents.map((s) => s.anonymousId));
    const rawQueueStr = localStorage.getItem(STORAGE_KEYS.MATCHMAKING_QUEUE);
    if (rawQueueStr) {
      const allQueue: StudentProfile[] = JSON.parse(rawQueueStr);
      const filtered = allQueue.filter((s) => !selectedIds.has(s.anonymousId));
      localStorage.setItem(STORAGE_KEYS.MATCHMAKING_QUEUE, JSON.stringify(filtered));
    }

    // Broadcast to immediately transition the students' screens
    this.broadcastMatchEvent({
      type: 'TEAM_MATCHED',
      classCode,
      payload: newTeam,
    });

    return newTeam;
  }

  /**
   * Teacher dissolves an existing team so students can re-match
   */
  public dissolveTeam(teamId: string, classCode: string): void {
    if (typeof window === 'undefined') return;
    const list = this.getTeamProjects();
    const filtered = list.filter((t) => t.teamId !== teamId);
    localStorage.setItem(STORAGE_KEYS.TEAM_PROJECTS, JSON.stringify(filtered));

    if (!this.isDemoMode() && db) {
      try {
        deleteDoc(doc(db, 'teams', teamId)).catch((e) => console.warn('Firestore delete team error:', e));
      } catch (e) {
        // ignore
      }
    }

    this.broadcastMatchEvent({
      type: 'TEAM_DISSOLVED',
      classCode,
      payload: { teamId },
    });
  }

  // Teacher Evaluations
  public getEvaluations(classCode?: string): TeacherEvaluation[] {
    if (typeof window === 'undefined') return [];
    const str = localStorage.getItem(STORAGE_KEYS.EVALUATIONS);
    const list: TeacherEvaluation[] = str ? JSON.parse(str) : [];
    if (classCode && classCode !== 'ALL') {
      return list.filter((e) => e.classCode === classCode);
    }
    return list;
  }

  public saveEvaluation(evaluation: TeacherEvaluation) {
    if (typeof window === 'undefined') return;
    const list = this.getEvaluations();
    const idx = list.findIndex((e) => e.studentId === evaluation.studentId);
    if (idx >= 0) {
      list[idx] = evaluation;
    } else {
      list.push(evaluation);
    }
    localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(list));
  }

  // App Settings
  public getSettings(): AppSettings {
    if (typeof window === 'undefined') return defaultSettings;
    const str = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
    return str ? JSON.parse(str) : defaultSettings;
  }

  public saveSettings(settings: AppSettings) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
  }

  public resetDemoData() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(SEED_LEADERBOARDS));
    localStorage.setItem(STORAGE_KEYS.TEAM_PROJECTS, JSON.stringify(SEED_TEAMS));
    localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(defaultSettings));
    localStorage.setItem(STORAGE_KEYS.MATCHMAKING_QUEUE, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.CURRENT_STUDENT);
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_KEYS.PROGRESS)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      // ignore
    }
  }
}

export const storageService = new StorageService();
