import { createContext, useContext, useState, type ReactNode } from "react";
import { createBackendApi, resolveBackendBaseUrl, type BackendApi } from "../lib/backend";

const ApiContext = createContext<BackendApi | null>(null);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [api] = useState(() => createBackendApi(resolveBackendBaseUrl()));
  return <ApiContext value={api}>{children}</ApiContext>;
}

export function useApi(): BackendApi {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error("useApi must be used within ApiProvider");
  return ctx;
}
