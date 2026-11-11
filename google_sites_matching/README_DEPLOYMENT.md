# 《校园艺术展：美术用品大搜查》三人随机匹配系统
## Google Sites + Google Apps Script + Google Sheets 完整部署与测试指南

本文档提供**真人优先、30秒后台判定超时、AI自动补位**的三人随机匹配系统的完整技术规格、数据结构、部署指南与 9 大测试用例。

---

## 一、Google Sheets 数据表结构

在你的 Google Drive 中新建一个 Google 电子表格（例如命名为 `《校园艺术展》随机匹配数据库`），并在其中建立以下 **3 张工作表**（大小写需一致，或者在 Apps Script 中直接运行一次 `setupSpreadsheet()` 函数自动创建）：

### 1. 工作表一：`Waiting_Queue`（等待队列）
记录当前正在排队及历史匹配状态。

| 列号 | 字段名称 (Header) | 数据类型 | 说明及示例 |
| :--- | :--- | :--- | :--- |
| **A** | `student_id` | String | 唯一匿名识别码，例如 `stu_1794368000_1234` |
| **B** | `nickname` | String | 儿童学习昵称，例如 `彩虹小画师` |
| **C** | `class_code` | String | 班级代码，例如 `1A`、`1B` |
| **D** | `joined_at` | Number/Timestamp | 首次进入队列的服务器毫秒时间戳 |
| **E** | `last_heartbeat` | Number/Timestamp | 最近一次心跳时间戳（前端每2.5秒更新一次） |
| **F** | `status` | String | 状态：`WAITING`（等待中）、`MATCHED`（已成团）、`CANCELLED`（已取消）、`EXPIRED`（心跳超时） |
| **G** | `group_id` | String | 匹配成功后分配的小组编号，例如 `GRP_1A_1794368500_888` |

### 2. 工作表二：`Groups`（成团小组记录）
记录所有成功组建的小组概要信息。

| 列号 | 字段名称 (Header) | 数据类型 | 说明及示例 |
| :--- | :--- | :--- | :--- |
| **A** | `group_id` | String | 小组唯一编号，主键 |
| **B** | `class_code` | String | 对应班级，例如 `1A` |
| **C** | `created_at` | String (ISO) | 小组创建时间 |
| **D** | `human_count` | Number | 真人学生人数（1、2 或 3） |
| **E** | `ai_count` | Number | 补位 AI 队友人数（0、1 或 2） |
| **F** | `status` | String | 状态：`FORMED`（已成团）、`COMPLETED`（已完成） |

### 3. 工作表三：`Group_Members`（小组各成员角色与身份）
记录每个小组内 3 名成员的具体分工与身份信息。

| 列号 | 字段名称 (Header) | 数据类型 | 说明及示例 |
| :--- | :--- | :--- | :--- |
| **A** | `group_id` | String | 关联小组编号 |
| **B** | `student_id` | String | 成员 ID（真人 ID 或 AI 标识如 `ai_pencil`） |
| **C** | `nickname` | String | 成员显示昵称，例如 `彩虹小画师` 或 `AI小助手·笔宝` |
| **D** | `member_type` | String | 成员身份：`HUMAN`（真人）或 `AI`（虚拟队友） |
| **E** | `role` | String | 合作角色：`聆听员`、`记录员`、`报告员` |
| **F** | `avatar` | String | 卡通头像 Emoji 或 图标 |
| **G** | `joined_at` | String (ISO) | 加入时间 |

---

## 二、Google Apps Script 代码配置

### 步骤 1：打开 Apps Script 编辑器
1. 打开刚刚创建的 Google Sheets。
2. 点击顶部菜单栏的 **扩展程序 (Extensions) -> Apps Script**。
3. 将项目名称修改为 `校园艺术展三人匹配系统`。

### 步骤 2：创建 `Code.gs` 文件
将本目录下的 `Code.gs` 内容完整复制粘贴到编辑器的 `Code.gs` 中。

### 步骤 3：创建 `Index.html` 文件
1. 在 Apps Script 编辑器左侧文件列表点击 **+号 -> HTML**。
2. 文件名输入 `Index`（无需加 `.html`）。
3. 将本目录下的 `Index.html` 内容完整复制粘贴进去。

### 步骤 4：初始化工作表
1. 在 Apps Script 工具栏的函数下拉框中选择 `setupSpreadsheet`。
2. 点击 **运行 (Run)**。
3. 首次运行时，Google 会提示授权，点击 **查看权限 -> 高级 -> 转到（安全）-> 允许**。
4. 运行完毕后，回到 Google Sheet 即可看到 `Waiting_Queue`、`Groups`、`Group_Members` 三张表已自动建好。

---

## 三、部署为 Web 应用程序并嵌入 Google Sites

### 步骤 1：发布 Web App
1. 在 Apps Script 编辑器右上角点击 **部署 (Deploy) -> 新建部署 (New deployment)**。
2. 点击左上角齿轮图标，选择 **Web 应用程序 (Web app)**。
3. 配置参数如下（**极其关键，务必准确选择**）：
   - **说明 (Description)**：`三人匹配系统正式版`
   - **执行身份 (Execute as)**：选择 **我 (Me / 你的Google账号)**（*确保所有学生免授权使用*）
   - **谁可以访问 (Who has access)**：选择 **所有人 (Anyone)**
4. 点击 **部署 (Deploy)**。
5. 复制系统生成的 **Web 应用程序网址 (Web App URL)**，例如：
   `https://script.google.com/macros/s/AKfycbx.../exec`

> **注意**：`Code.gs` 中已设置 `.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)`，允许在外部网页和 Google Sites 框架中跨域嵌入显示。

### 步骤 2：嵌入 Google Sites
1. 打开并编辑你的 **Google Sites (Google 协作平台)** 页面。
2. 在右侧操作面板点击 **插入 (Insert) -> 嵌入 (Embed)**。
3. 方式一（推荐，直接用网址）：
   - 选择 **按网址 (By URL)**。
   - 粘贴刚刚复制的 Web App URL。
   - 点击 **插入 (Insert)**。
4. 方式二（嵌入代码）：
   - 选择 **嵌入代码 (Embed code)**，输入：
     ```html
     <iframe src="你的Web_App_URL" width="100%" height="680" frameborder="0" allow="camera; microphone" style="border:none; border-radius: 20px;"></iframe>
     ```
5. 调整 Google Sites 上的卡片宽度与高度（推荐高度 650px~700px），点击 **发布 (Publish)** 即可在学生端正式使用！

---

## 四、九大测试案例与验证步骤

| 测试用例 | 测试操作 | 预期后台与前端表现 |
| :--- | :--- | :--- |
| **1. 一名真人进入，30秒后加入两名AI** | 打开单个浏览器标签页，输入昵称 `小狮子`，班级 `1A`，点击开始匹配。等待 30 秒。 | 后台检查到真人只有 1 人且已满 30 秒，自动从 `AI_ROSTER` 抽取 2 名 AI 队友（如笔宝、尺宝），组成三人小组。前端显示 1 个“我自己”卡片和 2 个“🤖 AI队友”卡片，并带有 AI 合作提示对话泡。 |
| **2. 两名真人进入，30秒后加入一名AI** | 打开两个不同无痕窗口，学生 A 和学生 B 选同班 `1A` 分别进入。30 秒内无第三人加入。 | 最早进入的学生到达 30 秒时，后台将学生 A、学生 B 与 1 名 AI 队友结合，生成三人小组。两名学生的页面均自动跳转至成团结果。 |
| **3. 三名真人进入，组成三人真人小组** | 打开三个不同标签页，学生 A、B、C 陆续在 10 秒内加入同一个班级 `1A`。 | 第三人加入后，后台 `waitingList.length >= 3` 条件立刻满足，无需等待 30 秒，立即生成 3 人纯真人小组，`ai_count = 0`，不混入任何 AI。 |
| **4. 五名真人进入，抽选三人，两人继续等待** | 5 名学生几乎同时在 `1A` 班排队。 | 系统随机抽选 3 人组成 `GRP_1A_1`，该 3 人的状态变为 `MATCHED` 并展示团队页面；其余 2 人状态依然为 `WAITING`，倒计时继续，等待下一轮真人或 30 秒补位。 |
| **5. 两名真人等待期间，第三人加入** | 学生 A、B 已等待 15 秒，学生 C 此时点击加入。 | 系统检测到班级凑齐 3 人，在下一次轮询（2.5秒内）瞬间成团，三人同时进入结果页，无须等待至 30 秒。 |
| **6. 页面刷新测试** | 学生在等待至第 18 秒时按下 `F5` 刷新网页。 | 前端从 `localStorage` 读取 `studentId`，后台根据其真实 `joined_at` 计算已流逝时间（18秒），剩余倒计时直接从 12 秒继续倒数，**不会重新重置为 30 秒**。若已成团，刷新直接恢复成团结果。 |
| **7. 取消等待测试** | 学生排队到第 10 秒点击“✕ 退出等待队列”。 | 后台将该学生在 `Waiting_Queue` 中的状态置为 `CANCELLED`。后续匹配将不再选入该学生。 |
| **8. 防止一人多组** | 学生通过修改参数或快速连击尝试重复加入。 | `apiJoinQueue` 在进入时第一步通过 `findGroupByStudentId` 拦截，若已在组中直接返回当前组，绝不会将同一名学生分配进两个小组。 |
| **9. 并发锁测试 (LockService)** | 多名学生在同一秒几乎同时点击“开始寻找队友”。 | 后台通过 `lock.waitLock(15000)` 保证排队与成团更新原子化执行，避免了数据覆盖与重复创建小组的并发冲突。 |
