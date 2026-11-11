/**
 * ============================================================================
 * 《校园艺术展：美术用品大搜查》- 三人随机匹配系统 (Google Apps Script 后台)
 * 运行环境: Google Sheets + Google Apps Script (部署为 Web App，嵌入 Google Sites)
 * 特性:
 * 1. 严格使用 LockService 避免并发死锁与重复匹配
 * 2. 真人优先 (3人立即成团，超过3人随机抽3人，其余继续等待)
 * 3. 后台服务器时间判定 30 秒超时，AI 自动补位 (1真人+2AI 或 2真人+1AI)
 * 4. 刷新防重置、断线心跳检测、离开队列取消、防一人多组
 * 5. 角色合理分配 (聆听员、记录员、报告员)
 * ============================================================================
 */

// 预设 AI 队友数据库 (具有明确虚拟身份、可爱卡通形象及合作角色提示，绝不泄露题目答案)
var AI_ROSTER = [
  {
    id: 'ai_pencil',
    nickname: 'AI小助手·笔宝',
    avatar: '✏️',
    isAi: true,
    tagline: '认真写画，我们一起记好用品！',
    prompt: '别慌，我来做记录员，你听到什么美术用品，我就帮你工整记在清单上！'
  },
  {
    id: 'ai_ruler',
    nickname: 'AI伙伴·尺宝',
    avatar: '📏',
    isAi: true,
    tagline: '细心测量，有条不紊大合作！',
    prompt: '我是聆听员！我们一起安静听老师说，抓准关键要求，千万别漏掉哦！'
  },
  {
    id: 'ai_star',
    nickname: 'AI星星·点点',
    avatar: '⭐',
    isAi: true,
    tagline: '闪亮加油，大家合作最棒！',
    prompt: '我来担任报告员！大家准备好后，我们一起展示我们小组的成果！'
  },
  {
    id: 'ai_bear',
    nickname: 'AI小熊·聪聪',
    avatar: '🐻',
    isAi: true,
    tagline: '静心思考，耐心整理！',
    prompt: '我们三人是一个团队，多沟通多分享，一定能找到所有材料！'
  }
];

// 三种固定职责角色
var ROLES = ['聆听员', '记录员', '报告员'];

/**
 * Web App 入口：支持嵌入 Google Sites 必须设置 ALLOWALL
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  template.appUrl = ScriptApp.getService().getUrl();
  return template.evaluate()
    .setTitle('三人艺术工作室 · 随机匹配系统')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

/**
 * 辅助函数：初始化工作表结构（首次运行可直接执行此函数建表）
 */
function setupSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Waiting_Queue 工作表
  var sheetQueue = ss.getSheetByName('Waiting_Queue') || ss.insertSheet('Waiting_Queue');
  sheetQueue.clear();
  sheetQueue.appendRow(['student_id', 'nickname', 'class_code', 'joined_at', 'last_heartbeat', 'status', 'group_id']);
  sheetQueue.setFrozenRows(1);

  // 2. Groups 工作表
  var sheetGroups = ss.getSheetByName('Groups') || ss.insertSheet('Groups');
  sheetGroups.clear();
  sheetGroups.appendRow(['group_id', 'class_code', 'created_at', 'human_count', 'ai_count', 'status']);
  sheetGroups.setFrozenRows(1);

  // 3. Group_Members 工作表
  var sheetMembers = ss.getSheetByName('Group_Members') || ss.insertSheet('Group_Members');
  sheetMembers.clear();
  sheetMembers.appendRow(['group_id', 'student_id', 'nickname', 'member_type', 'role', 'avatar', 'joined_at']);
  sheetMembers.setFrozenRows(1);

  Logger.log('三张工作表结构创建完毕！');
}

/**
 * 核心接口 1：学生加入等待队列
 * @param {string} nickname 学习昵称 (无需真实姓名)
 * @param {string} classCode 班级代码 (如 1A, 1B)
 * @param {string} studentId 学生本地存储的匿名识别码 (若有)
 */
function apiJoinQueue(nickname, classCode, studentId) {
  var lock = LockService.getScriptLock();
  try {
    // 等待锁最多 15 秒，防止并发冲突
    lock.waitLock(15000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetQueue = ss.getSheetByName('Waiting_Queue') || ss.insertSheet('Waiting_Queue');
    var now = new Date().getTime();

    // 格式化与清洗入参
    var safeNickname = (nickname || '小探险家').toString().trim().slice(0, 15);
    var safeClassCode = (classCode || '1A').toString().trim().toUpperCase().slice(0, 10);
    var safeStudentId = studentId ? studentId.toString().trim() : ('stu_' + now + '_' + Math.floor(Math.random() * 10000));

    // 1. 检查该学生是否已经在已形成的小组中 (防止一人多组、处理刷新)
    var existingGroup = findGroupByStudentId(safeStudentId);
    if (existingGroup) {
      return {
        success: true,
        status: 'MATCHED',
        studentId: safeStudentId,
        group: existingGroup
      };
    }

    // 2. 检查该学生是否已经在等待队列中
    var queueData = sheetQueue.getDataRange().getValues();
    var existingRowIndex = -1;
    var existingJoinedAt = now;

    for (var i = 1; i < queueData.length; i++) {
      var rowId = queueData[i][0];
      var rowStatus = queueData[i][5];
      var rowClass = queueData[i][2];

      if (rowId === safeStudentId) {
        if (rowStatus === 'WAITING' && rowClass === safeClassCode) {
          existingRowIndex = i + 1; // 1-indexed in Sheets
          existingJoinedAt = Number(queueData[i][3]) || now;
          break;
        } else if (rowStatus === 'MATCHED') {
          var assignedGroupId = queueData[i][6];
          var gData = getGroupDetails(assignedGroupId);
          if (gData) {
            return {
              success: true,
              status: 'MATCHED',
              studentId: safeStudentId,
              group: gData
            };
          }
        }
      }
    }

    // 若已在队列中，更新心跳时间；若不在，追加新纪录
    if (existingRowIndex > 0) {
      sheetQueue.getRange(existingRowIndex, 5).setValue(now); // 更新 last_heartbeat
    } else {
      sheetQueue.appendRow([safeStudentId, safeNickname, safeClassCode, now, now, 'WAITING', '']);
      existingJoinedAt = now;
    }

    // 尝试立刻执行一次匹配判定 (真人优先或超时处理)
    var matchResult = evaluateMatchmaking(safeClassCode, ss);
    if (matchResult && matchResult.isMatched && matchResult.studentIds.indexOf(safeStudentId) !== -1) {
      return {
        success: true,
        status: 'MATCHED',
        studentId: safeStudentId,
        group: matchResult.group
      };
    }

    // 仍在等待中
    var elapsed = Math.floor((now - existingJoinedAt) / 1000);
    var remaining = Math.max(0, 30 - elapsed);
    var currentWaitingCount = countActiveWaiting(safeClassCode, sheetQueue);

    return {
      success: true,
      status: 'WAITING',
      studentId: safeStudentId,
      nickname: safeNickname,
      classCode: safeClassCode,
      joinedAt: existingJoinedAt,
      serverTime: now,
      elapsedSeconds: elapsed,
      remainingSeconds: remaining,
      waitingCount: currentWaitingCount
    };

  } catch (err) {
    Logger.log('apiJoinQueue 错误: ' + err);
    return { success: false, error: '系统繁忙，请稍候再试：' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 核心接口 2：前端轮询检查匹配状态与心跳
 * @param {string} studentId 学生匿名 ID
 * @param {string} classCode 班级代码
 */
function apiPollMatchStatus(studentId, classCode) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetQueue = ss.getSheetByName('Waiting_Queue');
    if (!sheetQueue) {
      return { success: false, error: '工作表未就绪' };
    }

    var now = new Date().getTime();
    var queueData = sheetQueue.getDataRange().getValues();
    var myRowIndex = -1;
    var myJoinedAt = now;
    var myStatus = 'NOT_FOUND';
    var myGroupId = '';

    for (var i = 1; i < queueData.length; i++) {
      if (queueData[i][0] === studentId) {
        myRowIndex = i + 1;
        myJoinedAt = Number(queueData[i][3]) || now;
        myStatus = queueData[i][5];
        myGroupId = queueData[i][6];
        break;
      }
    }

    // 若记录不存在或已被取消
    if (myRowIndex === -1 || myStatus === 'CANCELLED') {
      return { success: true, status: 'CANCELLED' };
    }

    // 若已经完成匹配
    if (myStatus === 'MATCHED' && myGroupId) {
      var groupInfo = getGroupDetails(myGroupId);
      if (groupInfo) {
        return {
          success: true,
          status: 'MATCHED',
          studentId: studentId,
          group: groupInfo
        };
      }
    }

    // 更新当前学生心跳
    sheetQueue.getRange(myRowIndex, 5).setValue(now);

    // 检查并执行匹配逻辑 (30秒超时检查 / 3真人立成)
    var matchResult = evaluateMatchmaking(classCode, ss);
    if (matchResult && matchResult.isMatched && matchResult.studentIds.indexOf(studentId) !== -1) {
      return {
        success: true,
        status: 'MATCHED',
        studentId: studentId,
        group: matchResult.group
      };
    }

    // 计算真实的后台已等待秒数与剩余倒计时
    var elapsedSeconds = Math.floor((now - myJoinedAt) / 1000);
    var remainingSeconds = Math.max(0, 30 - elapsedSeconds);
    var currentWaitingCount = countActiveWaiting(classCode, sheetQueue);

    return {
      success: true,
      status: 'WAITING',
      studentId: studentId,
      serverTime: now,
      elapsedSeconds: elapsedSeconds,
      remainingSeconds: remainingSeconds,
      waitingCount: currentWaitingCount
    };

  } catch (err) {
    Logger.log('apiPollMatchStatus 错误: ' + err);
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 核心接口 3：学生主动取消等待
 */
function apiCancelQueue(studentId) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetQueue = ss.getSheetByName('Waiting_Queue');
    if (!sheetQueue) return { success: true };

    var data = sheetQueue.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === studentId && data[i][5] === 'WAITING') {
        sheetQueue.getRange(i + 1, 6).setValue('CANCELLED');
        break;
      }
    }
    return { success: true, status: 'CANCELLED' };
  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 内部核心匹配逻辑：真人优先与 30 秒后台时间到时 AI 自动补位
 * @param {string} targetClass 班级代码
 * @param {Spreadsheet} ss 工作表对象
 */
function evaluateMatchmaking(targetClass, ss) {
  var sheetQueue = ss.getSheetByName('Waiting_Queue');
  var sheetGroups = ss.getSheetByName('Groups');
  var sheetMembers = ss.getSheetByName('Group_Members');

  var now = new Date().getTime();
  var queueData = sheetQueue.getDataRange().getValues();

  // 1. 筛选出当前班级且状态为 WAITING 且 60 秒内有心跳的真人学生
  var waitingList = [];
  for (var i = 1; i < queueData.length; i++) {
    var sId = queueData[i][0];
    var sName = queueData[i][1];
    var sClass = queueData[i][2];
    var sJoinedAt = Number(queueData[i][3]) || now;
    var sHeartbeat = Number(queueData[i][4]) || now;
    var sStatus = queueData[i][5];

    // 若超过 60 秒无心跳，视为断线异常退出，自动标记 EXPIRED
    if (sStatus === 'WAITING' && (now - sHeartbeat > 60000)) {
      sheetQueue.getRange(i + 1, 6).setValue('EXPIRED');
      continue;
    }

    if (sStatus === 'WAITING' && sClass === targetClass) {
      waitingList.push({
        rowIndex: i + 1,
        studentId: sId,
        nickname: sName,
        classCode: sClass,
        joinedAt: sJoinedAt,
        waitDuration: now - sJoinedAt
      });
    }
  }

  if (waitingList.length === 0) {
    return null;
  }

  // 按进入队列的时间先后排序（最早进入的排在最前）
  waitingList.sort(function(a, b) {
    return a.joinedAt - b.joinedAt;
  });

  var matchedHumans = [];
  var neededAiCount = 0;

  // 规则 A：队列中有 >= 3 名真人 -> 立即组成三人真人小组 (不加 AI)
  if (waitingList.length >= 3) {
    // 随机或者按顺序选出 3 名真人学生
    // 满足题目要求：“当队列中至少三名时，随机抽选三人组成小组，其余继续等待”
    var pool = waitingList.slice();
    while (matchedHumans.length < 3 && pool.length > 0) {
      var randIdx = Math.floor(Math.random() * pool.length);
      matchedHumans.push(pool.splice(randIdx, 1)[0]);
    }
    neededAiCount = 0;
  } else {
    // 规则 B：真人不足 3 名，检查最早等待的学生是否已满 30 秒 (30000 毫秒)
    var oldestWait = waitingList[0];
    if (oldestWait.waitDuration >= 30000) {
      // 触发 AI 补位机制！
      if (waitingList.length === 2) {
        // 2 名真人 + 1 名 AI
        matchedHumans = [waitingList[0], waitingList[1]];
        neededAiCount = 1;
      } else if (waitingList.length === 1) {
        // 1 名真人 + 2 名 AI
        matchedHumans = [waitingList[0]];
        neededAiCount = 2;
      }
    } else {
      // 未达到 30 秒且真人不足 3 人，继续保持等待状态
      return null;
    }
  }

  // 确认成团，创建小组
  if (matchedHumans.length + neededAiCount === 3) {
    var groupId = 'GRP_' + targetClass + '_' + now + '_' + Math.floor(Math.random() * 1000);

    // 1. 写入 Groups 表
    sheetGroups.appendRow([
      groupId,
      targetClass,
      new Date(now).toISOString(),
      matchedHumans.length,
      neededAiCount,
      'FORMED'
    ]);

    // 2. 准备角色分配与成员信息
    // 角色打乱分配
    var shuffledRoles = ROLES.slice();
    shuffleArray(shuffledRoles);

    var groupMembers = [];
    var matchedStudentIds = [];

    // 分配真人
    for (var h = 0; h < matchedHumans.length; h++) {
      var human = matchedHumans[h];
      var role = shuffledRoles[h];
      var avatar = '🦁'; // 默认生动真人学生头像

      sheetMembers.appendRow([
        groupId,
        human.studentId,
        human.nickname,
        'HUMAN',
        role,
        avatar,
        new Date(now).toISOString()
      ]);

      // 更新 Waiting_Queue 中该真人的状态为 MATCHED 与 groupId
      sheetQueue.getRange(human.rowIndex, 6).setValue('MATCHED');
      sheetQueue.getRange(human.rowIndex, 7).setValue(groupId);

      matchedStudentIds.push(human.studentId);
      groupMembers.push({
        studentId: human.studentId,
        nickname: human.nickname,
        memberType: 'HUMAN',
        role: role,
        avatar: avatar,
        isAi: false
      });
    }

    // 分配 AI 队友 (如果有)
    if (neededAiCount > 0) {
      var aiPool = AI_ROSTER.slice();
      shuffleArray(aiPool);

      for (var a = 0; a < neededAiCount; a++) {
        var aiCandidate = aiPool[a];
        var aiRole = shuffledRoles[matchedHumans.length + a];

        sheetMembers.appendRow([
          groupId,
          aiCandidate.id,
          aiCandidate.nickname,
          'AI',
          aiRole,
          aiCandidate.avatar,
          new Date(now).toISOString()
        ]);

        groupMembers.push({
          studentId: aiCandidate.id,
          nickname: aiCandidate.nickname,
          memberType: 'AI',
          role: aiRole,
          avatar: aiCandidate.avatar,
          isAi: true,
          tagline: aiCandidate.tagline,
          prompt: aiCandidate.prompt
        });
      }
    }

    var groupResult = {
      groupId: groupId,
      classCode: targetClass,
      humanCount: matchedHumans.length,
      aiCount: neededAiCount,
      members: groupMembers,
      createdAt: now
    };

    return {
      isMatched: true,
      studentIds: matchedStudentIds,
      group: groupResult
    };
  }

  return null;
}

/**
 * 辅助：根据 groupId 获取完整组及成员数据
 */
function getGroupDetails(groupId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetGroups = ss.getSheetByName('Groups');
  var sheetMembers = ss.getSheetByName('Group_Members');
  if (!sheetGroups || !sheetMembers) return null;

  var groupsData = sheetGroups.getDataRange().getValues();
  var targetGroup = null;
  for (var i = 1; i < groupsData.length; i++) {
    if (groupsData[i][0] === groupId) {
      targetGroup = {
        groupId: groupsData[i][0],
        classCode: groupsData[i][1],
        createdAt: groupsData[i][2],
        humanCount: groupsData[i][3],
        aiCount: groupsData[i][4],
        status: groupsData[i][5]
      };
      break;
    }
  }

  if (!targetGroup) return null;

  var membersData = sheetMembers.getDataRange().getValues();
  var members = [];
  for (var j = 1; j < membersData.length; j++) {
    if (membersData[j][0] === groupId) {
      var mType = membersData[j][3];
      var isAi = (mType === 'AI');
      var mId = membersData[j][1];

      // 附加 AI 预设专属提示语
      var prompt = '';
      var tagline = '';
      if (isAi) {
        for (var k = 0; k < AI_ROSTER.length; k++) {
          if (AI_ROSTER[k].id === mId) {
            prompt = AI_ROSTER[k].prompt;
            tagline = AI_ROSTER[k].tagline;
            break;
          }
        }
      }

      members.push({
        studentId: mId,
        nickname: membersData[j][2],
        memberType: mType,
        role: membersData[j][4],
        avatar: membersData[j][5],
        isAi: isAi,
        tagline: tagline,
        prompt: prompt
      });
    }
  }

  targetGroup.members = members;
  return targetGroup;
}

/**
 * 辅助：查询指定学生是否已在成团小组中
 */
function findGroupByStudentId(studentId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetMembers = ss.getSheetByName('Group_Members');
  if (!sheetMembers) return null;

  var data = sheetMembers.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === studentId) {
      var gId = data[i][0];
      return getGroupDetails(gId);
    }
  }
  return null;
}

/**
 * 辅助：统计某班当前有效等待人数
 */
function countActiveWaiting(classCode, sheetQueue) {
  var data = sheetQueue.getDataRange().getValues();
  var count = 0;
  var now = new Date().getTime();
  for (var i = 1; i < data.length; i++) {
    if (data[i][2] === classCode && data[i][5] === 'WAITING' && (now - Number(data[i][4]) <= 60000)) {
      count++;
    }
  }
  return count;
}

/**
 * 辅助数组洗牌
 */
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}
