import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { spring } from "../../shared/springs";
import { useApi } from "../../app/ApiContext";
import { useQuery } from "../../shared/hooks/useQuery";
import { useMutation } from "../../shared/hooks/useMutation";
import { Input } from "../../shared/components/Input";
import { Select } from "../../shared/components/Select";
import { StatusDot } from "../../shared/components/StatusDot";
import { Spinner } from "../../shared/components/Spinner";
import { ErrorBanner } from "../../shared/components/ErrorBanner";
import { FolderOpen } from "lucide-react";
import { resolveBackendBaseUrl } from "../../lib/backend";
import { pickDirectory } from "../../lib/desktop";
import type { NetworkSettings } from "../../contracts/settings";

type ProxyProtocol = "http" | "socks5";

function parseProxyUrl(url: string | null): { protocol: ProxyProtocol; host: string; port: string } {
  if (!url) return { protocol: "http", host: "", port: "" };
  try {
    const match = url.match(/^(https?|socks5):\/\/([^:/?#]+)(?::(\d+))?/);
    if (match) {
      return {
        protocol: (match[1] === "socks5" ? "socks5" : "http") as ProxyProtocol,
        host: match[2],
        port: match[3] ?? "",
      };
    }
  } catch { /* parse failed */ }
  return { protocol: "http", host: url, port: "" };
}

function buildProxyUrl(protocol: ProxyProtocol, host: string, port: string): string {
  const trimmedHost = host.trim();
  const trimmedPort = port.trim();
  if (!trimmedHost) return "";
  return trimmedPort
    ? `${protocol}://${trimmedHost}:${trimmedPort}`
    : `${protocol}://${trimmedHost}`;
}

export function SettingsPage() {
  const api = useApi();

  const { data: networkData, loading: networkLoading, error: networkError } = useQuery(
    (signal) => api.settings.getNetwork(signal),
    [],
  );

  const [mode, setMode] = useState<NetworkSettings["mode"]>("system");
  const [proxyProtocol, setProxyProtocol] = useState<ProxyProtocol>("http");
  const [proxyHost, setProxyHost] = useState("");
  const [proxyPort, setProxyPort] = useState("");
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => clearTimeout(savedTimerRef.current);
  }, []);

  useEffect(() => {
    if (networkData) {
      setMode(networkData.mode);
      const parsed = parseProxyUrl(networkData.proxyUrl);
      setProxyProtocol(parsed.protocol);
      setProxyHost(parsed.host);
      setProxyPort(parsed.port);
    }
  }, [networkData]);

  const saveMut = useMutation(
    (input: { mode: NetworkSettings["mode"]; proxyUrl: string | null }) =>
      api.settings.updateNetwork(input),
  );

  async function handleSave() {
    try {
      const proxyUrl = mode === "custom" ? buildProxyUrl(proxyProtocol, proxyHost, proxyPort) : null;
      await saveMut.execute({ mode, proxyUrl });
      setSaved(true);
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 1500);
    } catch { /* shown via error */ }
  }

  const { data: health } = useQuery(
    (signal) => api.health.get(signal),
    [],
  );

  const backendUrl = resolveBackendBaseUrl();
  const versions = typeof window !== "undefined"
    ? (window as { avatarBatchPublisher?: { versions?: { electron?: string; chrome?: string; node?: string } } }).avatarBatchPublisher?.versions
    : undefined;

  return (
    <motion.div
      className="settings-page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.gentle}
    >
      <h1>设置</h1>

      {/* 网络代理 */}
      <div className="card settings-section">
        <div className="section-label" style={{ marginBottom: 16 }}>网络代理</div>

        {networkLoading ? (
          <Spinner />
        ) : networkError ? (
          <ErrorBanner error={networkError} />
        ) : (
          <div className="settings-form">
            <div className="proxy-mode-cards">
              {([
                { value: "system", label: "跟随系统", desc: "使用操作系统代理设置" },
                { value: "none", label: "直连", desc: "不通过任何代理" },
                { value: "custom", label: "自定义", desc: "手动指定代理服务器" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  className={`proxy-mode-card ${mode === opt.value ? "proxy-mode-card--active" : ""}`}
                  onClick={() => setMode(opt.value)}
                >
                  <span className="proxy-mode-card-label">{opt.label}</span>
                  <span className="proxy-mode-card-desc">{opt.desc}</span>
                </button>
              ))}
            </div>

            {mode === "custom" && (
              <div className="proxy-custom-fields">
                <Select
                  label="协议"
                  className="proxy-protocol-select"
                  options={[
                    { value: "http", label: "HTTP" },
                    { value: "socks5", label: "SOCKS5" },
                  ]}
                  value={proxyProtocol}
                  onChange={(e) => setProxyProtocol(e.target.value as ProxyProtocol)}
                />
                <Input
                  label="地址"
                  className="proxy-host-input"
                  placeholder="127.0.0.1"
                  value={proxyHost}
                  onChange={(e) => setProxyHost(e.target.value)}
                />
                <Input
                  label="端口"
                  className="proxy-port-input"
                  placeholder="7890"
                  value={proxyPort}
                  onChange={(e) => setProxyPort(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                />
              </div>
            )}

            {saveMut.error && <ErrorBanner error={saveMut.error} />}

            <motion.button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saveMut.loading}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
              style={{ alignSelf: "flex-start" }}
            >
              {saveMut.loading ? <Spinner size={14} /> : saved ? "已保存" : "保存"}
            </motion.button>
          </div>
        )}
      </div>

      {/* 存储路径 */}
      <StorageSection />

      {/* 关于 */}
      <div className="card settings-section">
        <div className="section-label" style={{ marginBottom: 16 }}>关于</div>
        <div className="about-grid">
          {health && (
            <>
              <span className="about-label">后端服务</span>
              <span className="about-value">{health.service}</span>
              <span className="about-label">后端版本</span>
              <span className="about-value about-value--mono">{health.version}</span>
              <span className="about-label">后端状态</span>
              <span className="about-value">
                <StatusDot tone={health.status === "ok" ? "ok" : "warn"} /> {health.status === "ok" ? "正常" : "异常"}
              </span>
              <span className="about-label">后端地址</span>
              <span className="about-value about-value--mono">{backendUrl}</span>
            </>
          )}
          {versions && (
            <>
              <span className="about-label">Electron</span>
              <span className="about-value about-value--mono">{versions.electron}</span>
              <span className="about-label">Chrome</span>
              <span className="about-value about-value--mono">{versions.chrome}</span>
              <span className="about-label">Node</span>
              <span className="about-value about-value--mono">{versions.node}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StorageSection() {
  const api = useApi();
  const { data, loading, error, refetch } = useQuery(
    (signal) => api.settings.getStorage(signal),
    [],
  );
  const [editPath, setEditPath] = useState<string | null>(null);
  const [storageSaved, setStorageSaved] = useState(false);
  const storageSavedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => clearTimeout(storageSavedTimerRef.current);
  }, []);

  const saveMut = useMutation(
    (input: { basePath: string }) => api.settings.updateStorage(input),
  );

  const currentPath = editPath ?? data?.basePath ?? "";

  async function handlePickDir() {
    try {
      const dir = await pickDirectory({ title: "选择模型存放目录" });
      if (dir) setEditPath(dir);
    } catch { /* desktop bridge unavailable */ }
  }

  async function handleSave() {
    if (!editPath) return;
    try {
      await saveMut.execute({ basePath: editPath });
      setStorageSaved(true);
      setEditPath(null);
      refetch();
      clearTimeout(storageSavedTimerRef.current);
      storageSavedTimerRef.current = setTimeout(() => setStorageSaved(false), 1500);
    } catch { /* error shown */ }
  }

  const hasChanges = editPath !== null && editPath !== data?.basePath;

  return (
    <div className="card settings-section">
      <div className="section-label" style={{ marginBottom: 16 }}>存储路径</div>
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBanner error={error} />
      ) : (
        <div className="settings-form">
          <div className="storage-path-field">
            <input
              className="input-field storage-path-input"
              value={currentPath}
              onChange={(e) => setEditPath(e.target.value)}
              placeholder="/path/to/storage"
              spellCheck={false}
            />
            <motion.button
              className="btn btn-secondary btn-icon"
              title="选择文件夹"
              onClick={handlePickDir}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
            >
              <FolderOpen size={14} strokeWidth={1.75} />
            </motion.button>
          </div>
          {saveMut.error && <ErrorBanner error={saveMut.error} />}
          {hasChanges && (
            <motion.button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saveMut.loading}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
              style={{ alignSelf: "flex-start" }}
            >
              {saveMut.loading ? <Spinner size={14} /> : storageSaved ? "已保存" : "保存路径"}
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}
