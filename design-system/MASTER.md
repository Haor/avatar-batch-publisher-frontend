# AvatarPublisher — Design System

> 私人 VRChat 模型管理台
> 色板: #f1f2f2 · #c8d8e1 · #89bdd3 · #c6d3d0
> 组件基础: 自有组件 + CSS token（无 shadcn/ui）
> 平台: Electron (macOS vibrancy / Windows acrylic)

---

## Philosophy

**克制即美。**

每一个像素、每一段文字、每一帧动画都必须回答一个问题：「如果去掉它，用户会失去什么？」如果答案是「什么都不会」，那就去掉。

这不是一个需要学习的工具。打开它，看一眼就知道该做什么。没有欢迎语，没有引导气泡，没有「开始使用」。布局本身就是说明书。

### 原则

1. **元素必须自证存在** — 没有装饰性文字、没有空泛的副标题、没有「这里可以 xxx」的提示。界面元素用自身的位置、形状、状态来传达含义。
2. **留白是设计的一部分** — 空间不是「还没填东西」，而是让内容呼吸。间距要大方，但精确到像素。
3. **动画是叙事，不是装饰** — 面板滑出是为了告诉用户「内容从这里来」。进度条流动是为了传递「事情正在发生」。没有理由的动画就是噪音。
4. **颜色克制使用** — 界面大部分是灰白和蓝灰。品牌色只在用户需要注意的地方出现。语义色只在状态改变时出现。
5. **一眼可扫** — 用户目光落在页面上 2 秒内，必须知道：我在哪、有什么、能做什么。靠布局层级实现，不靠文字解释。

---

## Color

```css
:root {
  /* 色板原色 */
  --ice:    #f1f2f2;  /* 基底 */
  --mist:   #c8d8e1;  /* 轻雾 */
  --sky:    #89bdd3;  /* 天际 */
  --sage:   #c6d3d0;  /* 薄荷 */

  /* 背景 */
  --bg:          #f1f2f2;
  --bg-card:     #FAFBFC;
  --bg-hover:    #F4F6F8;
  --bg-elevated: #FFFFFF;
  --bg-glass:    rgba(250, 251, 252, 0.78);
  --bg-inset:    #E6EAED;

  /* 品牌 — 天空蓝加深，白字对比 ≥ 4.5:1 */
  --brand:       #4A93AD;
  --brand-hover: #3B8099;
  --brand-soft:  #D6EAF2;

  /* 文本 */
  --fg:          #1C2B33;
  --fg-muted:    #5A6D78;
  --fg-faint:    #8D9DA7;
  --fg-inverse:  #FAFBFC;

  /* 边框 */
  --line:        rgba(137, 189, 211, 0.16);
  --line-strong: rgba(137, 189, 211, 0.30);

  /* 语义 */
  --ok:      #3A9E85;
  --ok-soft:  rgba(58, 158, 133, 0.10);
  --warn:    #C49A3C;
  --warn-soft: rgba(196, 154, 60, 0.10);
  --err:     #C0584A;
  --err-soft: rgba(192, 88, 74, 0.10);

  /* 阴影 */
  --shadow-sm:    0 1px 3px rgba(28, 43, 51, 0.05);
  --shadow-md:    0 4px 16px rgba(28, 43, 51, 0.07);
  --shadow-lg:    0 12px 40px rgba(28, 43, 51, 0.09);
  --shadow-float: 0 8px 28px rgba(74, 147, 173, 0.12);
}
```

**用色纪律：**
- 大面积只有 `--bg` `--bg-card` `--fg` `--fg-muted`
- `--brand` 仅出现在：主按钮、选中态、进度条、链接
- `--sky` `--sage` `--mist` 用于微妙的装饰区分，不能抢视觉焦点
- 语义色只在状态实际发生时出现，静态界面中不应有红绿黄

---

## Typography

```css
:root {
  --font:      'DM Sans', 'Noto Sans SC', 'Noto Sans JP', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

**DM Sans** — 几何无衬线体，克制、现代、有设计感但不张扬。比 Inter 有个性，比 Nunito 更收敛。

| 层级 | 大小 | 字重 | 行高 | 用途 |
|------|------|------|------|------|
| h1 | 24px | 600 | 1.2 | 页面标题，每页仅一个 |
| h2 | 16px | 600 | 1.3 | 区块标题 |
| body | 14px | 400 | 1.5 | 正文 |
| caption | 13px | 400 | 1.4 | 次要信息 |
| label | 11px | 500 | 1 | 表单标签、Tab、徽标 |
| mono | 13px | 400 | 1.4 | ID、路径、技术值 |

**规则：**
- 不使用 uppercase / letter-spacing 做标签 — 太「企业感」
- 不使用 bold (700) — 600 是最重的。页面不该有需要加粗才能看到的东西
- 标题不需要装饰。不加图标、不加背景色、不加下划线。它的字号和位置已经说明了一切

---

## Space

间距基础单位: **4px**

```
4  8  12  16  24  32  48  64
```

**布局：**

```
┌──────────────────────────────────────────────────┐
│                                                    │
│  ┌────────┬───────────────────────────────────┐   │
│  │        │                                    │   │
│  │ 侧边栏  │  内容区                            │   │
│  │ 232px  │  padding: 32px                     │   │
│  │        │  max-width: 960px                  │   │
│  │        │                                    │   │
│  └────────┴───────────────────────────────────┘   │
│                                                    │
└──────────────────────────────────────────────────┘
```

- 侧边栏 **232px**（容纳账号头像区 + 连接状态）
- 内容区 padding **32px**，内容最大宽度 **960px**
- 卡片间距 **16px**
- 卡片内 padding **20px**
- 表单字段间距 **16px**

**留白规则：**
- 页面标题与第一个内容块之间：**32px**
- 内容区块之间：**24px**
- 页面底部保留至少 **64px** 空白 — 不要让内容贴底

---

## Motion

动画库: **Motion** (framer-motion v11+)

```
npm install motion
```

物理弹簧驱动，不是贝塞尔曲线。弹簧有质量、有惯性、有阻尼 — 这是「高级感」的来源。CSS transition 只能从 A 到 B 画一条曲线；弹簧会自然地过冲、回弹、安定，像真实世界的物体。

### 弹簧预设

```tsx
// springs.ts — 项目唯一的动画配置文件

export const spring = {
  // 快弹簧 — 按钮反馈、状态点变色、微交互
  // 硬而快，几乎无过冲，像轻敲玻璃
  snappy:  { type: "spring", stiffness: 500, damping: 30, mass: 0.5 },

  // 标准弹簧 — 面板滑入、Tab 指示器滑动、卡片选中
  // 明确的过冲 + 优雅的安定，像推开一扇轻门
  smooth:  { type: "spring", stiffness: 300, damping: 26, mass: 0.8 },

  // 慢弹簧 — 页面进场、大面积布局变化
  // 从容不迫，像一片叶子落在水面
  gentle:  { type: "spring", stiffness: 170, damping: 22, mass: 1 },

  // 弹性弹簧 — 完成打勾、拖拽释放、成功反馈
  // 明显的回弹，唯一允许「活泼」的场景
  bouncy:  { type: "spring", stiffness: 400, damping: 15, mass: 0.6 },
} as const;
```

### CSS 层 — 仅用于不需要 JS 的简单过渡

```css
:root {
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
}
```

仅用于 `background-color`, `border-color`, `opacity` 等不涉及布局的属性。涉及位移、缩放、布局变化的一律用 Motion 弹簧。

---

### 1. 页面切换 — CSS 动画 + KeepAlive

页面使用 KeepAlive 保持实例，首次进入播放 CSS `pageIn` 动画（380ms），后续切换即时显示。不使用 AnimatePresence — 避免页面卸载重建。

```css
/* 首次进场动画 */
.page--entering {
  animation: pageIn 380ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes pageIn {
  from { opacity: 0; filter: blur(6px); transform: translateY(8px); }
  to   { opacity: 1; filter: blur(0px); transform: translateY(0); }
}
```

```tsx
// PageSlot — 每个页面只在首次激活时播放进场动画
function PageSlot({ pageKey, active, children }) {
  const hasAnimatedRef = useRef(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (active && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 420);
      return () => clearTimeout(timer);
    }
  }, [active]);

  return (
    <div className={`page ${active ? "" : "page--hidden"} ${animating ? "page--entering" : ""}`}>
      {children}
    </div>
  );
}
```

所有页面实例通过 `visited` Set 保留（KeepAlive），切换时只切 `page--hidden` display。

### 2. 内容交错进场 — stagger

```tsx
// StaggerContainer.tsx
const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04 }  // 40ms 间隔，不是 50
  }
};

const item = {
  hidden: { opacity: 0, y: 8, filter: "blur(4px)" },
  show: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: spring.gentle,
  }
};

<motion.div variants={container} initial="hidden" animate="show">
  <motion.div variants={item}>...</motion.div>
  <motion.div variants={item}>...</motion.div>
  <motion.div variants={item}>...</motion.div>
</motion.div>
```

40ms stagger — 比 50ms 更紧凑。配合 blur，每个元素像从薄雾中依次显现。

### 3. 导航指示器 — layoutId 滑动

侧边栏的选中态高亮不是瞬间切换 — 它从上一个位置**滑**到下一个。

```tsx
// NavItem.tsx
{items.map(item => (
  <button key={item.key} onClick={() => setActive(item.key)}>
    {active === item.key && (
      <motion.div
        layoutId="nav-indicator"
        className="nav-indicator"
        transition={spring.smooth}
      />
    )}
    <Icon /><span>{item.label}</span>
  </button>
))}
```

```css
.nav-indicator {
  position: absolute;
  inset: 0;
  background: var(--brand-soft);
  border-radius: 8px;
  z-index: -1;
}
```

`layoutId` 让 Motion 自动计算两个位置之间的插值。弹簧让它不是匀速滑动，而是先快后慢、微微过冲。像水银在管中流动。

### 4. 详情弹窗 — 居中 Modal + 毛玻璃幕

详情不再是右侧滑入面板，而是居中弹窗（`createPortal` 挂载到 `document.body`）。双列布局：封面左 + 信息右。

```tsx
// DetailPanel.tsx — createPortal 居中弹窗
createPortal(
  <motion.div
    className="detail-backdrop"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
    onClick={onClose}
  >
    <motion.div
      className="detail-modal"
      initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
      transition={spring.smooth}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  </motion.div>,
  document.body,
)
```

弹窗打开时锁定背景滚动，补偿滚动条宽度防止布局抖动。

### 5. Modal — 从点击点缩放 + 毛玻璃幕

```tsx
// Modal.tsx
<motion.div
  className="modal-backdrop"
  initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
  animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
  exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
/>
<motion.div
  className="modal"
  initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
  exit={{ opacity: 0, scale: 0.97, filter: "blur(4px)" }}
  transition={spring.smooth}
/>
```

Modal 从 0.95 缩放到 1 — 不是从 0 缩放（太戏剧），0.95 刚好有「浮出」的感觉。幕布是 blur(8px) 的毛玻璃，不是黑色遮罩。

### 6. Tab 切换 — 下划线滑动 + 内容方向感知

```tsx
// Tab underline — 和导航指示器同理
<motion.div layoutId="tab-underline" transition={spring.snappy} />

// Tab content — 根据方向决定进出方向
const direction = newIndex > oldIndex ? 1 : -1;

<AnimatePresence mode="wait" custom={direction}>
  <motion.div
    key={activeTab}
    custom={direction}
    initial={{ opacity: 0, x: direction * 30, filter: "blur(4px)" }}
    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
    exit={{ opacity: 0, x: direction * -30, filter: "blur(4px)" }}
    transition={spring.smooth}
  />
</AnimatePresence>
```

向右切 Tab，旧内容向左退出、新内容从右进入。向左切则相反。用户能感知到 Tab 的空间关系。

### 7. 按钮 — 按下缩放 (whileTap)

```tsx
<motion.button
  whileTap={{ scale: 0.97 }}
  transition={spring.snappy}
>
  发布
</motion.button>
```

只在 `tap` 时缩放，`hover` 时不缩放不位移 — hover 只改颜色（CSS 过渡）。0.97 = 收缩 3% — 像真的按下了一个物理按钮。弹簧让松手后有一个微小的回弹。

### 8. 卡片选中 — 边框 + 光晕

```tsx
// ModelCard.tsx
<motion.div
  className="card-interactive"
  animate={{
    borderColor: selected ? "var(--brand)" : "var(--line)",
    boxShadow: selected
      ? "0 0 0 3px var(--brand-soft)"
      : "0 0 0 0px transparent",
  }}
  transition={spring.snappy}
/>
```

选中时品牌色边框 + 外发光环同时出现。弹簧让光环有一个「绽放」的感觉，不是瞬间出现。

### 9. 进度条 — 弹簧宽度 + 前缘光晕

```tsx
<motion.div
  className="progress-fill"
  animate={{ width: `${percent}%` }}
  transition={spring.gentle}
/>
```

```css
.progress-fill {
  position: relative;
}
.progress-fill::after {
  content: '';
  position: absolute;
  right: 0; top: -2px; bottom: -2px;
  width: 16px;
  background: radial-gradient(ellipse at right, var(--brand-soft), transparent);
  border-radius: 0 4px 4px 0;
  opacity: 0.7;
}
```

进度条前端有一个柔和的光晕。它不是额外的装饰 — 它指引用户的视线到「进度正在推进的位置」。

### 10. 数字跳变 — 弹簧插值

进度百分比、计数器不是直接跳变 — 它们在数字之间平滑滑动。

```tsx
// AnimatedNumber.tsx
function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, Math.round);
  const display = useMotionTemplate`${rounded}`;

  useEffect(() => {
    animate(motionValue, value, spring.gentle);
  }, [value]);

  return <motion.span>{display}</motion.span>;
}
```

「2/5 完成」变成「3/5 完成」时，3 不是突然出现的 — 它从 2 滑动到 3。微妙但潜意识能感知。

### 11. 步骤指示器 — 数字变勾 + 连接线填充

```tsx
// StepNumber.tsx — 完成时数字变成 Check 图标
<AnimatePresence mode="wait">
  {completed ? (
    <motion.div
      key="check"
      initial={{ scale: 0, rotate: -45 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={spring.bouncy}
    >
      <Check size={14} />
    </motion.div>
  ) : (
    <motion.span key="number" exit={{ scale: 0.5, opacity: 0 }}>
      {number}
    </motion.span>
  )}
</AnimatePresence>

// StepConnector.tsx — 连接线从左到右填充
<div className="step-connector">
  <motion.div
    className="step-connector-fill"
    animate={{ scaleX: completed ? 1 : 0 }}
    style={{ transformOrigin: "left" }}
    transition={spring.smooth}
  />
</div>
```

数字变勾是唯一使用 `spring.bouncy` 的场景 — 完成是值得庆祝的时刻。连接线的 scaleX 从 0 到 1，从左端开始生长。

### 12. 列表项增删 — 高度动画 + 淡入淡出

```tsx
<AnimatePresence>
  {items.map(item => (
    <motion.div
      key={item.id}
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={spring.smooth}
    />
  ))}
</AnimatePresence>
```

`layout` prop 让其他列表项在增删时平滑重排，不是跳变。新项从 height:0 展开，被删项收缩到 0 后消失。

### 13. 拖拽区 — 拖入时边框脉动

```tsx
<motion.div
  className="dropzone"
  animate={{
    borderColor: isDragging ? "var(--brand)" : "var(--line-strong)",
    background: isDragging ? "var(--brand-soft)" : "transparent",
  }}
  transition={spring.snappy}
/>
```

### 14. 状态点变色 — 缩放脉冲

状态从「已连接」变为「需重连」时，圆点不是瞬间变色 — 它先放大 1.8x 再回弹到 1x，同时颜色过渡。

```tsx
<motion.div
  className="status-dot"
  animate={{
    backgroundColor: color,
    scale: [1, 1.8, 1],  // keyframes: 放大再回弹
  }}
  transition={spring.bouncy}
/>
```

只在**状态实际变化时**触发。静态渲染时不动。

---

### 禁止

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Motion 层面也要检测:
```tsx
const prefersReduced = useReducedMotion();
const transition = prefersReduced ? { duration: 0 } : spring.smooth;
```

**绝不做的：**
- 卡片悬停 scale — 布局抖动
- 按钮悬停 translateY — 错误语义
- 任何无限循环动画 (除进度条前缘光晕)
- 骨架屏 shimmer
- 页面切换 slide（整页滑动太重，用 blur 淡入更轻）
- 超过 1 秒的任何动画

---

## Components

### 卡片

```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
}
```

无悬停动画。只有可交互卡片 (`.card-interactive`) 在悬停时改变阴影和边框色：

```css
.card-interactive {
  cursor: pointer;
  transition: box-shadow 250ms var(--ease-micro),
              border-color 250ms var(--ease-micro);
}
.card-interactive:hover {
  box-shadow: var(--shadow-float);
  border-color: var(--line-strong);
}
```

### 按钮

三种，不多不少：

```css
/* 主要 — 品牌色填充 */
.btn {
  height: 36px;
  padding: 0 16px;
  border-radius: 10px;
  font: 500 14px/1 var(--font);
  cursor: pointer;
  transition: background 150ms var(--ease-micro),
              opacity 150ms;
}
.btn-primary {
  background: var(--brand);
  color: var(--fg-inverse);
  border: none;
}
.btn-primary:hover { background: var(--brand-hover); }
.btn-primary:disabled { opacity: 0.4; cursor: default; }

/* 次要 — 透明 + 边框 */
.btn-secondary {
  background: transparent;
  color: var(--fg);
  border: 1px solid var(--line-strong);
}
.btn-secondary:hover { background: var(--bg-hover); }

/* 幽灵 — 无边框 */
.btn-ghost {
  background: transparent;
  color: var(--fg-muted);
  border: none;
}
.btn-ghost:hover { background: var(--bg-inset); color: var(--fg); }
```

### 输入框

```css
.input {
  height: 36px;
  padding: 0 12px;
  background: var(--bg-inset);
  border: 1.5px solid transparent;
  border-radius: 10px;
  font: 400 14px var(--font);
  color: var(--fg);
  transition: border-color 200ms, box-shadow 200ms;
}
.input:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-soft);
}
.input::placeholder { color: var(--fg-faint); }
```

### 状态点

不用 badge 文字，用一个 6px 圆点 + 一行文字说明：

```css
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-dot--ok   { background: var(--ok); }
.status-dot--warn { background: var(--warn); }
.status-dot--err  { background: var(--err); }
```

### 侧边栏

```css
.sidebar {
  width: 232px;
  height: 100vh;
  position: fixed;
  background: var(--bg-glass);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-right: 1px solid var(--line);
  padding: 16px 8px;
  -webkit-app-region: drag;
}

.nav-item {
  -webkit-app-region: no-drag;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  font: 500 13px var(--font);
  color: var(--fg-muted);
  cursor: pointer;
  transition: background 150ms, color 150ms;
}
.nav-item:hover {
  background: var(--bg-inset);
  color: var(--fg);
}
.nav-item[data-active] {
  background: var(--brand-soft);
  color: var(--brand);
}
```

### 详情弹窗

居中 Modal，取代旧版右侧滑入面板。通过 `createPortal` 挂载到 `document.body`。

```css
.detail-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(28, 43, 51, 0.25);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.detail-modal {
  background: var(--bg-elevated);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  padding: 28px;
  max-width: 640px;
  width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
}
```

### 拖拽区

```css
.dropzone {
  border: 1.5px dashed var(--line-strong);
  border-radius: 14px;
  padding: 32px;
  text-align: center;
  color: var(--fg-faint);
  font: 400 14px var(--font);
  cursor: pointer;
  transition: border-color 200ms, background 200ms;
}
.dropzone:hover,
.dropzone.active {
  border-color: var(--brand);
  background: var(--brand-soft);
  color: var(--brand);
}
```

### 进度条

```css
.progress {
  height: 4px;
  background: var(--bg-inset);
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--brand);
  border-radius: 2px;
  transition: width 600ms var(--ease-out);
}
```

高度 **4px**，不是 6px — 够了。

---

## Icons

Lucide Icons, stroke-width: 1.75（默认 2 太粗，1.5 太细）

| 用途 | 图标 | 尺寸 |
|------|------|------|
| 导航 | Home, Layers, Send, History, Users, Settings | 17px |
| 操作 | Plus, Search, X, Check, Trash2, Pencil, Download, Upload | 16px |
| 状态 | AlertTriangle, XCircle, CheckCircle | 16px |
| 指示 | ChevronRight, ChevronDown, MoreHorizontal, RefreshCw | 14px |
| 来源 | HardDrive (本地), Cloud (云端) | 14px |

---

## Don't

| 规则 | 原因 |
|------|------|
| 不写「欢迎回来」「你可以在这里...」 | 多余。用户知道他打开了什么 |
| 不用 toast 确认常规操作 | 保存成功？按钮恢复原状就是确认 |
| 不给页面加副标题 | 标题已经说清了。副标题 = 标题没写好 |
| 不用 tooltip 解释已经有文字的按钮 | 重复信息 |
| 不在空状态写大段引导文字 | 一行足矣 |
| 不用 skeleton / shimmer 做加载态 | 桌面本地应用，数据加载 < 200ms。真的慢就用进度条 |
| 不给卡片加悬停缩放 | 布局抖动 |
| 不给按钮加 translateY 悬停 | 错误语义 |
| 不用 uppercase + letter-spacing | 太 corporate |
| 不用 bold (700) | 600 已经够重了 |
| 不用暖色调 | 与色板冲突 |
| 不用 emoji 做图标 | 不可控 |
| 不用技术术语 | 制品→模型，队列→任务，会话→登录，预检→检查 |

---

## React Patterns

技术栈: React 19 + Electron 41 + Motion (framer-motion)。自有组件库（无 shadcn/ui）。无 SSR、无 Next.js。

### 保护动画帧 — startTransition

SSE 消息到达时，Motion 动画可能正在播放。同步 setState 会抢占渲染帧，导致动画卡顿。

```tsx
// SSE 回调中
eventSource.onmessage = (e) => {
  const data = JSON.parse(e.data);
  startTransition(() => {
    setEvents(prev => [...prev, data]);
  });
};
```

所有不需要立即反映到 UI 的更新（SSE 流、后台刷新、日志追加）都用 `startTransition` 包裹。React 会让出帧给动画。

### SSE/IPC 订阅 — ref 稳定回调

EventSource 和 ipcRenderer 订阅不能因为父组件 re-render 就断开重连。

```tsx
function useStableCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef(fn);
  useEffect(() => { ref.current = fn; });
  return useCallback((...args: any[]) => ref.current(...args), []) as T;
}

// 使用
function useSSE(url: string, onEvent: (data: any) => void) {
  const stableOnEvent = useStableCallback(onEvent);

  useEffect(() => {
    const es = new EventSource(url);
    es.onmessage = (e) => stableOnEvent(JSON.parse(e.data));
    return () => es.close();
  }, [url]); // 只在 url 变化时重连
}
```

### 避免 barrel import — 直接路径

没有 Next.js `optimizePackageImports` 保护。Lucide 的 barrel export 会拉入全部 1500+ 图标。

```tsx
// 错误 — 加载全部图标
import { Check, X, Send } from 'lucide-react';

// 正确 — 只加载 3 个
import { Check } from 'lucide-react/dist/esm/icons/check';
import { X } from 'lucide-react/dist/esm/icons/x';
import { Send } from 'lucide-react/dist/esm/icons/send';
```

或者在 vite.config 中配置 optimizeDeps，让 Vite 的 tree-shaking 处理。验证方式: 检查 bundle 分析中 lucide 的体积。

### 惰性初始化 — useState 函数形式

从 localStorage / electron-store 读初始值时，不传值，传函数。

```tsx
// 错误 — 每次 render 都执行 JSON.parse
const [settings, set] = useState(JSON.parse(localStorage.getItem('s') ?? '{}'));

// 正确 — 只在首次 render 执行
const [settings, set] = useState(() => JSON.parse(localStorage.getItem('s') ?? '{}'));
```

### Memo 保护 SSE 驱动的列表

SSE 每秒推送事件时，列表父组件频繁 re-render。每个列表项如果包含 Card + Motion 包装器，re-render 代价很高。

```tsx
const EventItem = memo(function EventItem({ event }: { event: SSEEvent }) {
  return (
    <motion.div layout transition={spring.smooth}>
      <Card>...</Card>
    </motion.div>
  );
});
```

### 长列表 — CSS content-visibility

模型库可能有上百个卡片。不用虚拟滚动，用浏览器原生跳过离屏布局：

```css
.model-card {
  content-visibility: auto;
  contain-intrinsic-size: 0 240px;
}
```

注意: 正在执行 Motion `layout` 动画的元素不加此属性。

### 重组件懒加载

发布监控视图含 SSE 逻辑 + Motion 动画 + 大量状态。不在首屏加载。

```tsx
const PublishMonitor = lazy(() => import('./features/publish/monitor'));

// 使用处
<Suspense fallback={<div className="h-64" />}>
  <PublishMonitor queueId={id} />
</Suspense>
```

### 条件渲染 — 显式三元

数字值用 `&&` 会渲染 `0`。

```tsx
// 错误 — count 为 0 时页面显示 "0"
{count && <span>{count}</span>}

// 正确
{count > 0 ? <span>{count}</span> : null}
```

### 派生状态 — 订阅布尔值而非连续值

窗口宽度变化时不要订阅像素值，订阅断点布尔：

```tsx
// 错误 — 拖拽调整窗口时每像素一次 re-render
const [width, setWidth] = useState(window.innerWidth);

// 正确 — 只在断点跨越时 re-render
const isCompact = useMediaQuery('(max-width: 1199px)');
```

---

## Tech Stack

```
React 19          — 渲染
Electron 41       — 桌面壳
Motion 11+        — 物理弹簧动画
自有组件库         — Modal / Input / Select / Badge / StatusDot 等（无 shadcn/ui）
Vite 7            — 构建
TypeScript 6      — 类型
DM Sans           — 字体
Noto Sans SC/JP   — CJK 字体
Lucide            — 图标 (stroke-width: 1.75)
CSS Variables     — 设计 token
```

---

## Accessibility

- 文本对比度 ≥ 4.5:1
- 可交互元素: `cursor: pointer` + `focus-visible` 环
- 图标按钮: `aria-label`
- 表单: `<label>` 关联
- 异步按钮: 加载时 `disabled`
- 颜色不是唯一指示（配合图标或文字）
- 尊重 `prefers-reduced-motion`（CSS + Motion useReducedMotion）
- Tab 顺序 = 视觉顺序
- Modal: Escape 关闭 + 点击幕布关闭 + createPortal 隔离
- SSE 更新: 用 `startTransition` 避免阻塞辅助技术
