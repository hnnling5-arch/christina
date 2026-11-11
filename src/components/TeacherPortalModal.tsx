import React, { useState } from 'react';
import { storageService } from '../services/storage';
import { audioService } from '../services/audio';
import { RUBRIC_CRITERIA, CLASS_OPTIONS } from '../data/constants';
import { TeacherEvaluation, AppSettings } from '../types';
import {
  ShieldAlert,
  Lock,
  Unlock,
  X,
  FileSpreadsheet,
  RotateCcw,
  Save,
  CheckCircle2,
  Users,
  Settings,
  ClipboardList,
  Edit,
  UserPlus,
  Trash2,
  Clock,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface TeacherPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const TeacherPortalModal: React.FC<TeacherPortalModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'evaluations' | 'teams' | 'matchmaking' | 'settings'>('evaluations');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');

  // Matchmaking & Manual Grouping State
  const [manualTeamName, setManualTeamName] = useState<string>('小画师协作组');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [groupSuccessMessage, setGroupSuccessMessage] = useState<string>('');
  const [, setRerenderTrigger] = useState(0);

  // Sync when queue or teams update across tabs or local storage
  React.useEffect(() => {
    const handleUpdate = () => {
      setRerenderTrigger((prev) => prev + 1);
    };
    window.addEventListener('lost_art_match_event', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('lost_art_match_event', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Selected student evaluation modal
  const [editingStudent, setEditingStudent] = useState<TeacherEvaluation | null>(null);

  // Settings edit state
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default teacher passcode: cikar123 or admin888
    if (password === 'cikar123' || password === 'admin888') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('口令不正确，请输入教师专属访问口令 (默认：cikar123)');
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings({
      ...settings,
      updatedAt: new Date().toISOString(),
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleSaveStudentEvaluation = (evalData: TeacherEvaluation) => {
    storageService.saveEvaluation(evalData);
    setEditingStudent(null);
    if (onRefreshData) onRefreshData();
  };

  const handleExportCSV = () => {
    const evals = storageService.getEvaluations(selectedClass);
    const leaders = storageService.getLeaderboard(undefined, selectedClass);

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent +=
      '学生编号(匿名ID),游戏昵称,班级,模式,安静聆听(1-5),边听边记(1-5),边听边想(1-5),内容理解(1-5),四样用品(1-5),适当回应(1-5),口头表达(1-5),总积分,教师评语\n';

    leaders.forEach((l) => {
      const ev = evals.find((e) => e.studentId === l.studentId);
      const row = [
        l.studentId,
        `"${l.nickname}"`,
        l.classCode,
        l.mode,
        ev?.quietListening || '未评',
        ev?.noteTaking || '未评',
        ev?.reflectiveThinking || '未评',
        ev?.contentComprehension || '未评',
        ev?.fourMaterials || '未评',
        ev?.appropriateResponse || '未评',
        ev?.oralExpression || '未评',
        l.score,
        `"${ev?.teacherRemarks || '学习态度端正，积极参与'}"`,
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `SP1.2.1_华小华文听力成绩报告_${selectedClass}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetData = () => {
    if (window.confirm('确定要重置测试数据为初始演示状态吗？这会恢复预设榜单和作品。')) {
      storageService.resetDemoData();
      if (onRefreshData) onRefreshData();
      alert('演示数据已重置完成！');
    }
  };

  const handleManualCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length < 2 || selectedStudentIds.length > 4) {
      alert('请选择 2 至 4 名学生进行分组（标准配置为 3 名学生）');
      return;
    }
    const targetClass = selectedClass === 'ALL' ? '1A' : selectedClass;
    const studentsToGroup = allLeaderboard
      .filter((s) => selectedStudentIds.includes(s.studentId))
      .map((s) => ({
        anonymousId: s.studentId,
        nickname: s.nickname,
        avatarId: s.avatarId,
        classCode: s.classCode,
        mode: s.mode,
        createdAt: s.updatedAt,
      }));

    // In case any selected student is in the waiting queue and not yet in leaderboard
    waitingQueue.forEach((wq) => {
      if (
        selectedStudentIds.includes(wq.anonymousId) &&
        !studentsToGroup.some((st) => st.anonymousId === wq.anonymousId)
      ) {
        studentsToGroup.push(wq);
      }
    });

    const newTeam = storageService.manualCreateTeam(
      studentsToGroup,
      manualTeamName.trim() || `华小拼贴第 ${allTeams.length + 1} 组`,
      targetClass
    );

    setSelectedStudentIds([]);
    setGroupSuccessMessage(
      `✓ 成功为「${studentsToGroup.map((s) => s.nickname).join('、')}」建立三人小组「${newTeam.title}」！已自动通知学生端画室。`
    );
    setTimeout(() => setGroupSuccessMessage(''), 6000);
    if (onRefreshData) onRefreshData();
  };

  const handleDissolveTeam = (teamId: string, teamClass: string) => {
    if (window.confirm('确定要解散该协作小组吗？解散后小组成员可以重新进入等待队列匹配。')) {
      storageService.dissolveTeam(teamId, teamClass);
      if (onRefreshData) onRefreshData();
    }
  };

  const handleRemoveFromQueue = (studentId: string, classCode: string) => {
    storageService.leaveMatchmakingQueue(studentId, classCode);
    if (onRefreshData) onRefreshData();
  };

  const handleAutoPairWaitingQueue = () => {
    if (waitingQueue.length < 3) return;
    const targetClass = selectedClass === 'ALL' ? waitingQueue[0].classCode : selectedClass;
    const candidates = waitingQueue.slice(0, 3);
    const newTeam = storageService.manualCreateTeam(
      candidates,
      `快速成组第 ${allTeams.length + 1} 组`,
      targetClass
    );
    setGroupSuccessMessage(
      `✓ 已将等待队列中的「${candidates.map((s) => s.nickname).join('、')}」自动配对成组并通知学生！`
    );
    setTimeout(() => setGroupSuccessMessage(''), 6000);
    if (onRefreshData) onRefreshData();
  };

  const allTeams = storageService.getTeamProjects(selectedClass);
  const allLeaderboard = storageService.getLeaderboard(undefined, selectedClass);
  const allEvaluations = storageService.getEvaluations(selectedClass);
  const waitingQueue = storageService.getMatchmakingQueue(selectedClass);

  // Identify students currently locked in a team
  const studentTeamMap = new Map<string, string>();
  allTeams.forEach((t) => {
    t.members.forEach((m) => {
      studentTeamMap.set(m.anonymousId, t.title);
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FFF5E5] border-4 border-[#263D64]/20 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#263D64]/10 pb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#263D64]" />
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#263D64]">
                教师专业教学管理与评估后台
              </h2>
              <div className="text-xs text-[#263D64]/60">华小华文 SP 1.2.1 学习标准证据评估</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white hover:bg-slate-100 text-[#263D64] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Gate */}
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="max-w-md mx-auto py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-white border-2 border-[#263D64]/15 mx-auto flex items-center justify-center text-3xl shadow-xs">
              <Lock className="w-8 h-8 text-[#263D64]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#263D64]">教师身份权限验证</h3>
              <p className="text-xs text-[#263D64]/70 mt-1">
                请输入教师访问安全口令（演示体验默认口令：<code className="font-mono bg-white px-1.5 py-0.5 rounded text-amber-700">cikar123</code>）
              </p>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入访问口令"
              className="w-full px-4 py-3 bg-white rounded-2xl border-2 border-[#263D64]/20 text-[#263D64] font-bold text-center text-lg focus:outline-hidden focus:border-[#263D64]"
            />
            {authError && <p className="text-xs font-bold text-rose-600">{authError}</p>}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#263D64] text-white font-black text-sm hover:bg-[#263D64]/90 shadow-md transition-all"
            >
              验证登入
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Navigation Tabs & Class Selector */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex p-1 bg-white rounded-xl border border-[#263D64]/10 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('evaluations')}
                  className={`px-3 py-1.5 rounded-lg ${
                    activeTab === 'evaluations'
                      ? 'bg-[#263D64] text-white font-black'
                      : 'text-[#263D64]/70 hover:text-[#263D64]'
                  }`}
                >
                  学生学习证据与评估 ({allLeaderboard.length})
                </button>
                <button
                  onClick={() => setActiveTab('teams')}
                  className={`px-3 py-1.5 rounded-lg ${
                    activeTab === 'teams'
                      ? 'bg-[#263D64] text-white font-black'
                      : 'text-[#263D64]/70 hover:text-[#263D64]'
                  }`}
                >
                  小组拼贴杰作 ({allTeams.length})
                </button>
                <button
                  onClick={() => setActiveTab('matchmaking')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                    activeTab === 'matchmaking'
                      ? 'bg-[#263D64] text-white font-black'
                      : 'text-[#263D64]/70 hover:text-[#263D64]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>三人匹配与备用分组</span>
                  {waitingQueue.length > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                      {waitingQueue.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-3 py-1.5 rounded-lg ${
                    activeTab === 'settings'
                      ? 'bg-[#263D64] text-white font-black'
                      : 'text-[#263D64]/70 hover:text-[#263D64]'
                  }`}
                >
                  教学媒体配置
                </button>
              </div>

              {/* Class Filter */}
              <div className="flex items-center gap-2 text-xs font-bold text-[#263D64]">
                <span>班级：</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-[#263D64]/20 font-bold"
                >
                  <option value="ALL">全部班级</option>
                  {CLASS_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c} 班
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* TAB 1: Evaluations */}
            {activeTab === 'evaluations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[#263D64]/70">
                    依据标准 1.2.1 针对 7 项维度进行专业观察评分（不依靠单一答题分数判断学生态度）。
                  </div>
                  <button
                    onClick={handleExportCSV}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>导出成绩报告 (CSV)</span>
                  </button>
                </div>

                <div className="storybook-card rounded-2xl overflow-hidden bg-white max-h-[360px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#FFF5E5] border-b border-[#263D64]/10 font-black text-[#263D64]">
                        <th className="py-2.5 px-3">寻宝员昵称</th>
                        <th className="py-2.5 px-3 text-center">班级</th>
                        <th className="py-2.5 px-3 text-center">模式</th>
                        <th className="py-2.5 px-3 text-center">安静聆听</th>
                        <th className="py-2.5 px-3 text-center">边听边记</th>
                        <th className="py-2.5 px-3 text-center">口头表达</th>
                        <th className="py-2.5 px-3 text-right">总分</th>
                        <th className="py-2.5 px-3 text-center">教师评量</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#263D64]/10 font-bold">
                      {allLeaderboard.map((item) => {
                        const evalItem = allEvaluations.find((e) => e.studentId === item.studentId);
                        return (
                          <tr key={item.studentId} className="hover:bg-amber-50">
                            <td className="py-2.5 px-3 font-black text-[#263D64]">{item.nickname}</td>
                            <td className="py-2.5 px-3 text-center">{item.classCode}</td>
                            <td className="py-2.5 px-3 text-center">{item.mode}</td>
                            <td className="py-2.5 px-3 text-center">
                              {evalItem ? `${evalItem.quietListening} ⭐` : '未评'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {evalItem ? `${evalItem.noteTaking} ⭐` : '未评'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {evalItem ? `${evalItem.oralExpression} ⭐` : '未评'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#F28C75]">
                              {item.score}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() =>
                                  setEditingStudent(
                                    evalItem || {
                                      studentId: item.studentId,
                                      classCode: item.classCode,
                                      nickname: item.nickname,
                                      mode: item.mode,
                                      quietListening: 4,
                                      noteTaking: 4,
                                      reflectiveThinking: 4,
                                      contentComprehension: 4,
                                      fourMaterials: 4,
                                      appropriateResponse: 4,
                                      oralExpression: 4,
                                      teacherRemarks: '聆听专注，能听懂四样用品重点。',
                                      gradedAt: new Date().toISOString(),
                                    }
                                  )
                                }
                                className="px-2 py-1 rounded-md bg-[#FFF5E5] border border-[#263D64]/20 hover:bg-[#F4C66A] text-[10px] font-black text-[#263D64]"
                              >
                                {evalItem ? '修改量表' : '评量打分'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: Teams */}
            {activeTab === 'teams' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto">
                  {allTeams.map((team) => (
                    <div
                      key={team.teamId}
                      className="p-4 rounded-2xl bg-white border-2 border-[#263D64]/10 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-[#263D64]">{team.title}</h4>
                        <span className="text-[10px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded-md font-bold">
                          班级 {team.classCode}
                        </span>
                      </div>
                      <div className="text-xs text-[#263D64]/70">
                        小组成员: {team.members.map((m) => m.nickname).join('、')}
                      </div>
                      <div className="text-xs text-[#263D64]/60">
                        拼贴元素数: {team.elements.length} 个材料组件
                      </div>
                      <div className="p-2 bg-[#FFF5E5] rounded-xl text-[11px] text-[#263D64] font-medium">
                        状态: {team.status === 'submitted' ? '✓ 已正式揭幕参展' : '创作草稿中'}
                      </div>
                    </div>
                  ))}
                  {allTeams.length === 0 && (
                    <div className="col-span-2 text-center py-10 text-xs text-[#263D64]/60">
                      该班级暂未生成小组拼贴杰作。
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: Matchmaking & Manual Grouping (Fallback System) */}
            {activeTab === 'matchmaking' && (
              <div className="space-y-6 max-h-[460px] overflow-y-auto pr-1">
                {groupSuccessMessage && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{groupSuccessMessage}</span>
                  </div>
                )}

                {/* Section 1: Live Queue Monitoring */}
                <div className="p-4 rounded-2xl bg-white border-2 border-[#263D64]/10 space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#263D64]/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <h3 className="text-sm font-black text-[#263D64]">
                        实时匹配队列监控 ({waitingQueue.length} 人在线等待)
                      </h3>
                    </div>
                    {waitingQueue.length >= 3 && (
                      <button
                        onClick={handleAutoPairWaitingQueue}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>一键为前 3 名等待学生组队</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-[#263D64]/70">
                    学生在关卡五点击「寻找队友」后将进入队列，当凑齐 3 人时系统自动原子成组。教师可在此实时监控各班排队状态。
                  </p>

                  {waitingQueue.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                      {waitingQueue.map((wq, idx) => (
                        <div
                          key={wq.anonymousId}
                          className="p-3 rounded-xl bg-[#FFF5E5] border border-[#263D64]/15 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-white text-[#263D64] font-black text-xs flex items-center justify-center shrink-0 border">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-black text-[#263D64] truncate">
                                {wq.nickname}
                              </div>
                              <div className="text-[10px] text-[#263D64]/60">
                                班级 {wq.classCode} · {wq.mode}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFromQueue(wq.anonymousId, wq.classCode)}
                            title="移出等待队列"
                            className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#FFF5E5]/50 border border-dashed border-[#263D64]/20 text-center text-xs text-[#263D64]/60">
                      当前队列暂无等待中的学生。当学生在画室点击「寻找队友」时，名单将实时同步显示在此处。
                    </div>
                  )}
                </div>

                {/* Section 2: Teacher Manual Grouping Tool (Fallback Feature) */}
                <form
                  onSubmit={handleManualCreateTeam}
                  className="p-4 rounded-2xl bg-white border-2 border-[#263D64]/10 space-y-4 shadow-xs"
                >
                  <div className="border-b border-[#263D64]/10 pb-2">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-[#263D64]" />
                      <h3 className="text-sm font-black text-[#263D64]">
                        教师手动分组功能（三人拼贴画备用通道）
                      </h3>
                    </div>
                    <p className="text-[11px] text-[#263D64]/70 mt-1">
                      针对等待人数不足、网络断开重组、或教学调配需求，教师可手动挑选 2~4 名学生（推荐 3 人）强制组成小组，学生端将立即自动进入画室。
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-black text-[#263D64] block mb-1">
                        自定义小组名称：
                      </label>
                      <input
                        type="text"
                        value={manualTeamName}
                        onChange={(e) => setManualTeamName(e.target.value)}
                        placeholder="例如：彩虹阳光三人组"
                        className="w-full px-3 py-2 bg-[#FFF5E5]/60 rounded-xl border border-[#263D64]/20 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-[#263D64] block mb-1">
                        小组状态与配额：
                      </label>
                      <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center justify-between">
                        <span>当前已挑选：</span>
                        <span className="font-black text-[#263D64]">
                          {selectedStudentIds.length} / 3 名学生
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Student Candidate Selection Grid */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-[#263D64] block">
                      选择要分入该组的学生（可选择等待中或已登录的学生）：
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[180px] overflow-y-auto p-2 rounded-xl bg-[#FFF5E5]/40 border border-[#263D64]/15">
                      {allLeaderboard.map((student) => {
                        const isSelected = selectedStudentIds.includes(student.studentId);
                        const existingTeam = studentTeamMap.get(student.studentId);
                        const isInQueue = waitingQueue.some((q) => q.anonymousId === student.studentId);

                        return (
                          <label
                            key={student.studentId}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#263D64] text-white border-[#263D64]'
                                : existingTeam
                                ? 'bg-slate-100/80 text-slate-400 border-slate-200'
                                : 'bg-white text-[#263D64] border-[#263D64]/15 hover:border-[#263D64]/40'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={!!existingTeam && !isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (selectedStudentIds.length >= 3) {
                                    alert('标准三人合作小组最多挑选 3 名学生！');
                                    return;
                                  }
                                  setSelectedStudentIds([...selectedStudentIds, student.studentId]);
                                } else {
                                  setSelectedStudentIds(
                                    selectedStudentIds.filter((id) => id !== student.studentId)
                                  );
                                }
                              }}
                              className="rounded text-[#263D64] focus:ring-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-black">{student.nickname}</div>
                              <div className="text-[10px] opacity-75">
                                {student.classCode} 班 · {student.mode}
                                {isInQueue && ' (⏳队列等待中)'}
                                {existingTeam && ` (已在:${existingTeam})`}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                      {allLeaderboard.length === 0 && (
                        <div className="col-span-3 text-center py-4 text-xs text-[#263D64]/60">
                          暂无学生记录，请等待学生进入游戏后在此刷新。
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIds([])}
                      className="text-xs text-[#263D64]/60 hover:text-[#263D64] underline"
                    >
                      清空挑选
                    </button>
                    <button
                      type="submit"
                      disabled={selectedStudentIds.length < 2 || selectedStudentIds.length > 4}
                      className="px-5 py-2.5 rounded-xl bg-[#263D64] disabled:bg-slate-300 text-white font-black text-xs hover:bg-[#263D64]/90 flex items-center gap-1.5 shadow-xs transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>确认成立三人小组并立即推送</span>
                    </button>
                  </div>
                </form>

                {/* Section 3: Existing Teams & Dissolve action */}
                <div className="p-4 rounded-2xl bg-white border-2 border-[#263D64]/10 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#263D64]/10 pb-2">
                    <h3 className="text-sm font-black text-[#263D64]">
                      当前班级已组建的小组 ({allTeams.length} 组)
                    </h3>
                    <span className="text-[11px] text-[#263D64]/60">
                      支持解散重配以释放成员
                    </span>
                  </div>

                  <div className="space-y-2">
                    {allTeams.map((t) => (
                      <div
                        key={t.teamId}
                        className="p-3 rounded-xl bg-[#FFF5E5]/60 border border-[#263D64]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-[#263D64]">{t.title}</span>
                            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">
                              {t.classCode} 班
                            </span>
                          </div>
                          <div className="text-[11px] text-[#263D64]/70">
                            成员：{t.members.map((m) => m.nickname).join('、')} (共 {t.elements.length} 个贴图材料)
                          </div>
                        </div>
                        <button
                          onClick={() => handleDissolveTeam(t.teamId, t.classCode)}
                          className="px-2.5 py-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 self-start sm:self-center transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>解散并允许重匹</span>
                        </button>
                      </div>
                    ))}
                    {allTeams.length === 0 && (
                      <div className="text-center py-4 text-xs text-[#263D64]/60">
                        当前班级尚未组建任何小组。
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Settings */}
            {activeTab === 'settings' && (
              <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl mx-auto">
                <div className="space-y-3 bg-[#FFF5E5] p-4 rounded-2xl border border-[#263D64]/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#263D64] flex items-center gap-1.5">
                      <span>🎧 教师口头通知 MP3 音频状态</span>
                    </span>
                    <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      已挂载正式录音
                    </span>
                  </div>
                  <div className="text-xs text-[#263D64]/70 leading-relaxed">
                    当前使用的录音文件为正式听力刺激材料（SP 1.2.1）。根据教学评估规范，全站严格禁止向学生展示任何文本录音稿，确保学生必须通过实际聆听获取信息。
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => audioService.playTeacherNotice()}
                      className="px-4 py-2 rounded-xl bg-[#F4C66A] hover:bg-[#F4C66A]/90 text-[#263D64] font-black text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <span>▶️ 试听教师通知 MP3</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => audioService.stop()}
                      className="px-3 py-2 rounded-xl bg-white border border-[#263D64]/20 hover:bg-rose-50 text-[#263D64] font-bold text-xs cursor-pointer"
                    >
                      <span>停止</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-[#263D64]">
                    YouTube 拼贴画延伸微课视频链接或 ID：
                  </label>
                  <input
                    type="text"
                    value={settings.youtubeVideoUrl}
                    onChange={(e) => setSettings({ ...settings, youtubeVideoUrl: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#263D64]/20 text-xs font-medium"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleResetData}
                    className="text-xs text-[#F28C75] hover:underline flex items-center gap-1 font-bold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>重置测试数据</span>
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#263D64] text-white font-black text-xs hover:bg-[#263D64]/90 flex items-center gap-1.5 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{settingsSaved ? '已保存设置！' : '保存配置'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Modal for Editing Rubric of a Specific Student */}
        {editingStudent && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full border-2 border-[#263D64]/20 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="text-base font-black text-[#263D64]">
                    评量学生：{editingStudent.nickname}（班级 {editingStudent.classCode}）
                  </h3>
                  <div className="text-xs text-[#263D64]/60">SP 1.2.1 七大维度表现性量规打分</div>
                </div>
                <button onClick={() => setEditingStudent(null)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {RUBRIC_CRITERIA.map((crit) => (
                  <div key={crit.key} className="p-2.5 bg-[#FFF5E5]/60 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs font-black text-[#263D64]">
                      <span>{crit.label}</span>
                      <span className="text-amber-700">
                        {(editingStudent as any)[crit.key]} / 5 分
                      </span>
                    </div>
                    <div className="text-[11px] text-[#263D64]/65">{crit.desc}</div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={(editingStudent as any)[crit.key] || 4}
                      onChange={(e) =>
                        setEditingStudent({
                          ...editingStudent,
                          [crit.key]: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-[#263D64] cursor-pointer"
                    />
                  </div>
                ))}

                <div className="space-y-1">
                  <label className="text-xs font-black text-[#263D64]">教师综合观察评语：</label>
                  <textarea
                    value={editingStudent.teacherRemarks}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, teacherRemarks: e.target.value })
                    }
                    rows={2}
                    className="w-full p-2.5 border rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveStudentEvaluation(editingStudent)}
                  className="px-5 py-2 rounded-xl bg-[#263D64] text-white text-xs font-black"
                >
                  保存评量记录
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
