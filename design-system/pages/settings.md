# Settings

> 参照 MASTER.md + INTERACTION.md

## API

`GET /settings/network`，`PUT /settings/network`
`GET /settings/storage`，`PUT /settings/storage`
`GET /health`

## 布局

单列 max-width 480px。三个 card 区块纵向排列。进场动画 spring.gentle。

## 网络代理

卡片样式模式选择器（三张可点击卡片，非 radio 按钮）：
- 跟随系统（system）— "使用操作系统代理设置"
- 直连（none）— "不通过任何代理"
- 自定义（custom）— "手动指定代理服务器"

选中卡片 = `proxy-mode-card--active` 样式高亮。

**自定义模式展开字段（三字段拆分，非单行 URL）：**
- 协议 Select（HTTP / SOCKS5）→ ProxyProtocol
- 地址 Input（placeholder: 127.0.0.1）→ host
- 端口 Input（placeholder: 7890，纯数字，inputMode: "numeric"）→ port

保存时组装为完整 URL（`buildProxyUrl(protocol, host, port)`）→ `PUT /settings/network`。
保存成功后按钮短暂显示「已保存」（1.5s timer）。

## 存储路径

数据源：`GET /settings/storage`（返回 `{ basePath: string }`）

- 路径输入框 + 文件夹选择按钮（FolderOpen 图标，调用 desktop bridge `pickDirectory`）
- 编辑后才显示保存按钮（`hasChanges = editPath !== null && editPath !== data.basePath`）
- 保存 = `PUT /settings/storage`，成功后 refetch + reset editPath

## 关于

双列 grid 布局（about-grid）：

后端信息（来自 `GET /health`）：
- 后端服务名
- 后端版本（mono 字体）
- 后端状态（StatusDot + 正常/异常）
- 后端地址（`resolveBackendBaseUrl()`，mono 字体）

客户端信息（来自 `window.avatarBatchPublisher.versions`）：
- Electron 版本
- Chrome 版本
- Node 版本
