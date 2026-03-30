import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "abp.activePublishQueueId";

interface ActivePublishContextValue {
  activeQueueId: string | null;
  setActiveQueueId: (queueId: string | null) => void;
  clearActiveQueueId: () => void;
}

const ActivePublishContext = createContext<ActivePublishContextValue | null>(null);

function readStoredQueueId(): string | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
  return value || null;
}

export function ActivePublishProvider({ children }: { children: ReactNode }) {
  const [activeQueueId, setActiveQueueIdState] = useState<string | null>(() => readStoredQueueId());

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (activeQueueId) {
      window.localStorage.setItem(STORAGE_KEY, activeQueueId);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [activeQueueId]);

  const setActiveQueueId = useCallback((queueId: string | null) => {
    setActiveQueueIdState(queueId?.trim() || null);
  }, []);

  const clearActiveQueueId = useCallback(() => {
    setActiveQueueIdState(null);
  }, []);

  const value = useMemo(
    () => ({ activeQueueId, setActiveQueueId, clearActiveQueueId }),
    [activeQueueId, setActiveQueueId, clearActiveQueueId],
  );

  return <ActivePublishContext value={value}>{children}</ActivePublishContext>;
}

export function useActivePublish(): ActivePublishContextValue {
  const ctx = useContext(ActivePublishContext);
  if (!ctx) throw new Error("useActivePublish must be used within ActivePublishProvider");
  return ctx;
}
