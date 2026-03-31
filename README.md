# AvatarPublisher Frontend

私人 VRChat 模型管理平台 `AvatarPublisher` 的桌面前端。

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面壳 | Electron 41 |
| 渲染 | React 19 |
| 语言 | TypeScript 6 |
| 构建 | electron-vite 5 + Vite 7 |
| 动画 | Motion 12 (framer-motion) |
| 图标 | lucide-react |
| 样式 | CSS variables + hand-written CSS (Frost Bento v5) |
| 通信 | HTTP JSON + SSE |

## 功能

- **主页** — 统计概览 + 活跃发布任务 SSE 实时监控 + 最近活动
- **模型库** — 本地/云端模型统一浏览，三 tab 切换，搜索，详情弹窗（编辑/下载/发布）
- **发布** — 4 步向导（选模型 → 选账号 → 配置 → 预检），多模型独立配置，SSE 实时监控
- **历史** — 发布记录 + 活动时间线，分页，详情弹窗
- **账号** — 多账号管理，登录/2FA/导入/修复/登出
- **设置** — 代理配置（HTTP/SOCKS5），存储路径，关于信息

## 设计系统

Frost Bento v5 — 冷调清透毛玻璃风格。

- 色板: `#f1f2f2` · `#c8d8e1` · `#89bdd3` · `#c6d3d0`
- 品牌色: `#4A93AD`
- 字体: DM Sans + Noto Sans SC + Playfair Display
- 动画: Physics spring (snappy / smooth / gentle / bouncy)
- 设计文档: `design-system/MASTER.md`

## 运行

```bash
# 安装依赖
npm install

# 开发模式 (需要后端运行在 127.0.0.1:38124)
npm run dev

# 类型检查
npm run typecheck

# 构建
npm run build
```

## 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `VITE_BACKEND_BASE_URL` | `http://127.0.0.1:38124/api/v1` | 后端 API 地址 |

## 目录结构

```
src/
  main/index.ts              # Electron 主进程
  preload/index.ts            # Context bridge (IPC)
  renderer/src/
    app/                      # 应用壳 (Providers, Sidebar, Navigation)
    features/
      home/                   # 主页
      library/                # 模型库
      publish/                # 发布向导 + 监控
      history/                # 历史记录
      accounts/               # 账号管理
      search/                 # 全局搜索 (Cmd+K)
      settings/               # 设置
    shared/
      components/             # 通用组件
      hooks/                  # 通用 hooks
      domain/                 # 业务逻辑
      format/                 # 格式化工具
    contracts/                # TypeScript 类型 (后端 DTO)
    lib/                      # API client, SSE, Desktop bridge
    styles.css                # Frost Bento v5 设计系统
```

## 架构

- **状态管理**: React Context (Api, Connection, Accounts, ActivePublish, Navigation, Toast)
- **数据获取**: 自建 useQuery / useMutation (无外部库)
- **SSE**: useEventStream + startTransition
- **页面保活**: KeepAlive (display:none 切换)
- **断连恢复**: ConnectionContext 自动全局刷新
- **模态**: createPortal + 背景锁定

## 后端依赖

- .NET 10 / ASP.NET Core Minimal API
- 38+ HTTP JSON 端点 + SSE 事件流
- 默认监听 `http://127.0.0.1:38124`
