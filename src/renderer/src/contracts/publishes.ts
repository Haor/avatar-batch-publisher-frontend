export interface AcceptedPublishResponse {
  runId: string;
  status: string;
  snapshotUrl: string;
  eventsUrl: string;
}

export interface PublishRunEventPayload {
  runId: string;
  accountId: string | null;
  displayName: string | null;
  reservedAvatarId: string | null;
  stage: string | null;
  outcome: string | null;
  errorMessage: string | null;
  status: string | null;
  occurredAt: string;
  progressText: string | null;
  progressValue: number | null;
  bytesSent: number | null;
  bytesTotal: number | null;
}
