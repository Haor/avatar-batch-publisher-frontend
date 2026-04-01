export const supportedLocales = ["zh-CN", "zh-TW", "ja", "en"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];
export type LanguagePreference = SupportedLocale | "system";

const languagePreferenceStorageKey = "abp.language.preference";

const localeDisplayNames: Record<SupportedLocale, Record<SupportedLocale, string>> = {
  "zh-CN": {
    "zh-CN": "简体中文",
    "zh-TW": "繁體中文",
    ja: "日语",
    en: "英语",
  },
  "zh-TW": {
    "zh-CN": "簡體中文",
    "zh-TW": "繁體中文",
    ja: "日文",
    en: "英文",
  },
  ja: {
    "zh-CN": "簡体字中国語",
    "zh-TW": "繁體字中国語",
    ja: "日本語",
    en: "英語",
  },
  en: {
    "zh-CN": "Simplified Chinese",
    "zh-TW": "Traditional Chinese",
    ja: "Japanese",
    en: "English",
  },
};

function normalizeChineseLocale(input: string): SupportedLocale {
  const normalized = input.toLowerCase();

  if (
    normalized.includes("zh-hant") ||
    normalized.includes("zh-tw") ||
    normalized.includes("zh-hk") ||
    normalized.includes("zh-mo")
  ) {
    return "zh-TW";
  }

  return "zh-CN";
}

export function normalizeLocale(input: string | null | undefined): SupportedLocale | null {
  if (!input) return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("zh")) {
    return normalizeChineseLocale(trimmed);
  }

  const normalized = trimmed.toLowerCase();
  if (normalized.startsWith("ja")) return "ja";
  if (normalized.startsWith("en")) return "en";

  return null;
}

export function isLanguagePreference(value: string | null | undefined): value is LanguagePreference {
  if (!value) return false;
  return value === "system" || supportedLocales.includes(value as SupportedLocale);
}

export function getStoredLanguagePreference(): LanguagePreference | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(languagePreferenceStorageKey);
    return isLanguagePreference(value) ? value : null;
  } catch {
    return null;
  }
}

export function setStoredLanguagePreference(preference: LanguagePreference): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(languagePreferenceStorageKey, preference);
  } catch {
    // ignore localStorage failures
  }
}

export function getBrowserPreferredLanguages(): string[] {
  if (typeof navigator === "undefined") return [];

  if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
    return navigator.languages.filter(Boolean);
  }

  return navigator.language ? [navigator.language] : [];
}

export function getInitialLanguagePreference(): LanguagePreference {
  return getStoredLanguagePreference() ?? "system";
}

export function resolveLocaleFromCandidates(candidates: string[]): SupportedLocale {
  for (const candidate of candidates) {
    const resolved = normalizeLocale(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return "en";
}

export function getLocaleDisplayName(locale: SupportedLocale, uiLocale: SupportedLocale): string {
  return localeDisplayNames[uiLocale]?.[locale] ?? localeDisplayNames.en[locale];
}
