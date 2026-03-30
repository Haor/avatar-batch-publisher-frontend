# Library

> 参照 MASTER.md + INTERACTION.md。产品核心页面。

## API

- 本地：`GET /artifacts`，`GET /artifacts/{id}`，`PATCH /artifacts/{id}`（重命名 + 缩略图），`POST /artifacts/import-from-bundle`，`POST /artifacts/import-from-manifest`，`DELETE /artifacts/{id}`
- 云端：`GET /my-avatars?accountId=`，`GET /my-avatars/{id}?accountId=`，`PATCH /my-avatars/{id}`，`POST /my-avatars/{id}/image,download,import,select,select-fallback,save-to-library`，`DELETE /my-avatars/{id}`，`GET /my-avatars/styles?accountId=`
- 下载到本地库：`POST /my-avatars/{id}/save-to-library` → 返回 taskId → `GET task` + SSE events

**约束：云端接口全部需要 accountId。缩略图加载通过 IPC readFileAsDataUrl（useLocalImage hook）。**

## 布局

```
顶部：[☁ 账号选择器 ▾]  [全部] [本地] [云端]   🔍 搜索
主体：模型卡片网格 repeat(auto-fill, minmax(170px, 1fr))
点击卡片 → 居中详情弹窗 (createPortal)
```

## 云端账号选择器 (CloudAccountSelector)

自定义 pill 下拉组件，**始终可见**于 Tab 栏左侧（不仅在云端 Tab）：
- 触发器：头像圆 + 账号名 + ChevronDown
- 下拉列表：仅 `sessionValid` 的账号
- 选中变化 → `setCloudAccountId` → 触发 useQuery 重新请求
- 优先级：手动选择 > 默认账号（需 sessionValid）> 第一个有效账号
- 侧边栏账号点击 → 携带 `cloudAccountId` payload → 切换到云端 Tab + 指定账号

## Tab

pill 样式，layoutId 指示器。Tab 切换用方向感知动画。

- 全部：`GET /artifacts` + `GET /my-avatars?accountId={effectiveCloudAccountId}` 合并
- 本地：仅 artifacts，末尾 ImportDropZone
- 云端：使用选择器指定 accountId，支持 search/sort/releaseStatus 筛选

## 模型卡片 (ModelCard)

玻璃卡片。缩略图 1:1 占位（无图 = bg-inset + Layers 图标）。
底部：名称 + 来源标签（Cloud/HardDrive 14px + 账号名或「本地」）。
平台徽章已去重处理。
使用 `content-visibility: auto`（排除动画中的卡片）。

## 详情弹窗 (DetailPanel)

居中 Modal（createPortal 挂载 document.body），非旧版右侧滑入面板。双列布局：封面左 + 信息右。
打开时锁定背景滚动 + 补偿滚动条宽度。
进场动画：scale 0.96→1 + blur 4px→0（spring.smooth）。

**本地模型：**
- 封面图 + 元数据（平台、Unity 版本、文件大小、创建时间）
- 行内重命名 + 更换封面图（`PATCH /artifacts/{id}`）
- [发布到账号] → 跳转发布向导携带 artifactId，Step 1 预填
- [在 Finder 中显示] → desktop bridge `revealPath`
- [删除] → ConfirmDialog 确认后 `DELETE /artifacts/{id}`

**云端模型（即编辑）：**
- 封面图（可更换 `POST image`）
- 表单字段：名称、描述、标签、可见性、风格（styles API）
- [保存] = `PATCH /my-avatars/{id}`
- [使用该模型] = `POST /my-avatars/{id}/select`
- [下载到本地库] = `POST /my-avatars/{id}/save-to-library`（异步任务，ProgressBar 内嵌弹窗中，SSE 事件驱动进度更新，文案使用 saveToLibraryStageFallback）
- [导入为本地模型] = `POST /my-avatars/{id}/import`（同步一步完成）
- [设为后备模型] = `POST /my-avatars/{id}/select-fallback`
- [删除] → ConfirmDialog 确认 + 警告「从 VRChat 永久删除」

## 空状态

- 全部：「添加账号后云端模型会自动出现」
- 本地：ImportDropZone 占满
- 云端：「添加账号查看云端模型」
