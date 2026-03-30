import { useCallback, useEffect, useRef, useState } from "react";

export interface UseMutationResult<TInput, TResult> {
  execute: (input: TInput) => Promise<TResult>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useMutation<TInput = void, TResult = void>(
  action: (input: TInput, signal: AbortSignal) => Promise<TResult>,
): UseMutationResult<TInput, TResult> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const actionRef = useRef(action);
  actionRef.current = action;
  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;  // StrictMode re-mount 后重置
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  const execute = useCallback(async (input: TInput): Promise<TResult> => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await actionRef.current(input, controller.signal);
      if (mountedRef.current) setLoading(false);
      return result;
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      if (mountedRef.current) {
        setError(e);
        setLoading(false);
      }
      throw e;
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return { execute, loading, error, reset };
}
