# Home

> 参照 MASTER.md + INTERACTION.md

## API

首屏并行：`GET /home/overview` + `GET /accounts`
实时：`SSE /publish-queue/{queueId}/events`（通过 useEventStream hook）

## 布局

单列纵向，垂直居中。三张卡片：统计条 → 活跃任务 → 最近活动。stagger 进场（60ms 间隔）。

## 统计条

横向一行。数据来自 `stats.*`。数字使用 AnimatedNumber 组件（弹簧插值 spring.gentle）。
图标 + 标签 + 右侧锚定发布/导入按钮。

图标映射：Cloud（云端模型）、HardDrive（本地模型）、Users（已连接账号）。

## 活跃任务

仅 `activeQueue != null` 且未被手动关闭时渲染。数据来自 `activeQueue` + `focusExecution`。SSE 事件实时更新。

- 名称 = `activeQueue.name`
- 分数 = `executionSuccessCount / executionCount`
- 流水线 = `focusExecution.phaseIndex` 决定阶段亮灭（phaseLabels: 准备/处理/上传/完成）
- 进度条 = `focusExecution.progressValue`（null 时不确定进度条，CSS animation 条纹）
- 状态文案 = resolveStatusText 三级 fallback（progressText > stage fallback > status fallback）
- 字节进度 = `focusExecution.bytesSent / bytesTotal`（formatBytes 格式化）
- 头像 = `activeQueue.accounts` 映射，各自不同渐变色（5 色循环）
- 左侧 3px 品牌色 `card-active` 样式

SSE 事件处理：
- 使用 `startTransition` 包裹 setState，保护 Motion 动画帧
- `mergeExecutionProgress` 合并增量 payload 到 liveFocus 状态
- `queue.completed` 事件 → 清除 activeQueueId、重置 liveFocus
- ActivePublishContext 提供跨页面状态持久化（queueId 在页面切换时保留）

## 最近活动

数据来自 `recentActivities[]`。圆点颜色按 `statusTone(status)` 映射。hover 态 bg-inset。

- 「全部 ↗」点击 → 导航到历史页
- 条目有 runId 的 → 点击导航到历史页并携带 `historyRunId`（通过 NavigationContext payload）

## 空状态

- 无 activeQueue：任务卡不渲染（不显示空占位）
- 无 recentActivities：「暂无活动」
- 无账号：统计全零 + 底部「添加账号开始使用」

## 键盘快捷键

底部提示自适应平台（Mac: ⌘, Windows/Linux: Ctrl）：

```
{modKey}N 新建发布  {modKey}I 导入模型  {modKey}K 快速搜索
```

额外数字快捷键：{modKey}1-6 对应 6 个页面。

## 数据刷新

- usePageActivationRefresh：页面激活时自动 refetch
- ConnectionContext refreshKey：断连恢复后递增，触发全局刷新
