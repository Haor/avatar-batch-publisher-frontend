import { useState, useCallback, useRef, useEffect } from "react";
import { LayoutGroup } from "motion/react";
import { ApiProvider } from "./ApiContext";
import { ConnectionProvider } from "./ConnectionContext";
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
      <AppChrome searchOpen={searchOpen} onOpenSearch={openSearch} onCloseSearch={closeSearch} />
    </NavigationProvider>
  );
}

export function App() {
  return (
    <ApiProvider>
      <ConnectionProvider>
        <AccountsProvider>
          <ActivePublishProvider>
            <ToastProvider>
              <AppShell />
            </ToastProvider>
          </ActivePublishProvider>
        </AccountsProvider>
      </ConnectionProvider>
    </ApiProvider>
  );
}

export default App;
