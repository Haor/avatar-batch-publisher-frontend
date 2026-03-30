export interface HomeStats {
  cloudAvatarCount: number;
  localArtifactCount: number;
  connectedAccountCount: number;
}

export interface HomeActiveQueueAccount {
  accountId: string;
  accountDisplayName: string | null;
  status: string;
}

export interface HomeActiveQueue {
  queueId: string;
  name: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  itemCount: number;
  executionCount: number;
  executionSuccessCount: number;
  executionFailedCount: number;
  executionPendingCount: number;
  executionRunningCount: number;
  accounts: HomeActiveQueueAccount[];
  focusExecution: HomeFocusExecution | null;
}

export interface HomeFocusExecution {
  executionId: string;
  queueItemId: string;
  artifactId: string;
  artifactName: string;
  accountId: string;
  accountDisplayName: string | null;
  status: string;
  stage: string | null;
  progressText: string | null;
  progressValue: number | null;
  bytesSent: number | null;
  bytesTotal: number | null;
  phaseKey: string;
  phaseLabel: string;
  phaseIndex: number;
  lastError: string | null;
}

export interface HomeRecentActivity {
  activityId: string;
  type: string;
  status: string;
  title: string;
  subtitle: string;
  occurredAt: string;
  queueId: string | null;
  runId: string | null;
  artifactId: string | null;
  accountId: string | null;
  avatarId: string | null;
}

export interface HomeOverview {
  generatedAt: string;
  stats: HomeStats;
  activeQueue: HomeActiveQueue | null;
  recentActivities: HomeRecentActivity[];
}
