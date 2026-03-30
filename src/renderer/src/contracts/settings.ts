export interface NetworkSettings {
  mode: "system" | "none" | "custom";
  proxyUrl: string | null;
}

export interface UpdateNetworkSettingsRequest extends NetworkSettings {}

export interface StorageSettings {
  basePath: string;
}
