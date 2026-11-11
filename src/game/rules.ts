import { BadgesState, LearningMode, StudentProfile, TeamProject } from '../types';

export const TARGET_MATERIALS = ['胶水', '彩色纸', '剪刀', '贴纸'] as const;
export const DISTRACTOR_MATERIALS = ['颜料', '尺'] as const;

// Cute kid-friendly approved cartoon nicknames categorized for fun selection
export const APPROVED_NICKNAMES = [
  '彩虹小画师',
  '纸飞机船长',
  '剪纸小能手',
  '星星探宝员',
  '魔法胶水狮',
  '拼贴小博士',
  '快乐小袋鼠',
  '阳光小水彩',
  '折纸小松鼠',
  '森林小百灵',
  '音符小侦探',
  '巧手小海獭',
  '飞天小画笔',
  '奇妙探险家',
  '调色小精灵',
  '几何小魔术师',
  '彩色小飞象',
  '爱听声音的兔兔',
] as const;

export const SUGGESTED_NICKNAMES = [...APPROVED_NICKNAMES];

// Common Chinese surnames for detecting real names
const COMMON_SURNAMES = [
  '李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
  '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
  '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧',
  '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕',
  '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎',
  '余', '潘', '杜', '戴', '夏', '钟', '汪', '田', '任', '姜',
  '范', '方', '石', '姚', '谭', '廖', '邹', '熊', '金', '陆',
  '郝', '孔', '白', '崔', '康', '毛', '邱', '秦', '江', '史',
  '顾', '侯', '邵', '孟', '龙', '万', '段', '雷', '钱', '汤',
  '尹', '黎', '易', '常', '武', '乔', '贺', '赖', '龚', '文',
];

// Sensitive or PII keywords blacklist
const SENSITIVE_KEYWORDS = [
  'badword',
  'stupid',
  'idiot',
  '死',
  '笨',
  '滚',
  '混蛋',
  '王八',
  '垃圾',
  '欺负',
];

/**
 * Filters nickname to strictly block real names, PII (phone, IC, email) and inappropriate words
 */
export function filterNickname(input: string): { isValid: boolean; filtered: string; reason?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, filtered: '', reason: '请选择或挑选一个可爱的小探险家昵称哦！' };
  }
  if (trimmed.length > 12) {
    return { isValid: false, filtered: trimmed.slice(0, 12), reason: '昵称请不要超过12个字哦' };
  }

  // Check for phone number or ID card number pattern (6 or more consecutive digits)
  if (/\d{6,}/.test(trimmed)) {
    return { isValid: false, filtered: '', reason: '严禁输入电话号码或身份证号等个人隐私资料！' };
  }

  // Check for email address
  if (/@|\.com|\.my|\.org|\.cn/i.test(trimmed)) {
    return { isValid: false, filtered: '', reason: '严禁输入电子邮箱等个人联系方式！' };
  }

  // Check for common real name patterns (e.g. "陈大明", "张伟", "Lim Wei", "Tan Mei Ling")
  // 1. 2 to 4 characters starting with a common Chinese surname without cartoon keywords
  const cartoonKeywords = ['小', '师', '能手', '探宝', '博士', '王', '象', '兔', '熊', '猫', '鸟', '宝', '达人', '船长', '精灵', '星'];
  const hasCartoonKeyword = cartoonKeywords.some((k) => trimmed.includes(k));

  if (trimmed.length >= 2 && trimmed.length <= 4 && !hasCartoonKeyword) {
    const firstChar = trimmed.charAt(0);
    if (COMMON_SURNAMES.includes(firstChar)) {
      return {
        isValid: false,
        filtered: '',
        reason: '保护隐私：请勿使用学生真实姓名！请选择系统提供的趣味游戏昵称。',
      };
    }
  }

  // 2. English real name pattern: e.g. "John Tan", "Lim Xiao Ming", "Jason Lee"
  if (/^[A-Za-z]+(\s+[A-Za-z]+)+$/.test(trimmed)) {
    return {
      isValid: false,
      filtered: '',
      reason: '保护隐私：禁止输入真实英文姓名，请选择系统提供的可爱卡通昵称！',
    };
  }

  // Check for inappropriate keywords
  const lower = trimmed.toLowerCase();
  for (const word of SENSITIVE_KEYWORDS) {
    if (lower.includes(word)) {
      return { isValid: false, filtered: '', reason: '昵称含有不适合的词语，请换一个友善的名字吧' };
    }
  }

  return { isValid: true, filtered: trimmed };
}

/**
 * Score anti-tampering verification:
 * Formal score cannot decrease, jump by more than maxDelta (200), or exceed 1000.
 */
export function verifyScoreIncrease(
  currentScore: number,
  incomingScore: number,
  maxDelta: number = 200
): { valid: boolean; safeScore: number; reason?: string } {
  const current = Math.max(0, currentScore || 0);
  const incoming = incomingScore;

  if (incoming < current) {
    return {
      valid: false,
      safeScore: current,
      reason: '正式成绩不可低于当前历史成绩。',
    };
  }

  if (incoming > current + maxDelta) {
    return {
      valid: false,
      safeScore: Math.min(1000, current + maxDelta),
      reason: `单次关卡成绩增幅超过合理范围（上限 +${maxDelta} 分），已自动拦截防篡改。`,
    };
  }

  if (incoming > 1000) {
    return {
      valid: false,
      safeScore: 1000,
      reason: '总积分不可超出 1000 分满分上限。',
    };
  }

  const safeScore = Math.min(1000, Math.max(0, incoming));
  return { valid: true, safeScore };
}

/**
 * Validates selected items for Level 2
 */
export function validateLostMaterials(selectedItems: string[]): {
  isCorrect: boolean;
  correctCount: number;
  missing: string[];
  extras: string[];
  hint: string;
} {
  const selectedSet = new Set(selectedItems);
  const correctCount = TARGET_MATERIALS.filter((item) => selectedSet.has(item)).length;
  const missing = TARGET_MATERIALS.filter((item) => !selectedSet.has(item));
  const extras = selectedItems.filter((item) => !TARGET_MATERIALS.includes(item as any));

  let hint = '';
  if (selectedItems.length < 4) {
    hint = `还缺少 ${4 - selectedItems.length} 样用品，你可以重新播放通知，仔细数一数老师提到了几样。`;
  } else if (missing.length === 0 && extras.length === 0) {
    hint = '太棒了！书包用品全部挑选正确，获得材料徽章！';
  } else {
    hint = '挑选的用品有不符合要求的哦。再听一次，仔细想一想，你可以重新播放通知，再检查一下你的选择！';
  }

  const isCorrect = missing.length === 0 && extras.length === 0;
  return { isCorrect, correctCount, missing, extras, hint };
}

/**
 * Checks whether all 4 material badges have been earned to unlock Team Studio
 */
export function isTeamStudioUnlocked(badges: BadgesState): boolean {
  return Boolean(badges.glue && badges.paper && badges.scissors && badges.sticker);
}

/**
 * Validates Cipher Lab answers (Level 3)
 */
export function verifyCipherAnswer(
  taskType: 'fillBlank' | 'pickFour' | 'sortOrder' | 'locationChoice',
  userAnswer: any
): { isCorrect: boolean; hint: string; rationale: string } {
  switch (taskType) {
    case 'fillBlank': {
      const text = String(userAnswer || '').trim();
      const isCorrect = text.includes('美术');
      return {
        isCorrect,
        hint: isCorrect ? '回答正确！' : '再听一次通知开头，想一想老师提到的是什么课。',
        rationale: '通过聆听把握通知的主题科目。',
      };
    }
    case 'pickFour': {
      const items = Array.isArray(userAnswer) ? userAnswer : [];
      const set = new Set(items);
      const isCorrect = TARGET_MATERIALS.every((m) => set.has(m)) && items.length === 4;
      return {
        isCorrect,
        hint: isCorrect ? '太聪明了！四样用品全部选对！' : '再听一次通知，仔细想一想老师提到的用品，再检查一下你的选择。',
        rationale: '通过聆听提取具体的用品清单。',
      };
    }
    case 'sortOrder': {
      // Expected steps sequence: 1. 听清科目 -> 2. 准备材料 -> 3. 收纳进书包 -> 4. 记得带来学校
      const order = Array.isArray(userAnswer) ? userAnswer : [];
      const expected = ['listen_class', 'prepare_items', 'put_in_bag', 'bring_to_school'];
      const isCorrect = order.length === 4 && order.every((val, idx) => val === expected[idx]);
      return {
        isCorrect,
        hint: isCorrect
          ? '逻辑顺序完全正确！'
          : '再检查一下你的排序，试着按事情发生的合理先后顺序排一排。',
        rationale: '合理准备顺序应为：明确任务 -> 准备材料 -> 妥善收纳 -> 准时携带。',
      };
    }
    case 'locationChoice': {
      const isCorrect = userAnswer === 'bag';
      return {
        isCorrect,
        hint: isCorrect ? '回答正确！' : '试着记住老师提到的重要动作要求，再重新播放通知听听看！',
        rationale: '理解通知结尾的收纳与携带要求。',
      };
    }
    default:
      return { isCorrect: false, hint: '未知题型', rationale: '' };
  }
}

/**
 * Calculate student score based on mode & achievements
 */
export function calculateScore(mode: LearningMode, baseScore: number, badgesCount: number): number {
  let multiplier = 1.0;
  if (mode === 'explorer') multiplier = 1.0; // Scaffolded friendly mode
  if (mode === 'decoder') multiplier = 1.1; // Independent mode bonus
  if (mode === 'master') multiplier = 1.25; // Sound master bonus

  const total = Math.round((baseScore + badgesCount * 50) * multiplier);
  return Math.min(total, 500);
}

/**
 * Validates whether a student is eligible to join the matchmaking queue:
 * - Checks if student is already in an active team (Cannot join multiple teams)
 * - Checks if student is already in the waiting queue (Prevents duplicate clicks)
 */
export function validateStudentCanJoinQueue(
  student: StudentProfile,
  waitingQueue: StudentProfile[],
  existingTeams: TeamProject[]
): {
  canJoin: boolean;
  reason?: string;
  existingTeam?: TeamProject;
} {
  // 1. Check if student already belongs to an existing active team
  const existingTeam = existingTeams.find((t) =>
    t.members.some((m) => m.anonymousId === student.anonymousId)
  );

  if (existingTeam) {
    return {
      canJoin: false,
      reason: `你已经加入小组【${existingTeam.title}】，同一名学生不能同时进入多个小组。`,
      existingTeam,
    };
  }

  // 2. Check if student is already in the waiting queue (duplicate click or refresh)
  const isAlreadyWaiting = waitingQueue.some((s) => s.anonymousId === student.anonymousId);
  if (isAlreadyWaiting) {
    return {
      canJoin: false,
      reason: '你已经在当前班级的等待队列中，正在为你寻找队友，请勿重复点击。',
    };
  }

  return { canJoin: true };
}

/**
 * Matchmaking transaction:
 * Atomically inserts a student into the queue for their class and activity session,
 * and if 3 students of the same class are reached, creates a new TeamProject and removes them.
 */
export function executeMatchmakingTransaction(
  waitingQueue: StudentProfile[],
  currentStudent: StudentProfile,
  sessionId: string = 'default_session'
): {
  updatedQueue: StudentProfile[];
  newTeam: TeamProject | null;
} {
  // Ensure no duplicate entry
  const exists = waitingQueue.some((s) => s.anonymousId === currentStudent.anonymousId);
  const updatedQueue = exists ? [...waitingQueue] : [...waitingQueue, currentStudent];

  // Group by class code
  const sameClass = updatedQueue.filter((s) => s.classCode === currentStudent.classCode);

  if (sameClass.length >= 3) {
    const matchedMembers = sameClass.slice(0, 3);
    const matchedIds = new Set(matchedMembers.map((m) => m.anonymousId));
    const remainingQueue = updatedQueue.filter((s) => !matchedIds.has(s.anonymousId));

    const teamId = `team_${currentStudent.classCode}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const teamTitle = `${currentStudent.classCode} 班奇妙声音拼贴画`;

    const newTeam: TeamProject = {
      teamId,
      classCode: currentStudent.classCode,
      title: teamTitle,
      members: matchedMembers,
      elements: [
        {
          id: `el_bg_${Date.now()}`,
          category: 'background',
          name: '清新底纸',
          svgIcon: 'paper',
          x: 50,
          y: 50,
          size: 90,
          rotation: 0,
          color: '#8CBF9E',
          contributorName: matchedMembers[0].nickname,
          roleIndex: 0,
        },
      ],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { updatedQueue: remainingQueue, newTeam };
  }

  return { updatedQueue, newTeam: null };
}

/**
 * Removes a student from the waiting queue (handles cancel or leave)
 */
export function removeStudentFromQueue(
  waitingQueue: StudentProfile[],
  studentId: string
): StudentProfile[] {
  return waitingQueue.filter((s) => s.anonymousId !== studentId);
}

/**
 * Teacher manual grouping:
 * Creates a formal team from selected students, removing them from any waiting queue
 */
export function createManualTeacherTeam(
  selectedStudents: StudentProfile[],
  teamTitle: string,
  classCode: string
): {
  newTeam: TeamProject;
} {
  if (selectedStudents.length < 2 || selectedStudents.length > 5) {
    throw new Error('每组建议为 3 名学生（支持 2-4 人协同合作）。');
  }

  const teamId = `team_manual_${classCode}_${Date.now()}`;
  const title = teamTitle.trim() || `${classCode} 班专属拼贴小组`;

  const newTeam: TeamProject = {
    teamId,
    classCode,
    title,
    members: selectedStudents,
    elements: [
      {
        id: `el_bg_${Date.now()}`,
        category: 'background',
        name: '底纸背景',
        svgIcon: 'paper',
        x: 50,
        y: 50,
        size: 90,
        rotation: 0,
        color: '#8CBF9E',
        contributorName: selectedStudents[0].nickname,
        roleIndex: 0,
      },
    ],
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { newTeam };
}

/**
 * Matchmaking queue processing (backward-compatible legacy wrapper)
 */
export function processMatchmaking(
  waitingQueue: StudentProfile[],
  currentStudent: StudentProfile
): {
  matchedTeam: StudentProfile[] | null;
  remainingQueue: StudentProfile[];
} {
  const result = executeMatchmakingTransaction(waitingQueue, currentStudent);
  return {
    matchedTeam: result.newTeam ? result.newTeam.members : null,
    remainingQueue: result.updatedQueue,
  };
}
