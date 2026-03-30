import { motion } from "motion/react";
import { Home, Layers, Send, History, Users, Settings, Plus } from "lucide-react";
import { spring } from "../shared/springs";
import { StatusDot } from "../shared/components/StatusDot";
import { ConnectionStatus } from "../shared/components/ConnectionStatus";
import { useAccounts } from "./AccountsContext";
import { useNavigation } from "./NavigationContext";
import type { PageKey } from "./navigation";
import { navItems, settingsItem } from "./navigation";

const iconMap: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  Home, Layers, Send, History, Users, Settings,
};

interface SidebarProps {
  active: PageKey;
  onNavigate: (key: PageKey) => void;
}

function NavButton({ item, active, onNavigate }: {
  item: { key: PageKey; label: string; icon: string };
  active: PageKey;
  onNavigate: (key: PageKey) => void;
}) {
  const Icon = iconMap[item.icon];
  const isActive = active === item.key;
  return (
    <button
      className="nav-item"
      data-active={isActive || undefined}
      onClick={() => onNavigate(item.key)}
    >
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className="nav-indicator"
          transition={spring.smooth}
        />
      )}
      <Icon size={17} strokeWidth={1.75} />
      <span>{item.label}</span>
    </button>
  );
}

function Logo() {
  return (
    <svg
      className="sidebar-logo"
      viewBox="0 0 82 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ABP"
    >
      {/* A — 高对比衬线体：粗左腿 + 细右腿 + 细横杠 */}
      <path
        fillRule="evenodd"
        d="M10.5 2 L0 24 L3.8 24 L6.2 18.2 L15.2 18.2 L18.2 24 L20 24 L10.5 2Z M7 16.5 L10.5 6 L14.4 16.5Z"
        fill="var(--fg)"
      />
      {/* B — 粗竖干 + 优雅双弧 */}
      <path
        fillRule="evenodd"
        d="M26 2 L26 24 L34.5 24 C38.5 24 41 21.5 41 18.2 C41 15.5 39.2 13.5 36.2 12.8 C38.5 12 40 10.2 40 7.8 C40 4.5 37.5 2 33.5 2Z M29.2 4.8 L33 4.8 C35.8 4.8 37.5 6 37.5 8 C37.5 10 35.8 11.2 33 11.2 L29.2 11.2Z M29.2 13.5 L34 13.5 C37 13.5 38.5 15 38.5 17.2 C38.5 19.5 37 21.2 34 21.2 L29.2 21.2Z"
        fill="var(--fg)"
      />
      {/* P — 粗竖干 + 开放弧线 */}
      <path
        fillRule="evenodd"
        d="M48 2 L48 24 L51.2 24 L51.2 15.5 L56 15.5 C60.5 15.5 63 12.5 63 8.8 C63 5 60.5 2 56 2Z M51.2 4.8 L55.5 4.8 C58.5 4.8 60.2 6.5 60.2 8.8 C60.2 11.2 58.5 12.8 55.5 12.8 L51.2 12.8Z"
        fill="var(--fg)"
      />
      {/* 品牌色底部装饰线 — 渐隐 */}
      <defs>
        <linearGradient id="accent-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="25.5" width="65" height="1" rx="0.5" fill="url(#accent-fade)" />
    </svg>
  );
}

function SidebarAccounts({ onNavigate }: { onNavigate: (key: PageKey) => void }) {
  const { accounts } = useAccounts();
  const { navigate } = useNavigation();

  return (
    <>
      <div className="sidebar-section">
        <div className="sidebar-section-label">账号</div>
      </div>
      <div className="sidebar-accounts">
        {accounts.map((account) => {
          const initial = (account.displayName?.[0] ?? account.loginName[0] ?? "?").toUpperCase();
          const tone = account.sessionValid ? "ok" as const : "warn" as const;
          return (
            <div
              key={account.accountId}
              className="sidebar-account-row sidebar-account-row--clickable"
              data-default={account.isDefault || undefined}
              onClick={() => {
                if (account.sessionValid) {
                  navigate("library", { cloudAccountId: account.accountId });
                } else {
                  navigate("accounts");
                }
              }}
            >
              <div className="sidebar-account-avatar">{initial}</div>
              <span className="sidebar-account-name">{account.loginName}</span>
              {account.sessionState !== "LoggedOut" && (
                <StatusDot tone={tone} animate />
              )}
            </div>
          );
        })}
        <button
          className="nav-item"
          style={{ height: 30, color: "var(--fg-faint)", fontSize: 12 }}
          onClick={() => onNavigate("accounts")}
        >
          <Plus size={14} strokeWidth={1.75} />
          <span>添加账号</span>
        </button>
      </div>
    </>
  );
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      {/* 顶部拖拽区 — 覆盖红绿灯行 + 品牌区 */}
      <div className="sidebar-drag-region" />

      {/* 品牌字标 */}
      <div className="sidebar-brand">
        <Logo />
      </div>

      {/* 主导航 */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavButton key={item.key} item={item} active={active} onNavigate={onNavigate} />
        ))}
      </nav>

      {/* 账号 */}
      <SidebarAccounts onNavigate={onNavigate} />

      {/* 底部 */}
      <div className="sidebar-bottom">
        <ConnectionStatus />
        <NavButton item={settingsItem} active={active} onNavigate={onNavigate} />
      </div>
    </aside>
  );
}
