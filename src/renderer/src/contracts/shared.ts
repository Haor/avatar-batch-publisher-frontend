import type { LocalizedText } from "./localized-text";

export interface CollectionResponse<TItem> {
  items: TItem[];
}

export interface PaginationInfo {
  limit: number;
  offset: number;
  returnedCount: number;
  hasMore: boolean;
  nextOffset: number | null;
}

export interface PagedCollectionResponse<TItem> {
  items: TItem[];
  pagination: PaginationInfo;
}

export interface OperationStatusResponse {
  status: string;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    messageText?: LocalizedText | null;
    traceId?: string;
    details?: Record<string, string>;
  };
}

export interface RuntimeNotice {
  title: string;
  detail: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}
