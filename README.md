# AvatarBatchPublisher Frontend

VRChat 模型管理平台的桌面前端，基于 Electron + React 构建。

## 截图

<img width="1189" alt="AvatarBatchPublisher Frontend screenshot" src="https://github.com/user-attachments/assets/58b8bcc3-a412-4aa4-8c5a-c82b96e22f8b" />

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面壳 | Electron 41 |
| 渲染 | React 19 |
| 语言 | TypeScript 6 |
| 构建 | electron-vite 5 + Vite 7 |
| 动画 | Motion 12 (framer-motion) |
| 图标 | lucide-react |
| 样式 | Hand-written CSS (Frost Bento v5 设计系统) |
| 通信 | HTTP JSON + Server-Sent Events |

## 功能

- **主页** — 统计概览、活跃发布任务 SSE 实时监控、最近活动时间线
- **模型库** — 本地/云端模型统一浏览，搜索，详情弹窗（编辑/下载/发布）
- **发布** — 4 步向导式批量发布，多模型独立配置，SSE 实时监控
- **历史** — 发布记录 + 活动时间线，分页，详情弹窗
- **账号** — 多账号管理，登录/2FA 验证/会话导入/修复
- **设置** — 代理配置（HTTP/SOCKS5），存储路径，系统信息

## 设计系统

**Frost Bento v5** — 冷调清透毛玻璃风格，克制即美。

- 色板: `#f1f2f2` · `#c8d8e1` · `#89bdd3` · `#c6d3d0`
- 品牌色: `#4A93AD`
- 字体: DM Sans + Noto Sans SC + Playfair Display
- 动画: Physics-based spring (snappy / smooth / gentle / bouncy)
- 详见 `design-system/` 目录

## 本地开发

```bash
npm install
npm run dev        # 需要后端运行在 127.0.0.1:38124
npm run typecheck
npm run build
```

## 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `VITE_BACKEND_BASE_URL` | `http://127.0.0.1:38124/api/v1` | 后端 API 地址 |

## 目录结构

```
src/
  main/                       # Electron 主进程
  preload/                    # Context bridge (IPC)
  renderer/src/
    app/                      # 应用壳 (Providers, Sidebar, Navigation)
    features/                 # 页面 (home, library, publish, history, accounts, settings, search)
    shared/                   # 通用组件、hooks、业务逻辑、格式化
    contracts/                # TypeScript 类型定义 (后端 DTO)
    lib/                      # API client, SSE, Desktop bridge
    styles.css                # Frost Bento v5 设计系统
design-system/                # 设计规范文档
```

## License

MIT
