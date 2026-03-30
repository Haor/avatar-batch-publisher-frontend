import { useEffect, useRef, useState } from "react";

export interface UseEventStreamResult {
  connected: boolean;
  error: boolean;
}

export function useEventStream(
  factory: () => EventSource | null,
  deps: unknown[],
): UseEventStreamResult {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(false);
  const factoryRef = useRef(factory);
  factoryRef.current = factory;

  useEffect(() => {
    const source = factoryRef.current();
    if (!source) {
      setConnected(false);
      setError(false);
      return;
    }

    source.onopen = () => {
      setConnected(true);
      setError(false);
    };

    const prevOnError = source.onerror;
    source.onerror = (event) => {
      setError(true);
      setConnected(false);
      prevOnError?.call(source, event);
    };

    return () => {
      source.close();
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { connected, error };
}
