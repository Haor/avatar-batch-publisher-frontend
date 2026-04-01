export interface LocalizedText {
  code: string;
  args?: Record<string, string | null> | null;
  fallback?: string | null;
}
