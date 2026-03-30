import { useEffect, useRef } from "react";
import { useNavigation } from "../../app/NavigationContext";
import type { PageKey } from "../../app/navigation";

/**
 * KeepAlive 页面在重新被激活时主动刷新，避免停留在旧快照。
 */
export function usePageActivationRefresh(page: PageKey, refetch: () => void) {
  const { activePage, navigationTick } = useNavigation();
  const lastSeenTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (activePage !== page) return;

    if (lastSeenTickRef.current === null) {
      lastSeenTickRef.current = navigationTick;
      return;
    }

    if (lastSeenTickRef.current !== navigationTick) {
      lastSeenTickRef.current = navigationTick;
      refetch();
    }
  }, [activePage, navigationTick, page, refetch]);
}
