import { useCallback, useEffect, useRef, useState } from "react";

export interface UseQueryOptions {
  keepPreviousData?: boolean;
}

export interface UseQueryResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  stale: boolean;
  refetch: () => void;
}

export function useQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
  options?: UseQueryOptions,
): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const prevDepsRef = useRef<unknown[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const currentDeps = deps;
    const depsChanged = currentDeps.some((d, i) => d !== prevDepsRef.current[i]);
    prevDepsRef.current = currentDeps;

    if (depsChanged) {
      if (optionsRef.current?.keepPreviousData && data !== null) {
        setStale(true);
        setLoading(true);
      } else {
        setData(null);
        setError(null);
        setLoading(true);
        setStale(false);
      }
    } else {
      setLoading((prev) => data === null ? true : prev);
    }

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
          setLoading(false);
          setStale(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled && !(err instanceof DOMException && err.name === "AbortError")) {
          if (data === null) {
            setError(err instanceof Error ? err : new Error(String(err)));
          }
          setLoading(false);
          setStale(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { data, error, loading, stale, refetch };
}
