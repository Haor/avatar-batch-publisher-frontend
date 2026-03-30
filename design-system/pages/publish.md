# Publish

> 参照 MASTER.md + INTERACTION.md

## API

- 选模型：`GET /artifacts`
- 选账号：`GET /accounts`
- 预检：`POST /publishes/preflight`
- 执行：`POST /publish-queue`（产品层主入口）
- 监控：`GET /publish-queue/{id}` + `SSE /publish-queue/{id}/events`
- 重试：`POST /publish-queue/{id}/retry-failed`

## 状态管理

PublishPage 维护以下状态：
- `view`: "wizard" | "monitor"
- `step`: 0-3（当前步骤）
- `direction`: 1 | -1（步骤切换方向，驱动动画方向）
- `selectedArtifacts`: string[]（选中的模型 ID）
- `selectedAccounts`: string[]（选中的账号 ID）
- `perArtifactConfigs`: Map<string, PerArtifactConfig>（每个模型独立的完整配置）
- `queueId`: 当前监控的队列 ID

ActivePublishContext 提供跨页面持久化（`activeQueueId` 在页面切换时保留）。

## 布局

步骤条常驻顶部（StepIndicator 组件，4 步标签：选择模型/选择账号/配置信息/确认发布），内容区域下方，底部操作按钮。

步骤切换用方向感知动画（AnimatePresence + direction custom prop：左进右出/右进左出）。

## Step 1 — 选择模型 (SelectArtifactStep)

Checkbox 卡片列表 + 底部 drop zone。选中卡片 `--brand-soft` bg + `--brand` 边框（spring.snappy 光晕）。
支持多选（多模型 → 多 queue items）。
拖拽导入 = `POST /artifacts/import-from-bundle` → 自动勾选。
从模型库进入时已预选（通过 NavigationContext payload）→ 直接跳 Step 2。

## Step 2 — 选择账号 (SelectAccountsStep)

Checkbox 卡片。不可用账号灰显 + 「修复」按钮。
修复 = 内联展开 `POST /accounts/{id}/repair`。
「全选」只选 canPublishAvatars=true 的账号。

## Step 3 — 配置信息 (ConfigureInfoStep)

每个模型独立配置（perArtifactConfigs Map）：

```tsx
interface PerArtifactConfig {
  name: string;
  description: string;
  tags: string[];
  releaseStatus: "private" | "public";
  imagePath: string | null;
}
```

多模型时，每个 artifact 展示为可折叠卡片（ArtifactConfigCard）：
- 单模型时直接展开
- 多模型时点击展开/折叠（同时只展开一个）
- 每张卡片包含：封面预览 + 名称/描述/标签/可见性/封面选择

名称 + 封面自动从 artifact 数据填充。映射到 `PublishQueueCreateRequest.Items[]`。

## Step 4 — 确认 & 检查 (PreflightStep)

摘要卡片 + 检查结果列表。
自动触发 `POST /publishes/preflight`。
检查项逐项 stagger 进场（40ms）。
未通过项有就地修复按钮。
全通过 → 激活「开始发布」。

## 监控视图 (MonitorView)

`POST /publish-queue` 成功后自动进入（view 切换为 "monitor"）。

每个 Execution（每个账号）一个 ExecutionCard：
- 名称 + 状态圆点
- pipeline 组件（准备→处理→上传→完成）
- 上传阶段内嵌进度条 + 字节统计（AnimatedNumber + formatBytes）

文案优先级：resolveStatusText（progressText > stage fallback > status fallback）。
SSE 更新用 startTransition 包裹。

完成后：
- 全部成功：[返回主页] [再发布一次]
- 部分失败：显示失败原因 + [重试失败的] [返回主页]

「再发布一次」回到 Step 1（resetWizard 清空全部状态）。

## 共享域逻辑

`shared/domain/publish-stages.ts` 提供：
- `phaseLabels`: ["准备", "处理", "上传", "完成"]
- `stageFallback`: stage/status → 中文 fallback 文案
- `resolveStatusText(progressText, stage, status)`: 三级 fallback
- `getPhaseIndex(stage, status)`: 推算 phaseIndex (0-3)
- `statusTone(status)`: status → 颜色 tone
- `mergeExecutionProgress(prev, payload)`: 合并 SSE 增量到现有状态
- `saveToLibraryStageFallback`: save-to-library 阶段 → 中文文案
