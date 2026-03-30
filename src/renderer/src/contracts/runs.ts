export interface RunAccountSummary {
  accountId: string;
  displayName: string | null;
  reservedAvatarId: string | null;
  stage: string;
  outcome: string;
  errorMessage: string | null;
}

export interface RunSummary {
  runId: string;
  artifactId: string;
  name: string;
  description: string | null;
  tags: string[];
  releaseStatus: string;
  createdAt: string;
  retryOfRunId: string | null;
  status: string;
  successCount: number;
  failedCount: number;
}

export interface RunDetails {
  runId: string;
  artifactId: string;
  name: string;
  description: string | null;
  tags: string[];
  releaseStatus: string;
  createdAt: string;
  retryOfRunId: string | null;
  status: string;
  accounts: RunAccountSummary[];
}
