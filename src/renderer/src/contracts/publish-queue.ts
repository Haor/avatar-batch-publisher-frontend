export interface PublishPreflightCheck {
  key: string;
  title: string;
  detail: string;
  isPassing: boolean;
}

export interface PublishPreflightRequest {
  artifactId: string;
  accountIds: string[];
  name: string;
  description: string | null;
  tags: string[];
  releaseStatus: "private" | "public";
  retryOfRunId: string | null;
}

export interface PublishPreflightResult {
  canStart: boolean;
  summary: string;
  primaryActionHint: string;
  accountSelectionLabel: string;
  checks: PublishPreflightCheck[];
}

export interface PublishQueueCreateItemRequest {
  artifactId: string;
  accountIds: string[];
  name: string;
  description: string | null;
  tags: string[];
  releaseStatus: string;
  thumbnailPath: string | null;
}

export interface PublishQueueCreateRequest {
  queueName: string;
  items: PublishQueueCreateItemRequest[];
}

export interface AcceptedPublishQueueResponse {
  queueId: string;
  status: string;
  resourcePath: string;
  eventsPath: string;
}

export interface PublishQueueExecutionDetails {
  executionId: string;
  queueItemId: string;
  artifactId: string;
  accountId: string;
  laneKey: string;
  status: string;
  runId: string | null;
  attemptCount: number;
  sortOrder: number;
  startedAt: string | null;
  completedAt: string | null;
  stage: string | null;
  progressText: string | null;
  progressValue: number | null;
  bytesSent: number | null;
  bytesTotal: number | null;
  lastError: string | null;
}

export interface PublishQueueItemDetails {
  queueItemId: string;
  artifactId: string;
  accountIds: string[];
  name: string;
  description: string | null;
  tags: string[];
  releaseStatus: string;
  status: string;
  runId: string | null;
  attemptCount: number;
  sortOrder: number;
  startedAt: string | null;
  completedAt: string | null;
  successCount: number;
  failedCount: number;
  lastError: string | null;
  pendingCount: number;
  runningCount: number;
  executions: PublishQueueExecutionDetails[] | null;
}

export interface PublishQueueDetails {
  queueId: string;
  name: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  itemCount: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  runningCount: number;
  items: PublishQueueItemDetails[];
  retryOfQueueId: string | null;
  executionCount: number;
  executionSuccessCount: number;
  executionFailedCount: number;
  executionPendingCount: number;
  executionRunningCount: number;
}

export interface PublishQueueEventPayload {
  queueEventId?: string;
  queueId?: string;
  queueItemId?: string | null;
  executionId?: string | null;
  runId?: string | null;
  accountId?: string | null;
  artifactId?: string | null;
  status?: string | null;
  stage?: string | null;
  progressText?: string | null;
  progressValue?: number | null;
  bytesSent?: number | null;
  bytesTotal?: number | null;
  lastError?: string | null;
  [key: string]: unknown;
}
