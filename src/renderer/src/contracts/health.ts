export interface BackendHealth {
  service: string;
  version: string;
  status: "ok" | "degraded";
  serverTime: string;
}
