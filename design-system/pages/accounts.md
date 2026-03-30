# Accounts

> 参照 MASTER.md + INTERACTION.md

## API

`GET /accounts`，`GET /accounts/{id}`，`GET /accounts/import-source`
`POST /accounts/login`，`POST /accounts/login/verify-2fa`，`POST /accounts/login/cancel`
`POST /accounts/import`
`POST /accounts/{id}/refresh,set-default,logout,repair`
`DELETE /accounts/{id}`

## 布局

顶部：页面标题 + [登录] [导入] 按钮。主体：账号卡片垂直列表（AccountListItem）。

## 账号卡片 (AccountListItem)

列表项卡片，layout 动画。

左侧：头像圆（首字母大写）+ 用户信息（displayName + loginName 两行）
中间：状态圆点 + 状态文字
右侧：「可发布」Badge（仅 `canPublishAvatars && sessionValid` 时显示）+ 操作按钮

状态映射（sessionTone + sessionLabel）：
- sessionValid=true → ● 已连接（--ok）
- PendingTwoFactor → ▲ 等待验证（--warn）
- needsReauthentication && !sessionValid → ▲ 需重连（--warn）+ 左侧 3px 竖线
- LoggedOut → ○ 已登出（无圆点）
- 其他 → sessionIssue 文案 或 "异常"

默认账号 → ★ Star 图标（11px）。

## 操作（简化设计）

仅两个内联按钮：
- [↻ 刷新] = `POST /accounts/{id}/refresh`（带 loading spinner）
- [··· 更多] = 打开 portal-based 更多菜单

**更多菜单（createPortal 挂载 document.body）：**
菜单定位于触发按钮下方。包含：
- 设为默认（Star 图标，非默认账号时显示）
- 修复（Wrench 图标，`supportsAutoRepair` 时显示）
- 重新登录（KeyRound 图标，`needsReauthentication` 时显示）
- 分割线
- 登出（LogOut 图标，需 ConfirmDialog 确认）
- 删除（Trash2 图标，danger 样式，需 ConfirmDialog 确认 + 不可撤销警告）

点击菜单外部或执行操作后自动关闭。

## 登录 Modal (LoginModal)

独立 Modal 组件（400px），毛玻璃幕布 blur(8px) + scale 0.95→1。

**登录流程：**
1. 用户名/邮箱 + 密码 → `POST /accounts/login`
2. 返回状态判断：
   - `status: "completed"` 或包含 `account` → 登录成功，Modal 关闭，列表刷新
   - `status: "requires_totp"` 或 `"requires_email_otp"` → 保存 challengeId，AnimatePresence 切换为验证码输入（方向感知动画：凭证向左退出，验证码从右进入）
3. 验证码 6 位数字（inputMode: "numeric"，自动聚焦 codeRef，输入自动过滤非数字）→ `POST /accounts/login/verify-2fa`
4. 返回按钮 → `POST /accounts/login/cancel` 取消 challenge，reset verify 状态，回到凭证步骤

Modal 关闭时自动 reset 全部状态。

## 导入 Modal (ImportModal)

独立 Modal。
1. 自动填充建议路径（`GET /accounts/import-source`）
2. 选择文件 → `POST /accounts/import`

## 空状态

EmptyState 组件：「添加 VRChat 账号」+ [添加] 按钮。居中。
