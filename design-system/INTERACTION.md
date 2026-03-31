# 产品交互设计

> 后端 API 契约不变。设计边界参照 `frontend-ui-api-blueprint-2026-03-28.md`。
> 设计语言参照 `MASTER.md`（Frost Bento v5 — 克制即美 + 物理弹簧动画）。

---

## 产品

**脱离 Unity 的私人 VRChat 模型管理台。**

6 类核心对象：Account · MyAvatar · Artifact · PublishQueue · Run · NetworkSettings

关键边界（不可违反）：
- MyAvatar 必须带 accountId（云端模型绑定账号）
- publish-queue 是产品层主入口（不直接用 /publishes）
- Execution 是运行粒度（一个 artifact → 一个 account）
- download / import / update image 都是独立动作

当前不可设计的能力：
- 记住密码自动重登
- 本地库 memo/tag/favorite 写接口
- queue pause/resume
- 多 worker 并发调度

---

## 导航

```
◉ 主页       统计 + 活跃任务 + 最近活动
◎ 模型库     本地 artifact + 云端 avatar 统一视图
◎ 发布       向导 4 步 + 监控
◎ 历史       发布记录 + 全部活动时间线
◎ 账号       登录/导入/修复/管理
─────
⚙ 设置       代理 + 存储路径 + 关于
```

侧边栏 232px。底部区域：
- 账号头像列表（可点击：sessionValid → 跳转模型库并切换到该账号的云端标签，invalid → 跳转账号页）
- ConnectionStatus 组件（30s 轮询，断连时 3s）
- 设置入口

### 术语映射

| 后端 | 前端 |
|------|------|
| Artifact | 本地模型 |
| MyAvatar | 云端模型 |
| PublishQueue | 发布任务 |
| Execution | 执行（每个账号一条） |
| Run | 发布记录 |
| Preflight | 发布前检查 |
| Session state | 登录状态 |
| private/public | 仅自己可见/所有人可见 |

### 阶段映射（后端 stage → 前端 phase）

| 后端 stage / status | phaseKey | 标签 | index |
|---|---|---|---|
| null / pending / preflight / reserve_avatar / reserved | prepare | 准备 | 0 |
| rewriting | process | 处理 | 1 |
| uploading | upload | 上传 | 2 |
| polling / completed / succeeded | complete | 完成 | 3 |

失败时保留最后 phase 高亮 + 失败态。文案优先级：progressText > stage fallback > status fallback。

### 颜色语义

| 状态 | 语义 |
|------|------|
| success / succeeded | --ok 绿 |
| running | --brand 蓝 |
| queued / pending | --fg-faint 灰 |
| warning / needs-repair | --warn 橙 |
| failed | --err 红 |
| info / download | --sky 浅蓝 |

---

## 主页

**API：** `GET /home/overview` + `GET /accounts` 并行。活跃任务 SSE：`GET /publish-queue/{id}/events`

**布局：** 单列纵向，内容垂直居中。

```
┌─ 统计条 ─────────────────────────────────────────┐
│ ☁ 12 云端模型  ⊞ 5 本地模型  ⊛ 3 已连接  [发布][导入] │
└──────────────────────────────────────────────────┘

┌─ 活跃任务（仅 activeQueue != null 时渲染）──────────┐
│  eku_v3                                    2/3    │
│  发布到 3 个账号                                   │
│                                                   │
│  ● 准备 ── ● 处理 ── ◉ 上传 ── ○ 完成            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━○                  │
│  A B D                  上传中 · user_beta · 12/45 MB │
└───────────────────────────────────────────────────┘

┌─ 最近 ──────────────────────────────────── 全部 ↗ ┐
│  ● eku_v2 发布完成        5 个账号 · 全部成功  3月25日 │
│  ● test_01 部分失败       user_beta 上传超时   3月24日 │
│  ● 下载 summer_avatar     从 user_alpha 备份   3月23日 │
└───────────────────────────────────────────────────┘

       ⌘N 新建发布  ⌘I 导入模型  ⌘K 快速搜索
```

数据映射：
- 统计条数字使用 AnimatedNumber 组件（弹簧插值），数据来自 `stats.*`
- 任务卡 ← `activeQueue.*` + `focusExecution.*`
- 流水线 ← `focusExecution.phaseIndex` 决定哪个亮
- 进度条 ← `focusExecution.progressValue`（null 时不确定进度条）
- 状态文案 ← `focusExecution.progressText`（null 时用 fallback 表）
- 最近 ← `recentActivities[].title / subtitle / status / occurredAt`
- 「全部 ↗」点击 → 导航到历史页
- 最近活动中有 runId 的条目 → 点击导航到历史页并打开 RunDetailModal
- 键盘快捷键自适应平台：Mac 显示 ⌘，Windows/Linux 显示 Ctrl

空状态：`activeQueue = null` 时任务卡不渲染（不显示空占位）。ActivePublishContext 提供跨页面状态持久化。

---

## 模型库

**API：**
- 本地：`GET /artifacts`，`GET /artifacts/{id}`，`PATCH /artifacts/{id}`（重命名 + 更换缩略图），`POST /artifacts/import-from-bundle`，`POST /artifacts/import-from-manifest`，`DELETE /artifacts/{id}`
- 云端：`GET /my-avatars?accountId=`，`GET /my-avatars/{id}?accountId=`，`GET /my-avatars/styles?accountId=`，`PATCH /my-avatars/{id}`，`POST /my-avatars/{id}/image`，`POST /my-avatars/{id}/download`，`POST /my-avatars/{id}/import`，`POST /my-avatars/{id}/select`（使用该模型），`POST /my-avatars/{id}/select-fallback`，`POST /my-avatars/{id}/save-to-library`（下载到本地库 + SSE 进度），`DELETE /my-avatars/{id}`

**约束：** 云端接口全部需要 `accountId`。切换账号 = 重新请求。缩略图加载通过 IPC `readFileAsDataUrl`（不用 file:// 协议）。

**布局：**

```
┌─ [☁ user_alpha ▾]  [全部] [本地] [云端]    🔍 搜索 ─┐
│                                                      │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌╌╌╌╌╌┐              │
│  │    │ │    │ │    │ │    │ │ 导入 │              │
│  │name│ │name│ │name│ │name│ │ 模型 │              │
│  │☁ a │ │本地│ │☁ b │ │☁ a │ │     │              │
│  └────┘ └────┘ └────┘ └────┘ └╌╌╌╌╌┘              │
│                                                      │
│  点击卡片 → 居中详情弹窗 (createPortal + spring.smooth) │
└──────────────────────────────────────────────────────┘
```

**云端账号选择器：** 自定义 pill 下拉（CloudAccountSelector），始终可见于 Tab 栏左侧。头像圆 + 账号名 + ChevronDown。点击展开下拉列表，仅显示 sessionValid 的账号。

**平台徽章去重：** 卡片上的 platform 标签已去重处理。

Tab 设计：
- **全部**（默认）：合并本地 + 云端（先请求 artifacts + 默认账号 my-avatars）
- **本地**：仅 artifacts，末尾 drop zone
- **云端**：使用选择器切换 accountId 重新加载，支持 search/sort/releaseStatus 筛选

详情弹窗（居中 Modal，双列布局：封面左 + 信息右）：

**本地模型：**
```
┌────────────────────────────────────────────┐
│  [封面图]     │  eku_avatar_v3    [×]      │
│               │  PC · Unity 2022.3         │
│               │  45.2 MB · 2026-03-25      │
│               │                            │
│               │  名称 [可编辑] [保存]       │
│               │  [更换封面]                 │
│               │                            │
│               │  [发布到账号]               │
│               │  [在 Finder 中显示]         │
│               │  [删除]                     │
└────────────────────────────────────────────┘
```

- 支持行内重命名 + 更换封面（`PATCH /artifacts/{id}`）
- [发布到账号] → 跳转发布向导 Step 1 预选
- [在文件管理器中显示] → desktop bridge `revealPath`
- [删除] → 确认后 `DELETE /artifacts/{id}`

**云端模型（即编辑）：**
```
┌────────────────────────────────────────────┐
│  [封面图]     │  Summer Avatar      [×]    │
│               │                            │
│  [更换封面]   │  名称 [              ]     │
│               │  描述 [              ]     │
│               │  标签 [cute] [+]           │
│               │  可见性 ◉ 仅自己 ○ 所有人   │
│               │  风格 [Primary] [Secondary] │
│               │              [保存]        │
│               │  ─────────────────         │
│               │  [使用该模型]              │
│               │  [下载到本地库]             │
│               │  [导入为本地模型]           │
│               │  [设为后备模型]             │
│               │  [删除]                    │
└────────────────────────────────────────────┘
```

- 保存 = `PATCH /my-avatars/{id}`
- 更换封面 = `POST /my-avatars/{id}/image`（选择本地图片文件路径）
- 风格列表 = `GET /my-avatars/styles?accountId=`
- [使用该模型] = `POST /my-avatars/{id}/select`
- [下载到本地库] = `POST /my-avatars/{id}/save-to-library`（异步任务，返回 taskId，通过 SSE 接收进度，进度条内嵌弹窗中）
- [删除] → `DELETE /my-avatars/{id}`（需确认 + 警告「从 VRChat 永久删除」）

空状态：
- 全部：「添加账号后云端模型会自动出现」
- 本地：drop zone 占满
- 云端：「添加账号查看云端模型」

---

## 发布

**API：**
- 预检：`POST /publishes/preflight`
- 创建队列：`POST /publish-queue`
- 队列详情：`GET /publish-queue/{id}`
- 实时事件：`GET /publish-queue/{id}/events`（SSE）
- 重试失败：`POST /publish-queue/{id}/retry-failed`
- 选择数据：`GET /artifacts` + `GET /accounts`

**约束：** 入口是 publish-queue（不直接用 /publishes）。Execution 是运行粒度。

**4 步向导** — 步骤条常驻顶部，pipeline 组件（复用首页样式）。

### Step 1 — 选择模型

数据源：`GET /artifacts`

```
☑ eku_avatar_v3    PC    2022.3
☐ test_model_01    Quest  2022.3
☐ custom_avatar    PC    2022.3

─── 或 ───
┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐
╎ 拖拽 .vrca 到此处快速导入    ╎
└╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
                    [下一步 →]
```

- 支持多选（多模型 → 多 queue items）
- 拖拽导入 = `POST /artifacts/import-from-bundle` → 自动勾选
- 从模型库「发布到账号」进入时已预填，直接跳 Step 2

### Step 2 — 选择账号

数据源：`GET /accounts`

```
☑ user_alpha   ● 已连接
☑ user_beta    ● 已连接
☐ user_gamma   ▲ 需重连  [修复]
☑ user_delta   ● 已连接

[全选]  已选 3 个
           [← 上一步]  [下一步 →]
```

- 不可用账号灰显 +「修复」内联展开（`POST /accounts/{id}/repair`，不跳页）
- canPublishAvatars = false 时也灰显

### Step 3 — 填写信息（perArtifactConfigs）

每个模型独立配置，使用 `Map<artifactId, PerArtifactConfig>` 存储：

```tsx
interface PerArtifactConfig {
  name: string;
  description: string;
  tags: string[];
  releaseStatus: "private" | "public";
  imagePath: string | null;
}
```

多模型时，每个 artifact 展示为可折叠卡片：

```
▼ eku_avatar_v3 ─────────────────────────────
  [封面预览]
  名称  [eku_avatar_v3              ]
  描述  [                            ]
  标签  [cute] [anime] [+]
  可见性 ◉ 仅自己可见  ○ 所有人可见
  封面  [选择图片]

▶ test_model_01  (折叠)

▶ custom_avatar  (折叠)

           [← 上一步]  [下一步 →]
```

- 名称 + 封面自动从 artifact 数据填充
- 单模型时直接展开，无折叠
- 映射到 `PublishQueueCreateRequest.Items[].Name / Description / Tags / ReleaseStatus / ImagePath`

### Step 4 — 确认 & 检查

```
模型    eku_avatar_v3 (PC, 2022.3)
账号    user_alpha · user_beta · user_delta
可见性   仅自己可见

发布前检查
  ✓ 模型文件完整
  ✓ 所有账号已连接
  ✓ 文件大小符合要求

           [← 上一步]  [开始发布]
```

- 自动触发 `POST /publishes/preflight`
- 全通过才激活「开始发布」
- 未通过项有就地修复入口
- 「开始发布」= `POST /publish-queue`

### 监控视图

点击「开始发布」后自动进入。数据源：`GET /publish-queue/{id}` + SSE `/publish-queue/{id}/events`

```
━━━━━━━━━━━━━━━━━━━━━━━━○  2/3

user_alpha  ✓ 完成
  准备 ✓ → 处理 ✓ → 上传 ✓ → 完成 ✓

user_beta   上传中
  准备 ✓ → 处理 ✓ → 上传 ████░  27%
  12.3 / 45.2 MB

user_delta  等待中
  ○ ── ○ ── ○ ── ○

▶ 详细日志（默认折叠）

── 完成后 ──
✓ 3/3 成功
[返回主页]  [再发布一次]

── 部分失败 ──
✓ 2 成功  ✗ 1 失败
user_beta: 上传超时
[重试失败的]  [返回主页]
```

- 每个账号 = 一个 Execution
- SSE 事件驱动阶段/进度更新（startTransition 保护动画帧）
- 流水线复用首页 pipeline 组件
- 文案使用 progressText（优先）→ fallback 表
- 「重试失败的」= `POST /publish-queue/{id}/retry-failed`
- 「再发布一次」= 回到向导 Step 1，保留上次选择

---

## 历史

**API：** `GET /runs`（发布记录列表），`GET /runs/{id}`（单条详情），`POST /runs/{id}/retry-failed`（重试），`GET /home/overview`（recentActivities）

**数据源：** 双源合并 — `runs.list()` 返回发布记录 + `overview.recentActivities` 返回非发布活动。按时间统一排序，去重后展示。

**布局：**

```
┌─ 历史 ─────────────────────────── [刷新] ─┐
│                                            │
│  ● eku_v3 发布完成                  3月28日  │
│    成功 3 · 失败 0                      ▸  │
│  ──────────────────────────────────────── │
│  ● test_01 部分失败                 3月27日  │
│    成功 2 · 失败 1                      ▸  │
│  ──────────────────────────────────────── │
│  ● 下载 summer_avatar               3月26日 │
│    从 user_alpha 备份                      │
│                                            │
│              ◁  1 / 3  ▷                   │
└────────────────────────────────────────────┘
```

**条目类型：**
- `type: "run"`（发布记录）→ 可点击，右侧 ChevronRight 指示器，点击打开 RunDetailModal
- `type: "activity"`（非发布活动）→ 不可点击，纯展示

**RunDetailModal：** 居中弹窗（createPortal），展示：
- 名称 + 创建时间 + 状态 Badge
- 描述 + 标签
- 账号执行结果列表（每个账号的 stage + outcome + errorMessage）
- 操作按钮：[重试失败项]（仅有失败账号时显示）+ [去发布页]
- 重试 = `POST /runs/{id}/retry-failed` → 返回新 runId，弹窗内切换

**分页：** 15 条/页，底部翻页器。

**跨页导航：**
- 首页「最近活动 · 全部 ↗」→ 导航到历史页
- 首页最近活动条目点击 → 导航到历史页并携带 `historyRunId`，自动打开 RunDetailModal

**空状态：** 「还没有任何活动」+ [去发布] 按钮

---

## 账号

**API：**
- 列表：`GET /accounts`
- 详情：`GET /accounts/{id}`
- 建议路径：`GET /accounts/import-source`
- 登录：`POST /accounts/login` → `POST /accounts/login/verify-2fa` / `POST /accounts/login/cancel`
- 导入：`POST /accounts/import`
- 操作：`POST /accounts/{id}/refresh / set-default / logout / repair`
- 删除：`DELETE /accounts/{id}`

**布局：**

```
┌─ 账号 ──────────────────────── [+ 添加] ─┐
│                                           │
│  (A) user_alpha       可发布  ● 已连接     │
│       user_alpha              [↻] [···]  │
│  ──────────────────────────────          │
│  (B) user_beta  ★     可发布  ● 已连接     │
│       user_beta               [↻] [···]  │
│  ──────────────────────────────          │
│  (G) user_gamma               ▲ 需重连    │
│  ┃    user_gamma              [↻] [···]  │
│                                           │
└───────────────────────────────────────────┘
```

**操作简化：** 仅刷新按钮 [↻] 内联显示。其余操作全部收入 [···] 更多菜单（portal-based，脱离卡片 stacking context）：
- 设为默认（非默认账号时显示）
- 修复（`supportsAutoRepair` 时显示）
- 重新登录（`needsReauthentication` 时显示）
- 分割线
- 登出（需确认）
- 删除（需确认，danger 样式）

**「可发布」Badge：** 仅当 `canPublishAvatars && sessionValid` 同时满足时显示。

- 需重连 = 左侧 3px `--warn` 竖线
- 头像圈圆 = 首字母大写 + 渐变背景

状态映射：
| 后端 sessionState | 前端显示 |
|---|---|
| Active (sessionValid=true) | ● 已连接（--ok） |
| PendingTwoFactor | ▲ 等待验证（--warn） |
| InvalidSession / NeedsReauthentication | ▲ 需重连（--warn）+ 左侧竖线 |
| LoggedOut | ○ 已登出（--fg-faint） |
| Removed | 不显示 |

### 登录 Modal（LoginModal）

独立 Modal（400px），毛玻璃幕布 blur(8px) + scale 0.95→1 进场。

**登录流程：**
1. 输入用户名/邮箱 + 密码 → `POST /accounts/login`
2. 返回状态判断：
   - `status: "completed"` 或包含 `account` → 登录成功，Modal 关闭，列表刷新
   - `status: "requires_totp"` 或 `"requires_email_otp"` → 同一 Modal 内 AnimatePresence 切换为验证码输入（方向感知动画）
3. 验证码输入（6 位数字，`inputMode: "numeric"`，自动聚焦）→ `POST /accounts/login/verify-2fa`
4. 返回按钮 → `POST /accounts/login/cancel` 取消 challenge，回到凭证输入

### 导入 Modal（ImportModal）

独立 Modal。
1. 自动填充建议路径（`GET /accounts/import-source`）
2. 选择文件路径 → `POST /accounts/import`

空状态：「添加 VRChat 账号」[添加]

---

## 设置

**API：** `GET /settings/network`，`PUT /settings/network`，`GET /settings/storage`，`PUT /settings/storage`

单列 max-width 480px。三个卡片区块：

### 网络代理

卡片样式模式选择器（三张卡片，非 radio 按钮）：

```
┌─ 网络代理 ────────────────────────────────┐
│                                           │
│  ┌───────────┐ ┌──────┐ ┌────────┐       │
│  │ 跟随系统   │ │ 直连  │ │ 自定义  │       │
│  │ 使用操作系  │ │ 不通过│ │ 手动指定│       │
│  │ 统代理设置  │ │ 任何代│ │ 代理服务│       │
│  │           │ │ 理    │ │ 器     │       │
│  └───────────┘ └──────┘ └────────┘       │
│                                           │
│  （自定义时展开：）                          │
│  协议 [HTTP ▾]  地址 [127.0.0.1]  端口 [7890] │
│                                    [保存]  │
└───────────────────────────────────────────┘
```

- 选中卡片 = `proxy-mode-card--active` 样式
- 自定义模式拆分为三个字段：协议 Select（HTTP/SOCKS5）+ Host Input + Port Input（纯数字）
- 保存 = `PUT /settings/network`，成功后按钮短暂显示「已保存」

### 存储路径

```
┌─ 存储路径 ────────────────────────────────┐
│  [/Users/xxx/VRChat/Models     ] [📂]     │
│                            [保存路径]      │
└───────────────────────────────────────────┘
```

- 数据源：`GET /settings/storage`
- 文件夹选择器 = desktop bridge `pickDirectory`
- 仅编辑后显示保存按钮（`hasChanges` 判断）
- 保存 = `PUT /settings/storage`

### 关于

```
┌─ 关于 ────────────────────────────────────┐
│  后端服务     Avatar Publisher            │
│  后端版本     1.0.0                        │
│  后端状态     ● 正常                       │
│  后端地址     http://localhost:5000         │
│  Electron    33.x                         │
│  Chrome      130.x                        │
│  Node        20.x                         │
└───────────────────────────────────────────┘
```

- 后端信息来自 `GET /health`
- 后端地址 = `resolveBackendBaseUrl()`
- Electron/Chrome/Node 版本来自 `window.avatarBatchPublisher.versions`

---

## 全局模式

### Modal 规范

所有 Modal 统一使用 `createPortal` 挂载到 `document.body`：
- 打开时锁定 `body` 滚动，补偿滚动条宽度防止布局抖动
- 毛玻璃幕布 backdrop-filter: blur(8px)
- 内容区 scale 0.95→1 + blur 4px→0 进场
- Escape 关闭 + 点击幕布关闭

### useQuery 行为

- **换源（deps 变化）：** 清空旧数据 → loading → 请求
- **同源刷新（refetch/tick）：** 有缓存时静默刷新，不显示 loading。请求失败且有缓存时忽略错误
- **AbortController：** 每次请求自动携带，组件卸载或 deps 变化时中止上一次

### 错误消息

三层 fallback：
1. 已知 API 错误码 → 中文友好描述（`errors.ts` friendlyMessages 表）
2. HTTP 状态码 → 通用中文描述
3. 原始错误 message

已映射的错误码包括：accounts.session_invalid / login_failed / already_exists, artifacts.not_found / import_failed, settings.network.invalid 等。

### 状态反馈

| 类型 | 方式 |
|------|------|
| 成功 | 按钮恢复原状 = 确认。不弹 toast |
| 进行中 | 按钮 disabled + spinner |
| 警告 | 内联文字 --warn 色，靠近问题源 |
| 错误 | ErrorBanner 组件，内联文字 --err 色，不自动消失 |

### 空状态

EmptyState 组件：图标 + 一行文字 + 可选操作按钮。

### 就地修复

发布向导中遇到账号不可用 → 内联展开修复，不跳页。

### 渐进披露

```
默认    进度条 + 状态文案
展开    每个账号流水线详情
深入    原始 SSE 事件日志
```

### 跨页衔接

- 模型库「发布到账号」→ 发布向导 Step 1 预选 → 跳到 Step 2
- 首页活跃任务「查看」→ 发布监控视图
- 首页最近活动「全部 ↗」→ 历史页
- 首页最近活动条目（有 runId）→ 历史页，携带 `historyRunId` payload，自动打开 RunDetailModal
- 侧边栏账号头像点击 → sessionValid 时导航到模型库云端 Tab（携带 `cloudAccountId`），invalid 时导航到账号页
- NavigationContext 支持 payload 传递（`consumePayload` 一次性消费）

---

## 设计约束来自后端

| 约束 | 影响 |
|------|------|
| MyAvatar 必须带 accountId | 云端视图必须有 CloudAccountSelector，切换即重新请求（useQuery deps 变化 → 清空旧数据） |
| publish-queue 是入口 | 向导最终调用 POST /publish-queue，不是 /publishes |
| Execution 是运行粒度 | 监控视图按 execution 展示，不是按 queue item |
| download ≠ import ≠ save-to-library | 三种不同操作：下载文件 / 导入为 artifact / 异步保存到本地库 |
| save-to-library 是异步任务 | 返回 taskId + SSE 事件流，UI 需展示进度条 |
| no memo/tag/favorite write | 模型库不设计收藏/标签功能 |
| no queue pause/resume | 监控视图不设计暂停按钮 |
| no auto-relogin | 账号页不设计「记住密码」 |

---

## API 映射

| 页面 | 接口 |
|------|------|
| 主页 | GET /home/overview, GET /accounts, SSE /publish-queue/{id}/events |
| 模型库-本地 | GET/DELETE /artifacts, PATCH /artifacts/{id}, POST /artifacts/import-* |
| 模型库-云端 | GET/PATCH/DELETE /my-avatars, POST /my-avatars/{id}/image,download,import,select,select-fallback,save-to-library, GET /my-avatars/styles |
| 模型库-下载到本地库 | POST /my-avatars/{id}/save-to-library → GET task → SSE events |
| 发布-选模型 | GET /artifacts |
| 发布-选账号 | GET /accounts |
| 发布-检查 | POST /publishes/preflight |
| 发布-执行 | POST /publish-queue |
| 发布-监控 | GET /publish-queue/{id}, SSE /publish-queue/{id}/events |
| 发布-重试 | POST /publish-queue/{id}/retry-failed |
| 历史 | GET /runs, GET /runs/{id}, POST /runs/{id}/retry-failed, GET /home/overview (recentActivities) |
| 账号 | GET/DELETE /accounts/{id}, POST /accounts/login,verify-2fa,cancel,import,refresh,repair,set-default,logout |
| 设置 | GET/PUT /settings/network, GET/PUT /settings/storage, GET /health |
