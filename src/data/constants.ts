import { AvatarInfo, BadgeType, LearningMode } from '../types';

export const AVATARS: AvatarInfo[] = [
  {
    id: 'lion',
    name: '小狮子画师',
    emoji: '🦁',
    bgColor: 'bg-amber-100 border-amber-300 text-amber-900',
    tagline: '阳光勇敢，喜欢大胆画出好想法！',
  },
  {
    id: 'fox',
    name: '探险小狐狸',
    emoji: '🦊',
    bgColor: 'bg-orange-100 border-orange-300 text-orange-900',
    tagline: '机灵聪颖，最会捕捉声音细节！',
  },
  {
    id: 'rabbit',
    name: '智慧小白兔',
    emoji: '🐰',
    bgColor: 'bg-pink-100 border-pink-300 text-pink-900',
    tagline: '耳朵长长，静心聆听每一个要求！',
  },
  {
    id: 'bear',
    name: '专注小熊熊',
    emoji: '🐻',
    bgColor: 'bg-yellow-100 border-yellow-300 text-yellow-900',
    tagline: '耐心细致，稳稳整理好每件用品！',
  },
  {
    id: 'panda',
    name: '快乐小熊猫',
    emoji: '🐼',
    bgColor: 'bg-emerald-100 border-emerald-300 text-emerald-900',
    tagline: '乐于助人，与伙伴合作拼贴巨画！',
  },
  {
    id: 'koala',
    name: '魔法小考拉',
    emoji: '🐨',
    bgColor: 'bg-sky-100 border-sky-300 text-sky-900',
    tagline: '安静沉稳，把要点牢牢记在心间！',
  },
];

export const CLASS_OPTIONS = ['1A', '1B', '1C', '1D', '1E', '1F'];

export const MODE_INFO: Record<
  LearningMode,
  {
    title: string;
    subtitle: string;
    description: string;
    features: string[];
    color: string;
    borderColor: string;
    badgeBg: string;
    badgeText: string;
    recommendedFor: string;
  }
> = {
  explorer: {
    title: '小小探索家',
    subtitle: '多重支架 · 步步引导',
    description: '适合刚开始练习听力记录的小朋友。提供语音慢速重听、四格图画指引与贴心提示。',
    features: ['音频可自由反复播放', '小步骤图文提示', '允许圈选与图章记录', '答错即刻温和指导'],
    color: 'from-amber-50 to-amber-100',
    borderColor: 'border-amber-300',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    recommendedFor: '初学者 / 需要图文引导的小朋友',
  },
  decoder: {
    title: '独立解密员',
    subtitle: '自主记录 · 严谨解密',
    description: '适合能够独立听懂口头通知的小朋友。完整收听、自主做四格记录卡、从六种中挑出四种。',
    features: ['完整聆听教师口头通知', '自主填写四格重点卡', '辨析6种用品并选出4种', '完成填空与句型表达'],
    color: 'from-emerald-50 to-emerald-100',
    borderColor: 'border-emerald-300',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    recommendedFor: '能够自主边听边记的小朋友',
  },
  master: {
    title: '声音密码大师',
    subtitle: '思维迁移 · 创造表达',
    description: '适合听力理解能力强的挑战者。减少文字提示、辨析干扰信息、阐述依据并尝试设计新口头通知。',
    features: ['挑战极简提示模式', '辨别干扰信息并说出依据', '完成迁移应用挑战', '尝试设计同伴口头通知'],
    color: 'from-sky-50 to-sky-100',
    borderColor: 'border-sky-300',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    recommendedFor: '掌握良好、喜欢探究与表达的学霸',
  },
};

export const BADGE_DETAILS: Record<
  BadgeType,
  {
    name: string;
    image: string;
    desc: string;
    color: string;
    levelSource: number;
    resourceName: string;
  }
> = {
  glue: {
    name: '闪亮星星徽章',
    image: '/assets/images/badges/badge-star.svg',
    desc: '恭喜完成声音探索，点亮第一颗智慧星光！',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    levelSource: 1,
    resourceName: 'badge-star',
  },
  paper: {
    name: '艺术画框徽章',
    image: '/assets/images/badges/badge-frame.svg',
    desc: '搜查任务圆满通过，收获典雅的艺术画框！',
    color: 'bg-sky-100 text-sky-800 border-sky-300',
    levelSource: 2,
    resourceName: 'badge-frame',
  },
  scissors: {
    name: '魔法灯笼徽章',
    image: '/assets/images/badges/badge-lantern.svg',
    desc: '成功解开声音密码，点燃温暖的魔法灯笼！',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    levelSource: 3,
    resourceName: 'badge-lantern',
  },
  sticker: {
    name: '展览钥匙徽章',
    image: '/assets/images/badges/badge-key.svg',
    desc: '团队合作齐心创作，开启艺术展金色大门！',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    levelSource: 4,
    resourceName: 'badge-key',
  },
};

// Asset Paths for Craft Materials and Tools (1 to 6 sequence)
export const ART_MATERIAL_IMAGES = {
  glue: '/assets/aistudio/2-Photoroom_7ca5a585.png',
  coloredPaper: '/assets/aistudio/3-removebg-preview_6d1dd579.png',
  scissors: '/assets/aistudio/1-removebg-preview_76b539d2.png',
  stickers: '/assets/aistudio/4-removebg-preview_3f8f1975.png',
  pencil: '/assets/aistudio/5-removebg-preview_0f196a34.png',
  ruler: '/assets/aistudio/6-removebg-preview_6d43f470.png',
  paint: '/assets/images/distractor_paint.svg',
};

// Teacher Notice MP3 (Updated High-Clarity Recording)
export const TEACHER_NOTICE_AUDIO_SRC =
  '/assets/aistudio/Screen_Recording_2026-11-11_115806_91df51d0.mp3';

// 7 Evaluation dimensions for SP 1.2.1
export const RUBRIC_CRITERIA = [
  { key: 'quietListening', label: '安静聆听', desc: '具有静心听讲的良好习惯，不插嘴、坐姿端正' },
  { key: 'noteTaking', label: '边听边记', desc: '能在听的过程中在四格卡上盖印或做记号' },
  { key: 'reflectiveThinking', label: '边听边想', desc: '积极思考通知里的用品、时间与具体要求' },
  { key: 'contentComprehension', label: '主要内容', desc: '通过聆听理解通知核心要义与所涉及科目' },
  { key: 'fourMaterials', label: '四样用品', desc: '能通过聆听准确辨识老师在通知中要求的全部用品' },
  { key: 'appropriateResponse', label: '适当回应', desc: '能准确理解并执行通知中的动作与收纳要求' },
  { key: 'oralExpression', label: '口头表达', desc: '能用完整礼貌的句型向老师或伙伴清楚复述听到的通知重点' },
];
