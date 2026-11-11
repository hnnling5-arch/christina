import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterNickname,
  validateLostMaterials,
  isTeamStudioUnlocked,
  verifyCipherAnswer,
  calculateScore,
  processMatchmaking,
  TARGET_MATERIALS,
  verifyScoreIncrease,
  validateStudentCanJoinQueue,
  removeStudentFromQueue,
  createManualTeacherTeam,
} from './rules';
import { StudentProfile } from '../types';

test('filterNickname correctly accepts valid kid nicknames', () => {
  const result = filterNickname('彩虹小画师');
  assert.equal(result.isValid, true);
  assert.equal(result.filtered, '彩虹小画师');
});

test('filterNickname rejects empty strings', () => {
  const result = filterNickname('   ');
  assert.equal(result.isValid, false);
});

test('filterNickname rejects phone numbers or IC numbers to protect privacy', () => {
  const resultPhone = filterNickname('小明012345678');
  assert.equal(resultPhone.isValid, false);
  assert.match(resultPhone.reason || '', /电话号码/);
});

test('filterNickname rejects real Chinese names with common surnames', () => {
  const result1 = filterNickname('陈大明');
  assert.equal(result1.isValid, false);
  assert.match(result1.reason || '', /真实姓名/);

  const result2 = filterNickname('张伟');
  assert.equal(result2.isValid, false);
  assert.match(result2.reason || '', /真实姓名/);
});

test('filterNickname rejects real English full names', () => {
  const resultEng = filterNickname('John Tan');
  assert.equal(resultEng.isValid, false);
  assert.match(resultEng.reason || '', /真实英文姓名/);
});

test('verifyScoreIncrease prevents score drops and large tampering leaps', () => {
  // Disallow decrease
  const drop = verifyScoreIncrease(300, 250);
  assert.equal(drop.valid, false);
  assert.equal(drop.safeScore, 300);

  // Disallow leap over 200
  const leap = verifyScoreIncrease(300, 800);
  assert.equal(leap.valid, false);
  assert.equal(leap.safeScore, 500); // clamped to 300 + 200

  // Allow legitimate stage score increment (e.g. +80)
  const okInc = verifyScoreIncrease(300, 380);
  assert.equal(okInc.valid, true);
  assert.equal(okInc.safeScore, 380);

  // Cap at 1000 max
  const maxCap = verifyScoreIncrease(950, 1050);
  assert.equal(maxCap.valid, false);
  assert.equal(maxCap.safeScore, 1000);
});

test('validateLostMaterials detects all 4 correct materials', () => {
  const result = validateLostMaterials(['胶水', '彩色纸', '剪刀', '贴纸']);
  assert.equal(result.isCorrect, true);
  assert.equal(result.correctCount, 4);
  assert.equal(result.missing.length, 0);
  assert.equal(result.extras.length, 0);
});

test('validateLostMaterials flags distractor items (paint & ruler)', () => {
  const result = validateLostMaterials(['胶水', '彩色纸', '颜料', '尺']);
  assert.equal(result.isCorrect, false);
  assert.deepEqual(result.extras, ['颜料', '尺']);
  assert.match(result.hint, /再听一次|重新播放/);
});

test('isTeamStudioUnlocked returns true only when all 4 badges are collected', () => {
  const incomplete = { glue: true, paper: true, scissors: false, sticker: true };
  assert.equal(isTeamStudioUnlocked(incomplete), false);

  const complete = { glue: true, paper: true, scissors: true, sticker: true };
  assert.equal(isTeamStudioUnlocked(complete), true);
});

test('verifyCipherAnswer validates fill-in-the-blank for 美术课', () => {
  const right = verifyCipherAnswer('fillBlank', '美术');
  assert.equal(right.isCorrect, true);

  const wrong = verifyCipherAnswer('fillBlank', '体育');
  assert.equal(wrong.isCorrect, false);
});

test('verifyCipherAnswer validates sortOrder sequence', () => {
  const correctOrder = ['listen_class', 'prepare_items', 'put_in_bag', 'bring_to_school'];
  const res = verifyCipherAnswer('sortOrder', correctOrder);
  assert.equal(res.isCorrect, true);

  const wrongOrder = ['bring_to_school', 'listen_class', 'prepare_items', 'put_in_bag'];
  const wrongRes = verifyCipherAnswer('sortOrder', wrongOrder);
  assert.equal(wrongRes.isCorrect, false);
});

test('calculateScore scales appropriately with mode difficulty', () => {
  const explorerScore = calculateScore('explorer', 100, 4);
  const masterScore = calculateScore('master', 100, 4);
  assert.ok(masterScore > explorerScore);
});

test('processMatchmaking creates team of 3 students from same class', () => {
  const s1: StudentProfile = {
    anonymousId: 's1',
    classCode: '1A',
    nickname: '小狮子',
    avatarId: 'lion',
    mode: 'explorer',
    createdAt: new Date().toISOString(),
  };
  const s2: StudentProfile = {
    anonymousId: 's2',
    classCode: '1A',
    nickname: '小狐狸',
    avatarId: 'fox',
    mode: 'explorer',
    createdAt: new Date().toISOString(),
  };
  const s3: StudentProfile = {
    anonymousId: 's3',
    classCode: '1A',
    nickname: '小兔子',
    avatarId: 'rabbit',
    mode: 'explorer',
    createdAt: new Date().toISOString(),
  };

  const step1 = processMatchmaking([], s1);
  assert.equal(step1.matchedTeam, null);
  assert.equal(step1.remainingQueue.length, 1);

  const step2 = processMatchmaking(step1.remainingQueue, s2);
  assert.equal(step2.matchedTeam, null);
  assert.equal(step2.remainingQueue.length, 2);

  const step3 = processMatchmaking(step2.remainingQueue, s3);
  assert.notEqual(step3.matchedTeam, null);
  assert.equal(step3.matchedTeam?.length, 3);
  assert.equal(step3.remainingQueue.length, 0);
});

test('validateStudentCanJoinQueue prevents duplicate click and joining multiple teams', () => {
  const student: StudentProfile = {
    anonymousId: 's_test_1',
    classCode: '1A',
    nickname: '彩虹小画师',
    avatarId: 'lion',
    mode: 'explorer',
    createdAt: new Date().toISOString(),
  };

  // Case 1: Can join empty queue
  const ok = validateStudentCanJoinQueue(student, [], []);
  assert.equal(ok.canJoin, true);

  // Case 2: Reject duplicate queue entry
  const duplicate = validateStudentCanJoinQueue(student, [student], []);
  assert.equal(duplicate.canJoin, false);
  assert.match(duplicate.reason || '', /已经在当前班级的等待队列中/);

  // Case 3: Reject if student already in an existing team
  const existingTeam = {
    teamId: 't1',
    classCode: '1A',
    title: '奇妙森林大冒险',
    members: [student],
    elements: [],
    status: 'draft' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const inTeam = validateStudentCanJoinQueue(student, [], [existingTeam]);
  assert.equal(inTeam.canJoin, false);
  assert.match(inTeam.reason || '', /已经加入小组/);
});

test('removeStudentFromQueue correctly removes student when student leaves', () => {
  const s1: StudentProfile = {
    anonymousId: 's1',
    classCode: '1A',
    nickname: '小狮子',
    avatarId: 'lion',
    mode: 'explorer',
    createdAt: new Date().toISOString(),
  };
  const s2: StudentProfile = {
    anonymousId: 's2',
    classCode: '1A',
    nickname: '小狐狸',
    avatarId: 'fox',
    mode: 'explorer',
    createdAt: new Date().toISOString(),
  };

  const queue = [s1, s2];
  const afterLeave = removeStudentFromQueue(queue, 's1');
  assert.equal(afterLeave.length, 1);
  assert.equal(afterLeave[0].anonymousId, 's2');
});

test('createManualTeacherTeam creates valid team for selected students', () => {
  const students: StudentProfile[] = [
    { anonymousId: 's1', classCode: '1A', nickname: '小狮子', avatarId: 'lion', mode: 'explorer', createdAt: '' },
    { anonymousId: 's2', classCode: '1A', nickname: '小狐狸', avatarId: 'fox', mode: 'explorer', createdAt: '' },
    { anonymousId: 's3', classCode: '1A', nickname: '小白兔', avatarId: 'rabbit', mode: 'explorer', createdAt: '' },
  ];

  const result = createManualTeacherTeam(students, '阳光向日葵拼贴画', '1A');
  assert.equal(result.newTeam.classCode, '1A');
  assert.equal(result.newTeam.title, '阳光向日葵拼贴画');
  assert.equal(result.newTeam.members.length, 3);
  assert.equal(result.newTeam.status, 'draft');
});
