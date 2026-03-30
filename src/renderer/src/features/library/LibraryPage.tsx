import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, Layers, RefreshCw } from "lucide-react";
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

type Tab = "all" | "local" | "cloud";
type SelectedItem = { type: "local" | "cloud"; id: string; accountId?: string; imageUrl?: string | null } | null;

const tabs: { key: Tab; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "local", label: "本地" },
  { key: "cloud", label: "云端" },
];

const listStagger = makeStagger();

export function LibraryPage() {
  const api = useApi();
  const { defaultAccount, accounts } = useAccounts();
  const { activePage, navigationTick, consumePayload } = useNavigation();

  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 300);
  const [cloudAccountId, setCloudAccountId] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedItem>(null);

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

  const { data: avatarsData, loading: avatarsLoading, refetch: refetchAvatars } = useQuery(
    (signal) => {
      if (!effectiveCloudAccountId) return Promise.resolve({ items: [] as MyAvatarSummary[], pagination: { limit: 50, offset: 0, returnedCount: 0, hasMore: false, nextOffset: null } });
      return api.myAvatars.list(
        { accountId: effectiveCloudAccountId, search: debouncedSearch || undefined },
        signal,
      );
    },
    [effectiveCloudAccountId, debouncedSearch],
  );
  const avatars = avatarsData?.items ?? [];

  const filteredArtifacts = useMemo(() => {
    if (!debouncedSearch) return artifacts;
    const q = debouncedSearch.toLowerCase();
    return artifacts.filter((a) => a.name.toLowerCase().includes(q));
  }, [artifacts, debouncedSearch]);

  const displayModels = useMemo(() => {
    const localCards = (activeTab === "cloud" ? [] : filteredArtifacts).map(
      (a: ArtifactSummary) => ({
        key: `local-${a.artifactId}`,
        type: "local" as const,
        id: a.artifactId,
        name: a.name,
        imageUrl: a.thumbnailPath ? `file://${a.thumbnailPath}` : null,
        sourceLabel: "本地",
        sourceIcon: "local" as const,
      }),
    );
    const cloudCards = (activeTab === "local" ? [] : avatars).map(
      (a: MyAvatarSummary) => ({
        key: `cloud-${a.avatarId}`,
        type: "cloud" as const,
        id: a.avatarId,
        accountId: a.accountId,
        name: a.name,
        imageUrl: a.thumbnailImageUrl ?? a.imageUrl,
        sourceLabel: accounts.find((acc) => acc.accountId === a.accountId)?.displayName ?? a.accountId.slice(0, 8),
        sourceIcon: "cloud" as const,
      }),
    );
    return [...localCards, ...cloudCards];
  }, [activeTab, filteredArtifacts, avatars, accounts]);

  function handleSelect(item: typeof displayModels[number]) {
    if (selected?.id === item.id && selected?.type === item.type) {
      setSelected(null);
    } else {
      setSelected({
        type: item.type,
        id: item.id,
        accountId: "accountId" in item ? item.accountId : undefined,
        imageUrl: item.imageUrl,
      });
    }
  }

  function handlePanelDeleted() {
    const wasLocal = selected?.type === "local";
    setSelected(null);
    if (wasLocal) refetchArtifacts();
    else refetchAvatars();
  }

  const hasCloudAccounts = accounts.some((a) => a.sessionValid);

  return (
    <div className="library">
      <motion.div
        className="library-header"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
      >
        <h1>模型库</h1>
        <div className="library-toolbar">
          {hasCloudAccounts && (
            <CloudAccountSelector
              selectedAccountId={effectiveCloudAccountId}
              onAccountChange={setCloudAccountId}
            />
          )}
          <div className="tab-bar">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className="tab-item"
                data-active={activeTab === tab.key || undefined}
                onClick={() => { setActiveTab(tab.key); setSelected(null); }}
              >
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="library-tab"
                    className="tab-indicator"
                    transition={spring.snappy}
                  />
                )}
                {tab.label}
              </button>
            ))}
          </div>
          <div className="search-box">
            <Search size={14} strokeWidth={1.75} />
            <input
              type="text"
              placeholder="搜索..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <motion.button
            className="btn btn-ghost btn-icon"
            title="刷新"
            onClick={() => { refetchArtifacts(); refetchAvatars(); }}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
          >
            <RefreshCw size={14} strokeWidth={1.75} />
          </motion.button>
        </div>
      </motion.div>

      <div className="library-content">
        {activeTab === "cloud" && !hasCloudAccounts ? (
          <EmptyState
            icon={<Layers size={32} strokeWidth={1.5} />}
            message="添加账号后查看云端模型"
          />
        ) : displayModels.length === 0 && !avatarsLoading ? (
          <EmptyState
            icon={<Layers size={32} strokeWidth={1.5} />}
            message={debouncedSearch ? "无搜索结果" : "暂无模型"}
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
                name={model.name}
                imageUrl={model.imageUrl}
                sourceLabel={model.sourceLabel}
                sourceIcon={model.sourceIcon}
                selected={selected?.id === model.id && selected?.type === model.type}
                onClick={() => handleSelect(model)}
              />
            ))}

            {activeTab !== "cloud" && (
              <ImportDropZone onImported={refetchArtifacts} />
            )}

            {avatarsLoading && activeTab !== "local" && (
              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "center", padding: 24 }}>
                <Spinner />
              </div>
            )}
          </motion.div>
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
