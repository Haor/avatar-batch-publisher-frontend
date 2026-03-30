# ROADMAP — AvatarBatchPublisher Frontend 实装路线图

> 生成日期: 2026-03-28
> 技术栈: Electron 41 + React 19 + TypeScript 6 + Motion 12
> 设计系统: Frost Bento v5
> 后端: .NET 10, 38+ HTTP JSON + SSE endpoints

---

## 依赖关系图

```
Phase 0  共享基础设施 (Context / Hooks / 通用组件)
  │
  ├──→ Phase 1  AccountsPage 完整实装
  │       │
  │       ├──→ Phase 2  Sidebar 动态化 + HomePage 实数据
  │       │
  │       ├──→ Phase 3  LibraryPage 实数据 + Detail Panel
  │       │       │
  │       │       └──→ Phase 4  PublishPage 向导 + 监控
  │       │
  │       └──→ Phase 4  PublishPage 向导 + 监控
  │
  ├──→ Phase 5  SettingsPage 实装 (可与 Phase 1 并行)
  │
  └──→ Phase 6  全局交互层 (快捷键 / 拖放 / 搜索 / 通知)
```

- Phase 0 是所有后续阶段的前置
- Phase 1 (Accounts) 是 Phase 2/3/4 的前置 — my-avatars 和 publish 均需要 accountId
- Phase 5/6 可与 Phase 1-4 并行推进

---

## 当前已完成

| 模块 | 状态 | 说明 |
|------|------|------|
| Electron shell | ✅ | hiddenInset 标题栏, 4 个 IPC handlers |
| 设计系统 CSS | ✅ | Frost Bento v5 (~816 行), 全部 tokens |
| Sidebar | ✅ (mock) | SVG ABP 字标, layoutId 导航, 硬编码账号 |
| PageTransition | ✅ | blur/fade/y 动画 |
| HomePage | ✅ (mock) | stat bar + 任务卡 + 时间线 + 快捷键 |
| LibraryPage | ✅ (mock) | pill tabs + 模型网格 + 搜索框 + dropzone |
| API client | ✅ | 覆盖 7 模块 38+ 端点 (缺 home/overview) |
| SSE wrapper | ✅ | EventSource 封装 |
| Desktop bridge | ✅ | pickFiles / pickDirectory / revealPath / copyFile |
| TypeScript 契约 | ✅ | 9 文件, 所有后端 DTO (缺 HomeOverview) |
| 工具模块 | ✅ | errors, query-string, format/bytes, format/date-time |
| PublishPage | ❌ stub | 仅占位文字 |
| AccountsPage | ❌ stub | 仅占位文字 |
| SettingsPage | ❌ stub | 仅占位文字 |

---

## Phase 0 — 共享基础设施

> **目标**: 建立 API Context 分发、通用数据获取 Hook、错误/加载/Modal 等基础 UI 组件
> **可交付**: 基础设施就绪，不改变任何页面可见行为

### 0-1 API Context 与 Provider

| 项目 | 详情 |
|------|------|
| **新建** | `src/renderer/src/app/ApiContext.tsx` |
| **修改** | `App.tsx` — `<ApiProvider>` 包裹 `<LayoutGroup>` |
| **内容** | `createContext<BackendApi>`, `useApi()` hook; 将 App.tsx 中的 `api` 局部变量提升到 Provider |
| **复杂度** | S |

### 0-2 Navigation Context

| 项目 | 详情 |
|------|------|
| **新建** | `src/renderer/src/app/NavigationContext.tsx` |
| **修改** | `App.tsx` — 提供 `NavigationProvider` |
| **内容** | `{ navigate: (page: PageKey) => void; activePage: PageKey }`, 任何深层组件可触发导航 |
| **复杂度** | S |

### 0-3 Accounts Context

| 项目 | 详情 |
|------|------|
| **新建** | `src/renderer/src/app/AccountsContext.tsx` |
| **修改** | `App.tsx` — 在 ApiProvider 内层添加 `AccountsProvider` |
| **内容** | mount 时调 `api.accounts.list()`; 暴露 `useAccounts()` 返回 `{ accounts, loading, error, refetch, defaultAccount }` |
| **复杂度** | S |
| **理由** | 账号数据被 Sidebar、PublishPage、LibraryPage 共用, 避免各处重复请求 |

### 0-4 通用数据获取 Hook: `useQuery`

| 项目 | 详情 |
|------|------|
| **新建** | `src/renderer/src/shared/hooks/useQuery.ts` |
| **签名** | `useQuery<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: unknown[]): { data, error, loading, refetch }` |
| **要点** | AbortController 取消前次请求; cleanup 中 abort; 首次 mount 自动执行 |
| **复杂度** | M |

### 0-5 通用 Mutation Hook: `useMutation`

| 项目 | 详情 |
|------|------|
| **新建** | `src/renderer/src/shared/hooks/useMutation.ts` |
| **签名** | `useMutation<TInput, TResult>(action): { execute, loading, error, reset }` |
| **要点** | 手动触发, 返回 Promise 让调用方 await 后刷新 |
| **复杂度** | S |

### 0-6 SSE Hook: `useEventStream`

| 项目 | 详情 |
|------|------|
| **新建** | `src/renderer/src/shared/hooks/useEventStream.ts` |
| **签名** | `useEventStream<T>(factory: () => EventSource \| null, onEvent, deps): { connected, error }` |
| **要点** | factory 返回 null 时不连接 (条件订阅); onEvent 用 useRef 固定避免重连; cleanup 中 source.close() |
| **复杂度** | M |

### 0-7 useDebounce Hook

| 项目 | 详情 |
|------|------|
| **新建** | `src/renderer/src/shared/hooks/useDebounce.ts` |
| **内容** | `useDebounce<T>(value: T, delay: number): T` — 300ms 默认延迟 |
| **复杂度** | S |

### 0-8 通用 UI 组件

| 组件 | 文件 | 规格 | 复杂度 |
|------|------|------|--------|
| `StatusDot` | `shared/components/StatusDot.tsx` | 6px 圆点, tone: ok/warn/err, animate 布尔控制 bounce (spring.bouncy) | S |
| `Spinner` | `shared/components/Spinner.tsx` | 20px 旋转环, brand 色 | S |
| `EmptyState` | `shared/components/EmptyState.tsx` | icon + 一行文字 + 可选 action 按钮 | S |
| `ErrorBanner` | `shared/components/ErrorBanner.tsx` | err 色左边框, describeError() 文字 + 重试按钮 | S |
| `Modal` | `shared/components/Modal.tsx` | backdrop blur(8px), scale 0.95→1 spring.smooth, AnimatePresence, Portal 渲染, onClose, focus trap | M |
| `ConfirmDialog` | `shared/components/ConfirmDialog.tsx` | 基于 Modal, title + message + cancel/confirm 双按钮 | S |
| `ProgressBar` | `shared/components/ProgressBar.tsx` | 4px track, value: number \| null (null=indeterminate), spring.gentle | S |
| `AnimatedNumber` | `shared/components/AnimatedNumber.tsx` | useMotionValue + useTransform(Math.round), spring.gentle | S |
| `Input` | `shared/components/Input.tsx` | 36px, bg-inset, focus ring, forwardRef, label/error/disabled | S |
| `Select` | `shared/components/Select.tsx` | 与 Input 同高, native select 包装 | S |
| `Badge` | `shared/components/Badge.tsx` | 小型标签 (releaseStatus / platform / sessionState) | S |

### 0-9 HomeOverview 契约补充

| 项目 | 详情 |
|------|------|
| **新建** | `src/renderer/src/contracts/home.ts` |
| **修改** | `lib/backend.ts` — 添加 `home.getOverview()` 方法 |
| **内容** | `HomeOverview` 类型 (stats, activeQueue, focusExecution, recentActivities), 对应 `GET /home/overview` |
| **复杂度** | S |
| **理由** | 后端已有此端点但前端 contracts 和 API client 缺失 |

### 0-10 共享 CSS 补充

| 项目 | 详情 |
|------|------|
| **修改** | `styles.css` |
| **内容** | `.modal-backdrop`, `.modal-content`, `.spinner`, `.error-banner`, `.empty-state`, `.badge`, `.badge--ok/warn/err/brand`, `.input-group`, `.input-field`, `.select-field`, `.detail-panel` (360px 右侧滑入), `.confirm-dialog`, `.toast`, `.toast-stack` |
| **复杂度** | M |

### Phase 0 文件清单

```
新建 (12 文件):
  app/ApiContext.tsx
  app/NavigationContext.tsx
  app/AccountsContext.tsx
  shared/hooks/useQuery.ts
  shared/hooks/useMutation.ts
  shared/hooks/useEventStream.ts
  shared/hooks/useDebounce.ts
  shared/components/StatusDot.tsx
  shared/components/Spinner.tsx
  shared/components/EmptyState.tsx
  shared/components/ErrorBanner.tsx
  shared/components/Modal.tsx
  shared/components/ConfirmDialog.tsx
  shared/components/ProgressBar.tsx
  shared/components/AnimatedNumber.tsx
  shared/components/Input.tsx
  shared/components/Select.tsx
  shared/components/Badge.tsx
  contracts/home.ts

修改 (2 文件):
  app/App.tsx
  lib/backend.ts
  styles.css
```

---

## Phase 1 — AccountsPage 完整实装

> **目标**: 账号管理全部功能 — 列表、登录、2FA、导入、修复、登出、删除
> **前置**: Phase 0
> **可交付**: 用户可以完整管理 VRChat 账号

### 1-1 AccountsPage 布局与列表

| 项目 | 详情 |
|------|------|
| **重写** | `features/accounts/AccountsPage.tsx` |
| **数据** | `useAccounts()` from AccountsContext |
| **内容** | 页面标题 "账号" + 右上角 "登录" / "导入" 按钮; 账号垂直列表; 空状态: EmptyState "添加 VRChat 账号" |
| **动画** | 列表 stagger fadeIn (40ms 间隔) |
| **复杂度** | M |

### 1-2 AccountListItem 组件

| 项目 | 详情 |
|------|------|
| **新建** | `features/accounts/AccountListItem.tsx` |
| **内容** | 单行卡片: 左 (首字母 avatar + displayName + loginName) / 中 (StatusDot + 状态文字) / 右 (操作按钮) |
| **状态映射** | Active→绿 "已连接", PendingTwoFactor→橙 "等待验证", InvalidSession/NeedsReauth→橙 "需重连" + 3px warn 左边框, LoggedOut→灰 "已登出" |
| **操作按钮** | 设为默认 / 刷新 / 修复 / 重新登录 / 更多 (登出、删除) |
| **复杂度** | M |

### 1-3 登录 Modal

| 项目 | 详情 |
|------|------|
| **新建** | `features/accounts/LoginModal.tsx` |
| **API** | `api.accounts.login()` |
| **内容** | Modal 表单: userNameOrEmail + password + 提交; 响应 status="success" → 关闭 + refetch; status="requires-2fa" → 保存 challengeId, AnimatePresence 切换到 2FA 视图 |
| **动画** | Modal 标准 (scale 0.95→1); 表单→2FA 切换用方向感知滑动 |
| **复杂度** | M |

### 1-4 2FA 验证视图

| 项目 | 详情 |
|------|------|
| **修改** | `features/accounts/LoginModal.tsx` (内部状态切换) |
| **API** | `api.accounts.verifyTwoFactor()`, `api.accounts.cancelLogin()` |
| **内容** | 6 位验证码 Input (maxLength=6) + 提交 + 取消; 成功→关闭 + refetch |
| **复杂度** | S |

### 1-5 导入 Modal

| 项目 | 详情 |
|------|------|
| **新建** | `features/accounts/ImportModal.tsx` |
| **API** | `api.accounts.getImportSource()`, `api.accounts.importSessions()` |
| **内容** | 显示 suggestedSourcePath; "选择文件" 按钮 (pickSingleFile from desktop bridge); "从默认路径导入" 按钮 (sourceFilePath=null); 结果显示 importedCount / updatedCount / skippedCount; 成功→refetch |
| **复杂度** | M |

### 1-6 账号操作集成

| 项目 | 详情 |
|------|------|
| **修改** | `features/accounts/AccountListItem.tsx` |
| **API** | refresh / setDefault / logout / repair / remove |
| **内容** | 每个操作用 useMutation 包装; 刷新→静默 refetch; 设默认→refetch; 修复→显示 result.message; 登出→ConfirmDialog; 删除→ConfirmDialog (err 色确认按钮) |
| **复杂度** | M |

### Phase 1 文件清单

```
新建 (3 文件):
  features/accounts/AccountListItem.tsx
  features/accounts/LoginModal.tsx
  features/accounts/ImportModal.tsx

重写 (1 文件):
  features/accounts/AccountsPage.tsx
```

---

## Phase 2 — Sidebar 动态化 + HomePage 实数据

> **目标**: Sidebar 显示真实账号; HomePage 展示后端真实数据
> **前置**: Phase 0, Phase 1 (AccountsContext 有数据)
> **可交付**: 启动后即显示真实后端数据

### 2-1 Sidebar 动态账号列表

| 项目 | 详情 |
|------|------|
| **修改** | `app/Sidebar.tsx` |
| **数据** | `useAccounts()` |
| **内容** | 移除硬编码账号; 渲染 AccountSummary[]; sessionValid→StatusDot tone; isDefault 高亮; "添加账号"→navigate("accounts") |
| **动画** | 列表 stagger; StatusDot 状态变化 bounce |
| **复杂度** | M |

### 2-2 HomePage 统计条

| 项目 | 详情 |
|------|------|
| **修改** | `features/home/HomePage.tsx` |
| **API** | `GET /home/overview` (api.home.getOverview) |
| **内容** | 替换 mock 数据; stats.cloudAvatarCount / localArtifactCount / connectedAccountCount; 数字用 AnimatedNumber; 按钮: "发布"→navigate("publish"), "导入"→navigate("library") |
| **复杂度** | M |

### 2-3 HomePage 活跃任务卡片

| 项目 | 详情 |
|------|------|
| **修改** | `features/home/HomePage.tsx` |
| **API** | `GET /home/overview` 中的 activeQueue + focusExecution |
| **SSE** | 有 activeQueue 时连接 `api.publishQueue.stream(queueId)`, 用 useEventStream 实时更新 |
| **内容** | activeQueue 为 null 时不渲染任务卡 (无空状态占位); focusExecution 驱动 pipeline 阶段 (phaseIndex) + 进度条 (progressValue, null=indeterminate) + 状态文字 (progressText > stage fallback > status fallback) |
| **复杂度** | L |

### 2-4 HomePage 最近活动

| 项目 | 详情 |
|------|------|
| **修改** | `features/home/HomePage.tsx` |
| **API** | `GET /home/overview` 中的 recentActivities[] |
| **内容** | 替换 mock 时间线; dot tone: succeeded→ok, failed→err, running→brand; 时间用 formatDateTime |
| **复杂度** | S |

### Phase 2 文件清单

```
修改 (2 文件):
  app/Sidebar.tsx
  features/home/HomePage.tsx
```

---

## Phase 3 — LibraryPage 实数据 + Detail Panel

> **目标**: 三个 tab 真实数据、搜索、详情面板、导入/删除
> **前置**: Phase 0, Phase 1 (需要账号才能查看云端 tab)
> **可交付**: 用户可以完整浏览/管理本地和云端模型

### 3-1 ModelCard 统一组件

| 项目 | 详情 |
|------|------|
| **新建** | `features/library/ModelCard.tsx` |
| **内容** | 统一本地/云端卡片: image (url 或 null→Layers 占位), name, sourceLabel, badges, selected 状态 |
| **动画** | stagger 进入; 选中→card-active + spring.snappy |
| **复杂度** | M |

### 3-2 Local Tab 真实数据

| 项目 | 详情 |
|------|------|
| **修改** | `features/library/LibraryPage.tsx` |
| **API** | `api.artifacts.list()` |
| **内容** | 替换 mock; ArtifactSummary→ModelCard; thumbnailPath 存在时 `file://` 协议加载 |
| **复杂度** | M |

### 3-3 Cloud Tab 账号选择器 + 数据

| 项目 | 详情 |
|------|------|
| **新建** | `features/library/CloudAccountSelector.tsx` |
| **修改** | `features/library/LibraryPage.tsx` |
| **API** | `useAccounts()`, `api.myAvatars.list({ accountId })` |
| **内容** | 云端 tab 顶部 Select 组件切换账号; 默认选中 defaultAccount; 无账号→EmptyState; 支持分页 (hasMore→"加载更多"按钮) |
| **复杂度** | M |

### 3-4 "全部" Tab 合并视图

| 项目 | 详情 |
|------|------|
| **修改** | `features/library/LibraryPage.tsx` |
| **内容** | 合并 artifacts + 默认账号 myAvatars; 每卡片标识 cloud/local 来源 |
| **复杂度** | M |

### 3-5 搜索功能

| 项目 | 详情 |
|------|------|
| **修改** | `features/library/LibraryPage.tsx` |
| **内容** | 本地 tab→前端 filter by name; 云端 tab→search 参数传给 API; 使用 useDebounce(300ms) |
| **复杂度** | S |

### 3-6 Detail Panel 组件

| 项目 | 详情 |
|------|------|
| **新建** | `features/library/DetailPanel.tsx` |
| **内容** | 360px 宽, 从右侧滑入 (motion.aside, x: 360→0, spring.smooth); AnimatePresence 控制显隐; main 区域 margin-right 动态调整 |
| **复杂度** | M |

### 3-7 Detail Panel — 本地模型

| 项目 | 详情 |
|------|------|
| **修改** | `features/library/DetailPanel.tsx` |
| **API** | `api.artifacts.get(artifactId)` |
| **内容** | 只读元数据: name, platform, unityVersion, bundleFileName, bundleHash, createdAt; 操作: "发布到账号"→navigate("publish"), "打开文件位置"→revealPath, "删除"→ConfirmDialog + artifacts.remove |
| **复杂度** | M |

### 3-8 Detail Panel — 云端模型

| 项目 | 详情 |
|------|------|
| **修改** | `features/library/DetailPanel.tsx` |
| **API** | `api.myAvatars.get(accountId, avatarId)` |
| **内容** | 展示 remoteAvatar 所有字段; availableActions 控制按钮可见性; 操作: 编辑信息 (PATCH), 更换图片 (POST image + pickSingleFile), 下载 (POST download), 导入为本地 (POST import), 设为 Fallback (POST select-fallback), 删除 (DELETE + ConfirmDialog) |
| **复杂度** | L |

### 3-9 本地模型导入 (Drop Zone 增强)

| 项目 | 详情 |
|------|------|
| **新建** | `features/library/ImportDropZone.tsx` |
| **API** | `api.artifacts.importFromBundle()`, `api.artifacts.importFromManifest()` |
| **内容** | HTML5 drag/drop 事件; 检测扩展名 (.vrca→bundle, .manifest→manifest); 点击→pickFiles(); 成功→refetch |
| **动画** | 拖入时 border 变 brand + spring.snappy; 成功→spring.bouncy 反馈 |
| **复杂度** | M |

### Phase 3 文件清单

```
新建 (3 文件):
  features/library/ModelCard.tsx
  features/library/DetailPanel.tsx
  features/library/CloudAccountSelector.tsx
  features/library/ImportDropZone.tsx

修改 (1 文件):
  features/library/LibraryPage.tsx
```

---

## Phase 4 — PublishPage 向导 + 监控

> **目标**: 4 步创建发布队列 + SSE 实时监控
> **前置**: Phase 0, Phase 1 (账号), Phase 3 (模型数据)
> **可交付**: 用户可以完成端到端发布流程

### 4-1 PublishPage 状态机

| 项目 | 详情 |
|------|------|
| **重写** | `features/publish/PublishPage.tsx` |
| **内容** | 两个主视图: "wizard" (创建) / "monitor" (执行); 有 running queue 时自动进入 monitor |
| **复杂度** | S |

### 4-2 StepIndicator 组件

| 项目 | 详情 |
|------|------|
| **新建** | `features/publish/StepIndicator.tsx` |
| **内容** | 4 步: 选择模型→选择账号→配置信息→确认发布; 当前步高亮, 已完成步 check |
| **动画** | 步骤切换 spring.smooth; check 出现 spring.bouncy |
| **复杂度** | S |

### 4-3 Step 1: 选择模型

| 项目 | 详情 |
|------|------|
| **新建** | `features/publish/steps/SelectArtifactStep.tsx` |
| **API** | `api.artifacts.list()` |
| **内容** | 模型卡片网格, 单选/多选; 无模型→EmptyState + "去导入"; "下一步" disabled 直到选中; 从 Library "发布到账号" 进入时预选 |
| **复杂度** | M |

### 4-4 Step 2: 选择账号

| 项目 | 详情 |
|------|------|
| **新建** | `features/publish/steps/SelectAccountsStep.tsx` |
| **数据** | `useAccounts()` |
| **内容** | 多选 checkbox 卡片; canPublishAvatars=false 灰显 + 原因; "全选" 仅选可用账号; 计数器 "已选 X 个" |
| **复杂度** | M |

### 4-5 Step 3: 配置信息

| 项目 | 详情 |
|------|------|
| **新建** | `features/publish/steps/ConfigureInfoStep.tsx` |
| **内容** | name (预填 artifact.name), description (textarea), tags (chip input), releaseStatus (radio: 仅自己可见 / 所有人可见); 多模型时各自独立编辑 |
| **复杂度** | M |

### 4-6 Step 4: 预检确认

| 项目 | 详情 |
|------|------|
| **新建** | `features/publish/steps/PreflightStep.tsx` |
| **API** | `api.publishQueue.preflight()` |
| **内容** | 自动触发 preflight; 结果列表 stagger 进入 (40ms); check.isPassing→ok/err; canStart=true→"开始发布"可用; canStart=false→禁用 + 显示修复提示 |
| **复杂度** | M |

### 4-7 创建发布队列

| 项目 | 详情 |
|------|------|
| **修改** | `features/publish/PublishPage.tsx` |
| **API** | `api.publishQueue.create()` |
| **内容** | 组装 PublishQueueCreateRequest; 成功→保存 queueId, 切换 monitor 视图 |
| **复杂度** | S |

### 4-8 MonitorView 队列概览

| 项目 | 详情 |
|------|------|
| **新建** | `features/publish/MonitorView.tsx` |
| **API** | `api.publishQueue.get(queueId)` |
| **内容** | 顶部: 队列名 + 状态 badge + 进度 (successCount / executionCount); 中部: 每个 execution 卡片; 底部: 操作按钮 |
| **复杂度** | L |

### 4-9 MonitorView SSE 实时更新

| 项目 | 详情 |
|------|------|
| **修改** | `features/publish/MonitorView.tsx` |
| **API** | `api.publishQueue.stream(queueId)` via useEventStream |
| **事件** | queue.execution.started→标记 running; queue.execution.progress→更新 progressValue/bytes; queue.execution.completed→标记成功; queue.execution.failed→标记失败 + lastError; queue.completed→全部结束, 关闭 SSE |
| **状态** | useReducer 管理队列状态, action types 对应 SSE event names; SSE handler 包裹 startTransition |
| **复杂度** | L |

### 4-10 ExecutionCard 组件

| 项目 | 详情 |
|------|------|
| **新建** | `features/publish/ExecutionCard.tsx` |
| **内容** | accountDisplayName, pipeline 4 阶段指示器 (phaseIndex), ProgressBar (progressValue null=indeterminate), 字节进度 (formatBytes), progressText (文案优先级: progressText > stage fallback > status fallback), lastError 展示, StatusDot |
| **fallback 文案** | pending→等待开始, preflight→检查上传条件, reserve_avatar→创建远端记录, rewriting→处理模型包, uploading→上传模型文件, polling→等待处理, succeeded→上传完成, failed→上传失败 |
| **动画** | 状态变化 spring.smooth; 成功 spring.bouncy; 失败 shake |
| **复杂度** | M |

### 4-11 重试失败 + 完成状态

| 项目 | 详情 |
|------|------|
| **修改** | `features/publish/MonitorView.tsx` |
| **API** | `api.publishQueue.retryFailed(queueId)` |
| **内容** | 全部成功: [返回首页] [再次发布]; 部分失败: 失败原因 + [重试失败项] [返回首页]; "再次发布"→返回 Step 1 保留之前选择 |
| **复杂度** | S |

### Phase 4 文件清单

```
新建 (7 文件):
  features/publish/StepIndicator.tsx
  features/publish/steps/SelectArtifactStep.tsx
  features/publish/steps/SelectAccountsStep.tsx
  features/publish/steps/ConfigureInfoStep.tsx
  features/publish/steps/PreflightStep.tsx
  features/publish/MonitorView.tsx
  features/publish/ExecutionCard.tsx

重写 (1 文件):
  features/publish/PublishPage.tsx
```

---

## Phase 5 — SettingsPage 实装

> **目标**: 网络代理配置 + 关于信息
> **前置**: Phase 0
> **可交付**: 用户可配置代理, 查看版本

### 5-1 网络设置表单

| 项目 | 详情 |
|------|------|
| **重写** | `features/settings/SettingsPage.tsx` |
| **API** | `api.settings.getNetwork()`, `api.settings.updateNetwork()` |
| **内容** | 单列布局 max-width 480px; 代理 radio: 跟随系统 (system) / 不使用 (none) / 自定义 (custom); custom 时显示 proxyUrl Input; "保存" 按钮 (useMutation); mount 时 useQuery 加载当前配置 |
| **复杂度** | M |

### 5-2 关于卡片

| 项目 | 详情 |
|------|------|
| **修改** | `features/settings/SettingsPage.tsx` |
| **API** | `api.health.get()` |
| **内容** | service name + version + status StatusDot; 前端版本 (package.json); Electron/Chrome/Node 版本 (window.avatarBatchPublisher.versions); 服务器时间 |
| **复杂度** | S |

### Phase 5 文件清单

```
重写 (1 文件):
  features/settings/SettingsPage.tsx
```

---

## Phase 6 — 全局交互层

> **目标**: 键盘快捷键、文件拖放、全局搜索、Toast 通知、连接状态
> **前置**: Phase 0; 可与 Phase 1-5 并行
> **可交付**: 完整桌面级交互体验

### 6-1 Toast 通知系统

| 项目 | 详情 |
|------|------|
| **新建** | `shared/components/Toast.tsx`, `app/ToastContext.tsx` |
| **内容** | `useToast()` hook; `toast({ title, detail?, tone })`, 右下角堆叠, 3 秒自动消失, 最多 3 条 |
| **动画** | 进入 y:20→0 spring.smooth; 退出 x:100% |
| **复杂度** | M |

### 6-2 键盘快捷键

| 项目 | 详情 |
|------|------|
| **新建** | `shared/hooks/useKeyboardShortcuts.ts` |
| **修改** | `App.tsx` |
| **内容** | Cmd+N→publish, Cmd+I→library+导入, Cmd+K→搜索, Cmd+1-5→切页; Input focus 时忽略单字母键 |
| **复杂度** | M |

### 6-3 全局搜索 (Cmd+K)

| 项目 | 详情 |
|------|------|
| **新建** | `features/search/SearchPalette.tsx` |
| **内容** | Command palette Modal; 搜索范围: 页面名 + 账号名 + 本地模型名; 箭头键选择, Enter 确认, Esc 关闭 |
| **动画** | Modal 标准 + 结果 stagger |
| **复杂度** | L |

### 6-4 全局文件拖放

| 项目 | 详情 |
|------|------|
| **新建** | `shared/hooks/useGlobalDrop.ts` |
| **修改** | `App.tsx` |
| **内容** | document 级 dragover/drop; .vrca 文件→导航 library + 触发导入; 全局 overlay 提示 |
| **复杂度** | M |

### 6-5 Backend 连接状态

| 项目 | 详情 |
|------|------|
| **新建** | `shared/components/ConnectionStatus.tsx` |
| **修改** | `Sidebar.tsx` |
| **API** | `api.health.get()` 每 30 秒轮询 |
| **内容** | Sidebar 底部绿点 "已连接" / 红点 "未连接"; 断连时全局提示 |
| **复杂度** | S |

### Phase 6 文件清单

```
新建 (5 文件):
  shared/components/Toast.tsx
  app/ToastContext.tsx
  shared/hooks/useKeyboardShortcuts.ts
  features/search/SearchPalette.tsx
  shared/hooks/useGlobalDrop.ts
  shared/components/ConnectionStatus.tsx

修改 (2 文件):
  app/App.tsx
  app/Sidebar.tsx
```

---

## 全局技术决策

| # | 决策项 | 方案 | 理由 |
|---|--------|------|------|
| D1 | 状态管理 | React Context × 4 (Api + Accounts + Navigation + Toast) | 数据量小, 页面少, 不需外部库 |
| D2 | 数据获取 | 自建 useQuery / useMutation | 不引入 React Query; 无缓存, 每次 mount 重新请求 (实时性优先) |
| D3 | 表单 | 原生 useState | 表单简单, 不需 react-hook-form |
| D4 | CSS | 继续 hand-written CSS in styles.css | 与 Frost Bento v5 一致 |
| D5 | 动画 | Motion 12 spring presets (shared/springs.ts) | 已锁定 |
| D6 | 错误边界 | 页面级 useQuery error 自行处理 + 全局 React ErrorBoundary | 避免全页崩溃 |
| D7 | 图片 | 云端 imageUrl→`<img>`, 本地 thumbnailPath→`file://` | 需确认 Electron CSP 配置 |
| D8 | 分页 | 云端模型 "加载更多" 按钮 (非无限滚动) | 简单可靠, 模型数量有限 |
| D9 | SSE | EventSource 原生重连 + error handler | 自动重连, 无需额外逻辑 |
| D10 | Portal | Modal / Toast 渲染到 document.body 下独立 div | 避免 z-index/overflow 问题 |

---

## 风险与注意事项

1. **`/home/overview` 接口**: 后端有此端点但前端 API client 和 contracts 缺失, Phase 0-9 补充
2. **云端模型总数**: 每个账号需单独 API 调用; 建议 overview 接口返回聚合数
3. **无 memo/tag/favorite 写入**: 详情面板仅展示, 不提供编辑入口
4. **无队列暂停**: MonitorView 无暂停按钮
5. **Electron CSP**: `file://` 加载本地缩略图 + VRChat CDN 图片需验证安全策略
6. **并发限制**: 后端单 lane 执行, MonitorView 需清晰展示 "排队等待" 状态

---

## 完整 Checklist

### Phase 0 — 共享基础设施
- [ ] 0-1 ApiContext + ApiProvider + useApi()
- [ ] 0-2 NavigationContext + useNavigation()
- [ ] 0-3 AccountsContext + useAccounts()
- [ ] 0-4 useQuery hook
- [ ] 0-5 useMutation hook
- [ ] 0-6 useEventStream hook
- [ ] 0-7 useDebounce hook
- [ ] 0-8 通用 UI 组件 (StatusDot, Spinner, EmptyState, ErrorBanner, Modal, ConfirmDialog, ProgressBar, AnimatedNumber, Input, Select, Badge)
- [ ] 0-9 HomeOverview 契约 + API client 补充
- [ ] 0-10 共享 CSS 补充

### Phase 1 — AccountsPage
- [ ] 1-1 AccountsPage 布局与列表
- [ ] 1-2 AccountListItem 组件
- [ ] 1-3 登录 Modal
- [ ] 1-4 2FA 验证视图
- [ ] 1-5 导入 Modal
- [ ] 1-6 账号操作集成

### Phase 2 — Sidebar + HomePage
- [ ] 2-1 Sidebar 动态账号列表
- [ ] 2-2 HomePage 统计条 (GET /home/overview)
- [ ] 2-3 HomePage 活跃任务卡片 + SSE
- [ ] 2-4 HomePage 最近活动

### Phase 3 — LibraryPage
- [ ] 3-1 ModelCard 统一组件
- [ ] 3-2 Local Tab 真实数据
- [ ] 3-3 Cloud Tab 账号选择器 + 数据
- [ ] 3-4 "全部" Tab 合并视图
- [ ] 3-5 搜索功能
- [ ] 3-6 Detail Panel 组件
- [ ] 3-7 Detail Panel — 本地模型
- [ ] 3-8 Detail Panel — 云端模型
- [ ] 3-9 本地模型导入 (Drop Zone)

### Phase 4 — PublishPage
- [ ] 4-1 PublishPage 状态机
- [ ] 4-2 StepIndicator 组件
- [ ] 4-3 Step 1: 选择模型
- [ ] 4-4 Step 2: 选择账号
- [ ] 4-5 Step 3: 配置信息
- [ ] 4-6 Step 4: 预检确认
- [ ] 4-7 创建发布队列
- [ ] 4-8 MonitorView 队列概览
- [ ] 4-9 MonitorView SSE 实时更新
- [ ] 4-10 ExecutionCard 组件
- [ ] 4-11 重试失败 + 完成状态

### Phase 5 — SettingsPage
- [ ] 5-1 网络设置表单
- [ ] 5-2 关于卡片

### Phase 6 — 全局交互层
- [ ] 6-1 Toast 通知系统
- [ ] 6-2 键盘快捷键
- [ ] 6-3 全局搜索 (Cmd+K)
- [ ] 6-4 全局文件拖放
- [ ] 6-5 Backend 连接状态
