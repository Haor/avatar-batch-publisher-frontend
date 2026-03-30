import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { PageKey } from "./navigation";

export interface PublishNavigationPrefill {
  name?: string;
  imagePath?: string | null;
}

/** 导航时可携带的参数 */
export interface NavigationPayload {
  cloudAccountId?: string;
  historyRunId?: string | null;
  publishArtifactIds?: string[];
  publishStep?: number;
  publishPrefill?: PublishNavigationPrefill;
}

interface NavigationContextValue {
  activePage: PageKey;
  /** 每次 navigate() 递增，用于检测导航事件 */
  navigationTick: number;
  navigate: (page: PageKey, payload?: NavigationPayload) => void;
  /** 消费一次性 payload（读后清除） */
  consumePayload: () => NavigationPayload | null;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({
  activePage,
  setActivePage,
  children,
}: {
  activePage: PageKey;
  setActivePage: (page: PageKey) => void;
  children: ReactNode;
}) {
  const payloadRef = useRef<NavigationPayload | null>(null);
  const [navigationTick, setNavigationTick] = useState(0);

  const navigate = useCallback((page: PageKey, payload?: NavigationPayload) => {
    payloadRef.current = payload ?? null;
    setActivePage(page);
    setNavigationTick((t) => t + 1);
  }, [setActivePage]);

  const consumePayload = useCallback(() => {
    const p = payloadRef.current;
    payloadRef.current = null;
    return p;
  }, []);

  return (
    <NavigationContext value={{ activePage, navigationTick, navigate, consumePayload }}>
      {children}
    </NavigationContext>
  );
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigation must be used within NavigationProvider");
  return ctx;
}
