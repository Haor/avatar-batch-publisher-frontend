import { LayoutGroup, motion } from "motion/react";
import { Home, Layers, Send, History, Users, Settings, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import brandIconUrl from "../../../../resources/icon1.png";
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

function NavButton({ item, active, onNavigate, layoutId = "nav-indicator" }: {
  item: { key: PageKey; icon: string };
  active: PageKey;
  onNavigate: (key: PageKey) => void;
  layoutId?: string;
}) {
  const { t } = useTranslation("navigation");
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
          layoutId={layoutId}
          className="nav-indicator"
          transition={spring.smooth}
        />
      )}
      <Icon size={17} strokeWidth={1.75} />
      <span>{t(item.key)}</span>
    </button>
  );
}

function SidebarAccounts({ onNavigate }: { onNavigate: (key: PageKey) => void }) {
  const { t } = useTranslation("navigation");
  const { accounts } = useAccounts();
  const { navigate } = useNavigation();

  return (
    <>
      <div className="sidebar-section">
        <div className="sidebar-section-label">{t("accountsSection")}</div>
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
              {account.sessionState !== "logged_out" && (
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
          <span>{t("addAccount")}</span>
        </button>
      </div>
    </>
  );
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  const { t } = useTranslation(["common", "navigation"]);

  return (
    <aside className="sidebar">
      {/* 顶部拖拽区 — 覆盖红绿灯行 + 品牌区 */}
      <div className="sidebar-drag-region" />

      {/* 品牌字标 — 点击回首页 */}
      <button className="sidebar-brand" onClick={() => onNavigate("home")}>
        <img
          className="sidebar-brand-icon"
          src={brandIconUrl}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
        <div className="sidebar-brand-copy" aria-label={t("common:appName")}>
          <span className="sidebar-brand-kicker">Avatar</span>
          <span className="sidebar-brand-name">Publisher</span>
        </div>
      </button>

      {/* 主导航 */}
      <LayoutGroup id="sidebar-nav">
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavButton key={item.key} item={item} active={active} onNavigate={onNavigate} />
          ))}
        </nav>
      </LayoutGroup>

      {/* 账号 */}
      <SidebarAccounts onNavigate={onNavigate} />

      {/* 底部 */}
      <div className="sidebar-bottom">
        <ConnectionStatus />
        <button
          className="nav-item"
          data-active={active === settingsItem.key || undefined}
          onClick={() => onNavigate(settingsItem.key)}
        >
          <Settings size={17} strokeWidth={1.75} />
          <span>{t("navigation:settings")}</span>
        </button>
      </div>
    </aside>
  );
}
