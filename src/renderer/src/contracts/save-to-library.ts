import type { ArtifactSummary } from "./artifacts";
import type { LocalizedText } from "./localized-text";

export interface SaveToLibraryRequest {
  accountId: string;
  platform: string | null;
  nameOverride: string | null;
  linkToExistingEntryId: string | null;
}

export interface SaveToLibraryAccepted {
  taskId: string;
  status: string;
  location: string;
  events: string;
}

export interface SaveToLibraryResult {
  artifactId: string;
  artifact?: ArtifactSummary;
}

export interface SaveToLibraryTask {
  taskId: string;
  accountId: string;
  avatarId: string;
  status: "queued" | "running" | "completed" | "failed";
  stage: string | null;
  progressText: string | null;
  progressTextResource: LocalizedText | null;
  progressValue: number | null;
  bytesReceived: number | null;
  bytesTotal: number | null;
  lastError: string | null;
  result: SaveToLibraryResult | null;
}
