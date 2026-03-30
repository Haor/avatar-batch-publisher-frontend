import { useState, useCallback, useRef, useEffect } from "react";
import { LayoutGroup } from "motion/react";
import { ApiProvider } from "./ApiContext";
import { ConnectionProvider, useConnection } from "./ConnectionContext";
import { AccountsProvider } from "./AccountsContext";
import { ActivePublishProvider } from "./ActivePublishContext";
import { NavigationProvider, useNavigation } from "./NavigationContext";
import { ToastProvider } from "./ToastContext";
import { Sidebar } from "./Sidebar";
import { SearchPalette } from "../features/search/SearchPalette";
import { useKeyboardShortcuts } from "../shared/hooks/useKeyboardShortcuts";
import type { PageKey } from "./navigation";
import { HomePage } from "../features/home/HomePage";
import { LibraryPage } from "../features/library/LibraryPage";
import { PublishPage } from "../features/publish/PublishPage";
import { HistoryPage } from "../features/history/HistoryPage";
import { AccountsPage } from "../features/accounts/AccountsPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { RuntimeServiceBanner } from "../shared/components/RuntimeServiceBanner";
import { RuntimeBootstrapScreenInner } from "../shared/components/RuntimeBootstrapScreen";
import { useApi } from "./ApiContext";

const pageEntries: { key: PageKey; component: React.ComponentType }[] = [
  { key: "home", component: HomePage },
  { key: "library", component: LibraryPage },
  { key: "publish", component: PublishPage },
  { key: "history", component: HistoryPage },
  { key: "accounts", component: AccountsPage },
  { key: "settings", component: SettingsPage },
];

/**
 * 页面容器 — 首次进入播放 CSS 动画，后续切换即时显示
 * Page 组件始终保持同一实例 (KeepAlive)
 */
function PageSlot({ pageKey, active, children }: { pageKey: string; active: boolean; children: React.ReactNode }) {
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
    <div
      className={`page ${active ? "" : "page--hidden"} ${animating ? "page--entering" : ""}`}
      data-page={pageKey}
    >
      {children}
    </div>
  );
}

function AppChrome({
  searchOpen,
  onOpenSearch,
  onCloseSearch,
}: {
  searchOpen: boolean;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
}) {
  const { activePage, navigate } = useNavigation();
  const [visited] = useState(() => new Set<PageKey>(["home"]));
  visited.add(activePage);

  useKeyboardShortcuts(navigate, onOpenSearch);

  return (
    <>
      <LayoutGroup>
        <Sidebar active={activePage} onNavigate={navigate} />
        <main className="main">
          {pageEntries.map(({ key, component: Page }) =>
            visited.has(key) ? (
              <PageSlot key={key} pageKey={key} active={key === activePage}>
                <Page />
              </PageSlot>
            ) : null,
          )}
        </main>
      </LayoutGroup>
      <SearchPalette open={searchOpen} onClose={onCloseSearch} />
    </>
  );
}

function AppShell() {
  const [activePage, setActivePage] = useState<PageKey>("home");
  const [searchOpen, setSearchOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <NavigationProvider activePage={activePage} setActivePage={setActivePage}>
      <RuntimeServiceBanner />
      <AppChrome searchOpen={searchOpen} onOpenSearch={openSearch} onCloseSearch={closeSearch} />
    </NavigationProvider>
  );
}

export function App() {
  return (
    <ApiProvider>
      <ConnectionProvider>
        <RuntimeBootstrapGate>
          <AccountsProvider>
            <ActivePublishProvider>
              <ToastProvider>
                <AppShell />
              </ToastProvider>
            </ActivePublishProvider>
          </AccountsProvider>
        </RuntimeBootstrapGate>
      </ConnectionProvider>
    </ApiProvider>
  );
}

export default App;

function RuntimeBootstrapGate({ children }: { children: React.ReactNode }) {
  const { runtimeMode, serviceState } = useConnection();
  const api = useApi();
  const [bootstrapComplete, setBootstrapComplete] = useState(runtimeMode !== "desktop-release");
  const [bootstrapMessage, setBootstrapMessage] = useState<string | null>(null);

  useEffect(() => {
    if (runtimeMode !== "desktop-release") {
      setBootstrapComplete(true);
      return;
    }

    if (serviceState !== "ready") {
      setBootstrapComplete(false);
      setBootstrapMessage(null);
      return;
    }

    let cancelled = false;

    async function bootstrapSessions() {
      setBootstrapComplete(false);
      setBootstrapMessage("正在校验账号会话...");

      try {
        const response = await api.accounts.list();
        const refreshTargets = response.items.filter((account) => account.hasStoredCredential);

        for (let index = 0; index < refreshTargets.length; index += 1) {
          if (cancelled) {
            return;
          }

          const account = refreshTargets[index];
          setBootstrapMessage(
            refreshTargets.length > 1
              ? `正在校验账号会话（${index + 1}/${refreshTargets.length}）：${account.displayName}`
              : `正在校验账号会话：${account.displayName}`
          );

          try {
            await api.accounts.refresh(account.accountId);
          } catch {
            // 这里故意吞掉，后续页面会读取刷新后的账号状态并决定是否要求重登。
          }
        }
      } finally {
        if (!cancelled) {
          setBootstrapComplete(true);
          setBootstrapMessage(null);
        }
      }
    }

    void bootstrapSessions();

    return () => {
      cancelled = true;
    };
  }, [api, runtimeMode, serviceState]);

  if (runtimeMode === "desktop-release" && (serviceState !== "ready" || !bootstrapComplete)) {
    return (
      <RuntimeBootstrapScreenInner
        messageOverride={serviceState === "ready" ? bootstrapMessage : null}
        progressCopyOverride={serviceState === "ready" ? "正在同步本地会话状态..." : null}
      />
    );
  }

  return <>{children}</>;
}
