import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { defaultNamespace, namespaces, resources } from "./resources";
import {
  type LanguagePreference,
  type SupportedLocale,
  getBrowserPreferredLanguages,
  getInitialLanguagePreference,
  normalizeLocale,
  resolveLocaleFromCandidates,
  setStoredLanguagePreference,
} from "./locale";
import { getRuntimePreferredSystemLanguages, getRuntimeSystemLocale } from "../lib/runtime";

function detectSystemLocale(): SupportedLocale {
  const runtimeCandidates = [
    ...getRuntimePreferredSystemLanguages(),
    getRuntimeSystemLocale(),
  ].filter(Boolean) as string[];

  if (runtimeCandidates.length > 0) {
    return resolveLocaleFromCandidates(runtimeCandidates);
  }

  return resolveLocaleFromCandidates(getBrowserPreferredLanguages());
}

export function resolveLanguagePreference(preference: LanguagePreference): SupportedLocale {
  if (preference === "system") {
    return detectSystemLocale();
  }

  return normalizeLocale(preference) ?? "en";
}

export function applyLanguagePreference(preference: LanguagePreference): SupportedLocale {
  setStoredLanguagePreference(preference);
  return resolveLanguagePreference(preference);
}

function applyDocumentLanguage(locale: SupportedLocale): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.lang = locale;
}

const initialPreference = getInitialLanguagePreference();
const initialLocale = applyLanguagePreference(initialPreference);
applyDocumentLanguage(initialLocale);

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLocale,
    fallbackLng: {
      "zh-TW": ["zh-CN", "en"],
      default: ["en"],
    },
    supportedLngs: ["zh-CN", "zh-TW", "ja", "en"],
    ns: [...namespaces],
    defaultNS: defaultNamespace,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    returnNull: false,
  });

i18n.on("languageChanged", (locale) => {
  const normalized = normalizeLocale(locale);
  if (normalized) {
    applyDocumentLanguage(normalized);
  }
});

export default i18n;
