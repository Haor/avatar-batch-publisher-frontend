import i18n from "../../i18n";

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return i18n.t("common:emDash");
  }

  return new Intl.DateTimeFormat(i18n.resolvedLanguage || "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
