import type { LocalizedText } from "./localized-text";

export interface AccountSummary {
  accountId: string;
  displayName: string;
  loginName: string;
  isDefault: boolean;
  sessionState: string;
  sessionValid: boolean;
  canPublishAvatars: boolean;
  lastValidatedAt: string | null;
  sessionIssue: string | null;
  sessionIssueText: LocalizedText | null;
  hasStoredCredential: boolean;
  needsReauthentication: boolean;
  supportsAutoRepair: boolean;
}

export interface AccountDetails extends AccountSummary {
  lastUsedAt: string | null;
  lastLoginSucceededAt: string | null;
  lastLoginFailedAt: string | null;
}

export interface AccountLoginRequest {
  userNameOrEmail: string;
  password: string;
}

export interface AccountVerifyTwoFactorRequest {
  challengeId: string;
  code: string;
}

export interface AccountCancelLoginRequest {
  challengeId: string;
}

export interface AccountImportRequest {
  sourceFilePath: string | null;
}

export interface AccountImportSourceResponse {
  suggestedSourcePath: string;
}

export interface AccountLoginResponse {
  status: string;
  message: string;
  messageText: LocalizedText | null;
  challengeId: string | null;
  account: AccountSummary | null;
}

export interface AccountImportResult {
  sourceFilePath: string;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  totalSourceAccounts: number;
  totalAccountsAfterImport: number;
  defaultAccountId: string | null;
}

export interface AccountRepairResult {
  account: AccountDetails;
  attempted: boolean;
  recovered: boolean;
  message: string;
  messageText: LocalizedText | null;
}
