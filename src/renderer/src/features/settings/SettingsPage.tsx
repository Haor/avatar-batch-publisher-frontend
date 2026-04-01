import { startTransition, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ChevronDown, FolderOpen, Languages } from "lucide-react";
import { spring } from "../../shared/springs";
import { useApi } from "../../app/ApiContext";
import { useQuery } from "../../shared/hooks/useQuery";
import { useMutation } from "../../shared/hooks/useMutation";
import { Input } from "../../shared/components/Input";
import { Select } from "../../shared/components/Select";
import { StatusDot } from "../../shared/components/StatusDot";
import { Spinner } from "../../shared/components/Spinner";
import { ErrorBanner } from "../../shared/components/ErrorBanner";
import { resolveBackendBaseUrl } from "../../lib/backend";
import { pickDirectory } from "../../lib/desktop";
import type { LanguageLocale, NetworkSettings } from "../../contracts/settings";
import { applyLanguagePreference } from "../../i18n";
import { getLocaleDisplayName, normalizeLocale, supportedLocales } from "../../i18n/locale";

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
  } catch {
    // parse failed
  }

  return { protocol: "http", host: url, port: "" };
}

function buildProxyUrl(protocol: ProxyProtocol, host: string, port: string): string {
  const trimmedHost = host.trim();
  const trimmedPort = port.trim();
  if (!trimmedHost) return "";
  return trimmedPort ? `${protocol}://${trimmedHost}:${trimmedPort}` : `${protocol}://${trimmedHost}`;
}

export function SettingsPage() {
  const { t, i18n } = useTranslation(["settings", "common"]);
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

  useEffect(() => () => clearTimeout(savedTimerRef.current), []);

  useEffect(() => {
    if (networkData) {
      setMode(networkData.mode);
      const parsed = parseProxyUrl(networkData.proxyUrl);
      setProxyProtocol(parsed.protocol);
      setProxyHost(parsed.host);
      setProxyPort(parsed.port);
    }
  }, [networkData]);

  const saveMut = useMutation((input: { mode: NetworkSettings["mode"]; proxyUrl: string | null }) =>
    api.settings.updateNetwork(input),
  );

  async function handleSave() {
    try {
      const proxyUrl = mode === "custom" ? buildProxyUrl(proxyProtocol, proxyHost, proxyPort) : null;
      await saveMut.execute({ mode, proxyUrl });
      setSaved(true);
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 1500);
    } catch {
      // shown via error banner
    }
  }

  const { data: health } = useQuery((signal) => api.health.get(signal), []);

  const backendUrl = resolveBackendBaseUrl();
  const versions =
    typeof window !== "undefined"
      ? (window as { avatarBatchPublisher?: { versions?: { electron?: string; chrome?: string; node?: string } } })
          .avatarBatchPublisher?.versions
      : undefined;
  const healthStatusLabel = health?.status === "ok" ? t("common:normal") : t("common:abnormal");
  const healthStatusTone = health?.status === "ok" ? "ok" : "warn";
  const currentUiLocale = normalizeLocale(i18n.resolvedLanguage) ?? "en";
  const languageOptions: Array<{ value: LanguageLocale; label: string }> = [
    { value: "system", label: t("settings:language.followSystem") },
    ...supportedLocales.map((locale) => ({
      value: locale,
      label: getLocaleDisplayName(locale, currentUiLocale),
    })),
  ];

  return (
    <motion.div
      className="settings-page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.gentle}
    >
      <div className="settings-header">
        <h1>{t("settings:title")}</h1>
        <LanguageSelector options={languageOptions} />
      </div>

      <div className="card settings-section">
        <div className="section-label" style={{ marginBottom: 16 }}>
          {t("settings:network.section")}
        </div>

        {networkLoading ? (
          <Spinner />
        ) : networkError ? (
          <ErrorBanner error={networkError} />
        ) : (
          <div className="settings-form">
            <div className="proxy-mode-cards">
              {([
                { value: "system", labelKey: "system" },
                { value: "none", labelKey: "none" },
                { value: "custom", labelKey: "custom" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  className={`proxy-mode-card ${mode === opt.value ? "proxy-mode-card--active" : ""}`}
                  onClick={() => setMode(opt.value)}
                >
                  <span className="proxy-mode-card-label">{t(`settings:network.modes.${opt.labelKey}.label`)}</span>
                  <span className="proxy-mode-card-desc">{t(`settings:network.modes.${opt.labelKey}.description`)}</span>
                </button>
              ))}
            </div>

            {mode === "custom" && (
              <div className="proxy-custom-fields">
                <Select
                  label={t("settings:network.protocolLabel")}
                  className="proxy-protocol-select"
                  options={[
                    { value: "http", label: "HTTP" },
                    { value: "socks5", label: "SOCKS5" },
                  ]}
                  value={proxyProtocol}
                  onChange={(e) => setProxyProtocol(e.target.value as ProxyProtocol)}
                />
                <Input
                  label={t("settings:network.hostLabel")}
                  className="proxy-host-input"
                  placeholder={t("settings:network.hostPlaceholder")}
                  value={proxyHost}
                  onChange={(e) => setProxyHost(e.target.value)}
                />
                <Input
                  label={t("settings:network.portLabel")}
                  className="proxy-port-input"
                  placeholder={t("settings:network.portPlaceholder")}
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
              {saveMut.loading ? <Spinner size={14} /> : saved ? t("common:saved") : t("common:save")}
            </motion.button>
          </div>
        )}
      </div>

      <StorageSection />

      <div className="card settings-section">
        <div className="section-label" style={{ marginBottom: 16 }}>
          {t("settings:about.section")}
        </div>
        <div className="about-grid">
          {health ? (
            <>
              <span className="about-label">{t("settings:about.backendService")}</span>
              <span className="about-value">{health.service}</span>
              <span className="about-label">{t("settings:about.backendVersion")}</span>
              <span className="about-value about-value--mono">{health.version}</span>
              <span className="about-label">{t("settings:about.backendStatus")}</span>
              <span className="about-value">
                <StatusDot tone={healthStatusTone} /> {healthStatusLabel}
              </span>
              <span className="about-label">{t("settings:about.backendAddress")}</span>
              <span className="about-value about-value--mono">{backendUrl}</span>
            </>
          ) : null}
          {versions ? (
            <>
              <span className="about-label">{t("common:electron")}</span>
              <span className="about-value about-value--mono">{versions.electron}</span>
              <span className="about-label">{t("common:chrome")}</span>
              <span className="about-value about-value--mono">{versions.chrome}</span>
              <span className="about-label">{t("common:node")}</span>
              <span className="about-value about-value--mono">{versions.node}</span>
            </>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function LanguageSelector({ options }: { options: Array<{ value: LanguageLocale; label: string }> }) {
  const { i18n } = useTranslation(["settings"]);
  const api = useApi();
  const { data, refetch } = useQuery((signal) => api.settings.getLanguage(signal), []);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const currentValue: LanguageLocale = data?.locale ?? "system";
  const selectedOption = options.find((o) => o.value === currentValue) ?? options[0];

  async function handleSelect(value: LanguageLocale) {
    setOpen(false);
    if (value === currentValue) return;
    setSwitching(true);
    try {
      await api.settings.updateLanguage({ locale: value });
      const locale = applyLanguagePreference(value);
      startTransition(() => {
        void i18n.changeLanguage(locale);
      });
      refetch();
    } catch {
      // silent — transient error
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="language-selector" ref={ref}>
      <button
        className="language-selector-trigger"
        onClick={() => setOpen(!open)}
        disabled={switching}
      >
        <Languages size={14} strokeWidth={1.75} className="language-selector-icon" />
        {switching ? (
          <Spinner size={14} />
        ) : (
          <span className="language-selector-label">{selectedOption.label}</span>
        )}
        <ChevronDown size={13} strokeWidth={1.75} className={`language-selector-chevron ${open ? "language-selector-chevron--open" : ""}`} />
      </button>
      {open && (
        <div className="language-selector-dropdown">
          {options.map((opt) => (
            <button
              key={opt.value}
              className={`language-selector-option ${opt.value === currentValue ? "language-selector-option--active" : ""}`}
              onClick={() => handleSelect(opt.value)}
            >
              <span className="language-selector-option-label">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StorageSection() {
  const { t } = useTranslation(["settings", "common"]);
  const api = useApi();
  const { data, loading, error, refetch } = useQuery((signal) => api.settings.getStorage(signal), []);
  const [editPath, setEditPath] = useState<string | null>(null);
  const [storageSaved, setStorageSaved] = useState(false);
  const storageSavedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(storageSavedTimerRef.current), []);

  const saveMut = useMutation((input: { basePath: string }) => api.settings.updateStorage(input));
  const currentPath = editPath ?? data?.basePath ?? "";

  async function handlePickDir() {
    try {
      const dir = await pickDirectory({ title: t("common:chooseFolder") });
      if (dir) {
        setEditPath(dir);
      }
    } catch {
      // desktop bridge unavailable
    }
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
    } catch {
      // shown via error
    }
  }

  const hasChanges = editPath !== null && editPath !== data?.basePath;

  return (
    <div className="card settings-section">
      <div className="section-label" style={{ marginBottom: 16 }}>
        {t("settings:storage.section")}
      </div>
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
              placeholder={t("settings:storage.placeholder")}
              spellCheck={false}
            />
            <motion.button
              className="btn btn-secondary btn-icon"
              title={t("common:chooseFolder")}
              onClick={handlePickDir}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
            >
              <FolderOpen size={14} strokeWidth={1.75} />
            </motion.button>
          </div>
          {saveMut.error && <ErrorBanner error={saveMut.error} />}
          {hasChanges || storageSaved ? (
            <motion.button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saveMut.loading}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
              style={{ alignSelf: "flex-start" }}
            >
              {saveMut.loading ? <Spinner size={14} /> : storageSaved ? t("common:saved") : t("common:savePath")}
            </motion.button>
          ) : null}
        </div>
      )}
    </div>
  );
}
