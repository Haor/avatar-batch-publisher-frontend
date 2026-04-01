import i18n from "./index";
import type { LocalizedText } from "../contracts/localized-text";

export function resolveLocalizedText(
  text: LocalizedText | null | undefined,
  fallback?: string | null,
): string | null {
  if (!text?.code) {
    return fallback ?? null;
  }

  return i18n.t(text.code, {
    ...(text.args ?? {}),
    defaultValue: text.fallback ?? fallback ?? text.code,
  });
}
