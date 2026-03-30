import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useApi } from "./ApiContext";

interface ConnectionContextValue {
  connected: boolean;
  /** 每次断连恢复后递增，用作 useQuery deps 触发全局刷新 */
  refreshKey: number;
}

const ConnectionContext = createContext<ConnectionContextValue>({ connected: true, refreshKey: 0 });

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const [connected, setConnected] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
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
        }
      } catch {
        if (active) {
          wasDisconnectedRef.current = true;
          setConnected(false);
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

  return (
    <ConnectionContext value={{ connected, refreshKey }}>
      {children}
    </ConnectionContext>
  );
}

export function useConnection(): ConnectionContextValue {
  return useContext(ConnectionContext);
}
