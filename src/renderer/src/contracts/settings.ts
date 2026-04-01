export interface NetworkSettings {
  mode: "system" | "none" | "custom";
  proxyUrl: string | null;
}

export interface UpdateNetworkSettingsRequest extends NetworkSettings {}

export type LanguageLocale = "system" | "zh-CN" | "zh-TW" | "ja" | "en";

export interface LanguageSettings {
  locale: LanguageLocale;
}

export interface StorageSettings {
  basePath: string;
}
