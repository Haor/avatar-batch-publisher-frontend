import { useCallback, useEffect, useRef, useState } from "react";

export interface UseQueryResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refetch: () => void;
}

export function useQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // 追踪 deps 是否真正变化（排除 tick 触发的同源刷新）
  const prevDepsRef = useRef<unknown[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    // 判断是 deps 变化（换源）还是 tick 变化（同源刷新）
    const currentDeps = deps;
    const depsChanged = currentDeps.some((d, i) => d !== prevDepsRef.current[i]);
    prevDepsRef.current = currentDeps;

    if (depsChanged) {
      // 换源：清空旧数据，显示 loading
      setData(null);
      setError(null);
      setLoading(true);
    } else {
      // 同源刷新：有缓存时静默
      setLoading((prev) => data === null ? true : prev);
    }

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled && !(err instanceof DOMException && err.name === "AbortError")) {
          if (data === null) {
            setError(err instanceof Error ? err : new Error(String(err)));
          }
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { data, error, loading, refetch };
}
