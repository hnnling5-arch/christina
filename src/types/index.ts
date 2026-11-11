export type LearningMode = 'explorer' | 'decoder' | 'master';

export interface AvatarInfo {
  id: string;
  name: string;
  emoji: string;
  bgColor: string;
  tagline: string;
}

export interface StudentProfile {
  anonymousId: string;
  classCode: string;
  nickname: string;
  avatarId: string;
  mode: LearningMode;
  createdAt: string;
}

export type BadgeType = 'glue' | 'paper' | 'scissors' | 'sticker';

export interface BadgesState {
  glue: boolean;
  paper: boolean;
  scissors: boolean;
  sticker: boolean;
}

export interface FourGridNote {
  slot1: string; // e.g. 胶水
  slot2: string; // e.g. 彩色纸
  slot3: string; // e.g. 剪刀
  slot4: string; // e.g. 贴纸
  slot5?: string; // e.g. 铅笔
  slot6?: string; // e.g. 直尺
  drawings: string[]; // stamp or sticker keys
}

export interface GameProgress {
  studentId: string;
  classCode: string;
  mode: LearningMode;
  currentLevel: number; // 1 to 5
  badges: BadgesState;
  score: number;
  completedTasks: string[];
  fourGridNotes: FourGridNote;
  selfOralResponse?: string;
  completed: boolean;
  updatedAt: string;
}

export interface LeaderboardEntry {
  studentId: string;
  nickname: string;
  avatarId: string;
  classCode: string;
  mode: LearningMode;
  score: number;
  completed: boolean;
  badgesCount: number;
  updatedAt: string;
}

export type CollageCategory = 'background' | 'cutout' | 'sticker';

export interface CollageElement {
  id: string;
  category: CollageCategory;
  name: string;
  svgIcon: string;
  imageUrl?: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  size: number;
  rotation: number;
  color?: string;
  contributorName: string;
  roleIndex: number; // 0: background, 1: cutouts, 2: stickers
}

export interface TeamProject {
  teamId: string;
  classCode: string;
  title: string;
  members: StudentProfile[];
  elements: CollageElement[];
  status: 'draft' | 'submitted';
  createdAt: string;
  updatedAt: string;
}

export interface TeacherEvaluation {
  studentId: string;
  classCode: string;
  nickname: string;
  mode: LearningMode;
  quietListening: number; // 1-5
  noteTaking: number; // 1-5
  reflectiveThinking: number; // 1-5
  contentComprehension: number; // 1-5
  fourMaterials: number; // 1-5
  appropriateResponse: number; // 1-5
  oralExpression: number; // 1-5
  teacherRemarks: string;
  gradedAt: string;
}

export interface AppSettings {
  audioNoticeUrl: string;
  youtubeVideoUrl: string;
  updatedAt: string;
}
