import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useApi } from "./ApiContext";
import {
  getRuntimeLogDirectoryPath,
  getRuntimeMode,
  subscribeBackendLifecycle
} from "../lib/runtime";

type RuntimeMode = ReturnType<typeof getRuntimeMode>;
type ServiceState = "starting" | "ready" | "degraded" | "stopped";

interface ConnectionContextValue {
  connected: boolean;
  /** 每次断连恢复后递增，用作 useQuery deps 触发全局刷新 */
  refreshKey: number;
  runtimeMode: RuntimeMode;
  serviceState: ServiceState;
  serviceMessage: string | null;
  logDirectoryPath: string | null;
}

const initialRuntimeMode = getRuntimeMode();
const initialConnected = initialRuntimeMode === "desktop-release" ? false : true;

const ConnectionContext = createContext<ConnectionContextValue>({
  connected: initialConnected,
  refreshKey: 0,
  runtimeMode: initialRuntimeMode,
  serviceState: initialRuntimeMode === "desktop-release" ? "starting" : "ready",
  serviceMessage: null,
  logDirectoryPath: getRuntimeLogDirectoryPath()
});

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const [connected, setConnected] = useState(initialConnected);
  const [refreshKey, setRefreshKey] = useState(0);
  const [runtimeMode] = useState<RuntimeMode>(initialRuntimeMode);
  const [serviceState, setServiceState] = useState<ServiceState>(
    initialRuntimeMode === "desktop-release" ? "starting" : "ready"
  );
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const [logDirectoryPath, setLogDirectoryPath] = useState<string | null>(getRuntimeLogDirectoryPath());
  const wasDisconnectedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        await api.health.get();
        if (active) {
          // 断连恢复 → 递增 refreshKey
          if (wasDisconnectedRef.current) {
            wasDisconnectedRef.current = false;
            setRefreshKey((k) => k + 1);
          }
          setConnected(true);
          setServiceState("ready");
          setServiceMessage(null);
        }
      } catch {
        if (active) {
          wasDisconnectedRef.current = true;
          setConnected(false);
          setServiceState((current) => {
            if (current === "starting" || current === "stopped") {
              return current;
            }

            return "degraded";
          });
        }
      }
      if (active) {
        // 断连时轮询更频繁 (3s)，连接正常时 30s
        timerRef.current = setTimeout(check, wasDisconnectedRef.current ? 3000 : 30000);
      }
    }

    check();
    return () => {
      active = false;
      clearTimeout(timerRef.current);
    };
  }, [api]);

  useEffect(() => {
    const unsubscribe = subscribeBackendLifecycle((event) => {
      setServiceState(event.state);
      setServiceMessage(event.message);
      setLogDirectoryPath(event.logDirectoryPath ?? null);
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  const value = useMemo(
    () => ({ connected, refreshKey, runtimeMode, serviceState, serviceMessage, logDirectoryPath }),
    [connected, refreshKey, runtimeMode, serviceState, serviceMessage, logDirectoryPath],
  );

  return (
    <ConnectionContext
      value={value}
    >
      {children}
    </ConnectionContext>
  );
}

export function useConnection(): ConnectionContextValue {
  return useContext(ConnectionContext);
}
