import { memo, useRef, useState, useEffect, useMemo, useCallback, useLayoutEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Search, Layers, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { spring, makeStagger } from "../../shared/springs";
import { useApi } from "../../app/ApiContext";
import { useAccounts } from "../../app/AccountsContext";
import { useNavigation } from "../../app/NavigationContext";
import { useQuery } from "../../shared/hooks/useQuery";
import { useDebounce } from "../../shared/hooks/useDebounce";
import { EmptyState } from "../../shared/components/EmptyState";
import { Spinner } from "../../shared/components/Spinner";
import { ModelCard } from "./ModelCard";
import { CloudAccountSelector } from "./CloudAccountSelector";
import { ImportDropZone } from "./ImportDropZone";
import { DetailPanel } from "./DetailPanel";
import type { ArtifactSummary } from "../../contracts/artifacts";
import type { MyAvatarSummary } from "../../contracts/my-avatars";
import type { PagedCollectionResponse } from "../../contracts/shared";

type Tab = "all" | "local" | "cloud";
type SelectedItem = { type: "local" | "cloud"; id: string; accountId?: string; imageUrl?: string | null } | null;

const ALL_TAB_BATCH_SIZE = 50;
const CLOUD_PAGE_SIZE = 20;
const PAGE_CACHE_LIMIT = 20;
const listStagger = makeStagger();

function pageCacheKey(accountId: string, offset: number, search: string | undefined): string {
  return `${accountId}:${offset}:${search ?? ""}`;
}

const TAB_KEYS: Tab[] = ["all", "local", "cloud"];

const PaginationBar = memo(function PaginationBar({
  page,
  hasMore,
  pageSize,
  onPageChange,
}: {
  page: number;
  hasMore: boolean;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation(["library"]);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function startEditing() {
    setEditValue(String(page));
    setEditing(true);
  }

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    setEditing(false);
    const n = parseInt(editValue, 10);
    if (Number.isFinite(n) && n >= 1 && n !== page) {
      onPageChange(n);
    }
  }

  return (
    <div className="pagination-bar">
      <button
        className="btn btn-ghost btn-icon"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={16} strokeWidth={1.75} />
      </button>
      {editing ? (
        <input
          ref={inputRef}
          className="pagination-page-input"
          type="text"
          inputMode="numeric"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          onBlur={commit}
          autoFocus
        />
      ) : (
        <button className="pagination-page-btn" onClick={startEditing}>
          {t("library:pagination.page", { page })}
        </button>
      )}
      <button
        className="btn btn-ghost btn-icon"
        disabled={!hasMore}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight size={16} strokeWidth={1.75} />
      </button>
    </div>
  );
});

const LibraryTabBar = memo(function LibraryTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  const { t } = useTranslation(["library"]);
  const barRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    const idx = TAB_KEYS.indexOf(activeTab);
    const el = tabRefs.current[idx];
    if (!el || !barRef.current) {
      return;
    }

    const barRect = barRef.current.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setIndicatorStyle({ left: elRect.left - barRect.left, width: elRect.width });
  }, [activeTab]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator, t]);

  useEffect(() => {
    updateIndicator();

    const bar = barRef.current;
    const activeElement = tabRefs.current[TAB_KEYS.indexOf(activeTab)];
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            updateIndicator();
          })
        : null;

    if (resizeObserver && bar) {
      resizeObserver.observe(bar);
      if (activeElement) {
        resizeObserver.observe(activeElement);
      }
    }

    function handleWindowResize() {
      updateIndicator();
    }

    window.addEventListener("resize", handleWindowResize);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [activeTab, updateIndicator]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: t("library:tabs.all") },
    { key: "local", label: t("library:tabs.local") },
    { key: "cloud", label: t("library:tabs.cloud") },
  ];
  return (
    <div className="tab-bar" ref={barRef}>
      <div
        className="tab-indicator"
        style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
      />
      {tabs.map((tab, i) => (
        <button
          key={tab.key}
          ref={(el) => { tabRefs.current[i] = el; }}
          className="tab-item"
          data-active={activeTab === tab.key || undefined}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
});

export function LibraryPage() {
  const { t } = useTranslation(["library"]);
  const api = useApi();
  const { defaultAccount, accounts } = useAccounts();
  const { activePage, navigationTick, consumePayload } = useNavigation();

  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 300);
  const [cloudAccountId, setCloudAccountId] = useState<string | null>(null);
  const [cloudOffset, setCloudOffset] = useState(0);
  const [selected, setSelected] = useState<SelectedItem>(null);

  const [allCloudItems, setAllCloudItems] = useState<MyAvatarSummary[]>([]);
  const [allHasMore, setAllHasMore] = useState(true);
  const [allLoading, setAllLoading] = useState(false);
  const allOffsetRef = useRef(0);
  const allGenRef = useRef(0);
  const allLoadingRef = useRef(false);
  const allHasMoreRef = useRef(true);
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);
  const sentinelCallbackRef = useCallback((node: HTMLDivElement | null) => { setSentinelNode(node); }, []);

  // Sidebar 账号点击: 切换到云端 tab + 指定账号
  // navigationTick 确保同页面内重复导航也能触发
  useEffect(() => {
    if (activePage !== "library") return;
    const payload = consumePayload();
    if (payload?.cloudAccountId) {
      // React 18 自动批处理，一次渲染
      setCloudAccountId(payload.cloudAccountId);
      setActiveTab("cloud");
    }
  }, [navigationTick]); // eslint-disable-line react-hooks/exhaustive-deps

  // 优先用户手选，其次默认账号（如果 session 有效），再其次第一个有效账号
  const firstValidAccount = accounts.find((a) => a.sessionValid);
  const effectiveCloudAccountId =
    cloudAccountId
    ?? (defaultAccount?.sessionValid ? defaultAccount.accountId : null)
    ?? firstValidAccount?.accountId
    ?? null;

  const { data: artifactsData, refetch: refetchArtifacts } = useQuery(
    (signal) => api.artifacts.list(signal),
    [],
  );
  const artifacts = artifactsData?.items ?? [];

  const effectiveOffset = activeTab === "cloud" ? cloudOffset : 0;

  const avatarPageCache = useRef(new Map<string, PagedCollectionResponse<MyAvatarSummary>>());

  const resetAllCloudFeed = useCallback(() => {
    allGenRef.current += 1;
    allOffsetRef.current = 0;
    allLoadingRef.current = false;
    allHasMoreRef.current = true;
    setAllCloudItems([]);
    setAllHasMore(true);
    setAllLoading(false);
  }, []);

  const { data: avatarsData, loading: avatarsLoading, refetch: refetchAvatarsRaw } = useQuery(
    (signal) => {
      if (activeTab !== "cloud" || !effectiveCloudAccountId) return Promise.resolve({ items: [] as MyAvatarSummary[], pagination: { limit: CLOUD_PAGE_SIZE, offset: 0, returnedCount: 0, hasMore: false, nextOffset: null } });
      const key = pageCacheKey(effectiveCloudAccountId, effectiveOffset, debouncedSearch || undefined);
      const cached = avatarPageCache.current.get(key);

      const fetchFromServer = () =>
        api.myAvatars.list(
          { accountId: effectiveCloudAccountId, limit: CLOUD_PAGE_SIZE, offset: effectiveOffset, search: debouncedSearch || undefined },
          signal,
        ).then((result) => {
          if (avatarPageCache.current.size >= PAGE_CACHE_LIMIT) {
            const oldest = avatarPageCache.current.keys().next().value;
            if (oldest) avatarPageCache.current.delete(oldest);
          }
          avatarPageCache.current.set(key, result);
          return result;
        });

      if (cached) {
        fetchFromServer().catch(() => {});
        return Promise.resolve(cached);
      }
      return fetchFromServer();
    },
    [effectiveCloudAccountId, effectiveOffset, debouncedSearch, activeTab],
  );

  const avatars = avatarsData?.items ?? [];
  const cloudPagination = avatarsData?.pagination ?? null;
  const cloudPage = cloudPagination ? Math.floor(cloudPagination.offset / cloudPagination.limit) + 1 : 1;
  const showPagination = activeTab === "cloud" && cloudPagination && (cloudPagination.hasMore || cloudPagination.offset > 0);

  useEffect(() => {
    setCloudOffset(0);
    avatarPageCache.current.clear();
  }, [effectiveCloudAccountId, debouncedSearch]);

  useEffect(() => {
    resetAllCloudFeed();
  }, [debouncedSearch, effectiveCloudAccountId, resetAllCloudFeed]);

  const loadMoreAllCloud = useCallback(async () => {
    if (!effectiveCloudAccountId || allLoadingRef.current || !allHasMoreRef.current) return;
    allLoadingRef.current = true;
    setAllLoading(true);
    const gen = allGenRef.current;
    try {
      const result = await api.myAvatars.list({
        accountId: effectiveCloudAccountId,
        limit: ALL_TAB_BATCH_SIZE,
        offset: allOffsetRef.current,
        search: debouncedSearch || undefined,
      });
      if (gen !== allGenRef.current) return;
      setAllCloudItems(prev => [...prev, ...result.items]);
      allHasMoreRef.current = result.pagination.hasMore;
      setAllHasMore(result.pagination.hasMore);
      allOffsetRef.current = result.pagination.nextOffset ?? allOffsetRef.current + ALL_TAB_BATCH_SIZE;
    } catch { /* stale generation or network error */ } finally {
      if (gen === allGenRef.current) {
        allLoadingRef.current = false;
        setAllLoading(false);
      }
    }
  }, [effectiveCloudAccountId, debouncedSearch, api]);

  const refetchAvatars = useCallback(() => {
    avatarPageCache.current.clear();
    resetAllCloudFeed();

    if (activeTab === "cloud") {
      refetchAvatarsRaw();
      return;
    }

    if (activeTab === "all" && effectiveCloudAccountId) {
      void loadMoreAllCloud();
    }
  }, [activeTab, effectiveCloudAccountId, loadMoreAllCloud, refetchAvatarsRaw, resetAllCloudFeed]);

  useEffect(() => {
    if (activeTab === "all" && effectiveCloudAccountId && allOffsetRef.current === 0 && !allLoadingRef.current) {
      loadMoreAllCloud();
    }
  }, [activeTab, effectiveCloudAccountId, loadMoreAllCloud]);

  useEffect(() => {
    if (activeTab !== "all" || !sentinelNode) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMoreAllCloud(); },
      { rootMargin: "200px" },
    );
    observer.observe(sentinelNode);
    return () => observer.disconnect();
  }, [activeTab, loadMoreAllCloud, sentinelNode]);

  const filteredArtifacts = useMemo(() => {
    if (!debouncedSearch) return artifacts;
    const q = debouncedSearch.toLowerCase();
    return artifacts.filter((a) => a.name.toLowerCase().includes(q));
  }, [artifacts, debouncedSearch]);

  const accountNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const acc of accounts) {
      map.set(acc.accountId, acc.displayName || acc.accountId.slice(0, 8));
    }
    return map;
  }, [accounts]);

  const displayModels = useMemo(() => {
    const localCards = (activeTab === "cloud" ? [] : filteredArtifacts).map(
      (a: ArtifactSummary) => ({
        key: `local-${a.artifactId}`,
        type: "local" as const,
        id: a.artifactId,
        name: a.name,
        imageUrl: a.thumbnailPath ? `file://${a.thumbnailPath}` : null,
        sourceLabel: t("library:source.local"),
        sourceIcon: "local" as const,
      }),
    );
    const cloudSource = activeTab === "all" ? allCloudItems : (activeTab === "cloud" ? avatars : []);
    const cloudCards = cloudSource.map(
      (a: MyAvatarSummary) => ({
        key: `cloud-${a.avatarId}`,
        type: "cloud" as const,
        id: a.avatarId,
        accountId: a.accountId,
        name: a.name,
        imageUrl: a.thumbnailImageUrl ?? a.imageUrl,
        sourceLabel: accountNameMap.get(a.accountId) ?? a.accountId.slice(0, 8),
        sourceIcon: "cloud" as const,
      }),
    );
    return [...localCards, ...cloudCards];
  }, [activeTab, filteredArtifacts, avatars, allCloudItems, accountNameMap]);

  const modelsRef = useRef(displayModels);
  modelsRef.current = displayModels;

  const handleCardSelect = useCallback((modelKey: string) => {
    const model = modelsRef.current.find((m) => m.key === modelKey);
    if (!model) return;
    setSelected((prev) => {
      if (prev?.id === model.id && prev?.type === model.type) return null;
      return {
        type: model.type,
        id: model.id,
        accountId: "accountId" in model ? model.accountId : undefined,
        imageUrl: model.imageUrl,
      };
    });
  }, []);

  function handlePanelDeleted() {
    const wasLocal = selected?.type === "local";
    setSelected(null);
    if (wasLocal) refetchArtifacts();
    else refetchAvatars();
  }

  const hasCloudAccounts = accounts.some((a) => a.sessionValid);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setSelected(null);
  }, []);

  const isPageLoading = activeTab === "cloud" ? avatarsLoading : activeTab === "all" ? allLoading : false;

  return (
    <div className="library">
      <div className="library-header">
        <h1>{t("library:title")}</h1>
        <div className="library-toolbar">
          {hasCloudAccounts && (
            <CloudAccountSelector
              selectedAccountId={effectiveCloudAccountId}
              onAccountChange={setCloudAccountId}
            />
          )}
          <LibraryTabBar activeTab={activeTab} onTabChange={handleTabChange} />
          <div className="search-box">
            <Search size={14} strokeWidth={1.75} />
            <input
              type="text"
              placeholder={t("library:searchPlaceholder")}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <motion.button
            className="btn btn-ghost btn-icon"
            title={t("library:refreshTitle")}
            onClick={() => { refetchArtifacts(); refetchAvatars(); }}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
          >
            <RefreshCw size={14} strokeWidth={1.75} />
          </motion.button>
        </div>
      </div>

      <div className="library-content">
        {activeTab === "cloud" && !hasCloudAccounts ? (
          <EmptyState
            icon={<Layers size={32} strokeWidth={1.5} />}
            message={t("library:emptyCloudRequired")}
          />
        ) : displayModels.length === 0 && isPageLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <Spinner />
          </div>
        ) : displayModels.length === 0 && !isPageLoading ? (
          <EmptyState
            icon={<Layers size={32} strokeWidth={1.5} />}
            message={debouncedSearch ? t("library:emptyNoResults") : t("library:emptyNoModels")}
          />
        ) : (
          <motion.div
            className="model-grid"
            variants={listStagger}
            initial="hidden"
            animate="show"
            key={`${activeTab}-${effectiveCloudAccountId}`}
          >
            {displayModels.map((model) => (
              <ModelCard
                key={model.key}
                modelKey={model.key}
                name={model.name}
                imageUrl={model.imageUrl}
                sourceLabel={model.sourceLabel}
                sourceIcon={model.sourceIcon}
                selected={selected?.id === model.id && selected?.type === model.type}
                onSelect={handleCardSelect}
              />
            ))}

            {activeTab !== "cloud" && (
              <ImportDropZone onImported={refetchArtifacts} />
            )}

            {activeTab === "all" && (
              <>
                {allHasMore && <div ref={sentinelCallbackRef} style={{ gridColumn: "1 / -1", height: 1 }} />}
                {allLoading && (
                  <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "center", padding: 24 }}>
                    <Spinner />
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {showPagination && (
          <PaginationBar
            page={cloudPage}
            hasMore={cloudPagination.hasMore}
            pageSize={cloudPagination.limit}
            onPageChange={(p) => setCloudOffset((p - 1) * cloudPagination.limit)}
          />
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <DetailPanel
            type={selected.type}
            id={selected.id}
            accountId={selected.accountId}
            previewImageUrl={selected.imageUrl}
            onClose={() => setSelected(null)}
            onDeleted={handlePanelDeleted}
            onImported={refetchArtifacts}
            onUpdated={refetchArtifacts}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
