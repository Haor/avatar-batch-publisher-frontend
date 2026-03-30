# History

> 参照 MASTER.md + INTERACTION.md。新增页面。

## API

- 发布记录列表：`GET /runs`（返回 RunSummary[]）
- 单条详情：`GET /runs/{id}`（返回 RunDetails，含 accounts 执行结果）
- 重试失败：`POST /runs/{id}/retry-failed`（返回新 RunSummary）
- 活动列表：`GET /home/overview`（recentActivities，复用首页接口）

## 数据源

双源合并 + 去重 + 按时间倒序：

1. `runs.list()` → type: "run"（发布记录）
2. `overview.recentActivities` → type: "activity"（非发布活动，过滤掉 type=publish_queue 避免重复）

统一为 ActivityItem：
```tsx
type ActivityItem = {
  id: string;
  type: "run" | "activity";
  title: string;
  subtitle: string;
  time: string;
  status: string;
  runId: string | null;
};
```

## 布局

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

进场动画：标题 spring.gentle，列表 stagger（30ms 间隔）。翻页时 key 变化重播 stagger。

## 列表条目

两种交互模式：
- **发布记录**（type: "run"）→ 可点击，`history-item--clickable` 样式，右侧 ChevronRight 指示器
- **普通活动**（type: "activity"）→ 不可点击，纯展示

左侧：状态圆点（statusTone 映射）+ 名称 + 副标题
右侧：时间（formatDateTime）+ 可选 chevron

## RunDetailModal

居中弹窗（createPortal + scrollbar 补偿）：

- 进场：scale 0.96→1 + blur 4px→0（spring.smooth）
- 右上角关闭按钮

内容结构：
1. 头部：名称（h2）+ 创建时间 + 重试来源（retryOfRunId）+ 状态 Badge
2. 描述（可选）
3. 标签列表（可选，Badge tone="neutral"）
4. 账号执行结果列表：每个账号一行（displayName + stage + outcome Badge + errorMessage）
5. 操作按钮：
   - [重试失败项]（仅有 outcome="failed" 的账号时显示）→ `POST /runs/{id}/retry-failed` → 返回新 runId → 弹窗内切换（onRetried 回调）
   - [去发布页] → navigate("publish") + 关闭弹窗

## 分页

PAGE_SIZE = 15。底部翻页器：
- 上一页 / 下一页按钮（ChevronLeft / ChevronRight）
- 页码显示："1 / 3"
- 边界 disabled

## 跨页导航

- 首页「全部 ↗」→ navigate("history")
- 首页最近活动条目点击 → navigate("history", { historyRunId }) → useEffect 消费 payload → 自动 setSelectedRunId → 打开 RunDetailModal
- usePageActivationRefresh：页面激活时同时刷新 runs + overview

## 空状态

EmptyState 组件：History 图标（32px）+ 「还没有任何活动」+ [去发布] 按钮。
