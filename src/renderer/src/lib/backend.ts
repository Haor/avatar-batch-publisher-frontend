import type {
  AccountCancelLoginRequest,
  AccountDetails,
  AccountImportRequest,
  AccountImportResult,
  AccountImportSourceResponse,
  AccountLoginRequest,
  AccountLoginResponse,
  AccountRepairResult,
  AccountSummary,
  AccountVerifyTwoFactorRequest
} from "../contracts/accounts";
import type { HomeOverview } from "../contracts/home";
import type {
  ArtifactDetails,
  ArtifactImportFromBundleRequest,
  ArtifactImportFromManifestRequest,
  ArtifactUpdateRequest,
  ArtifactResponse,
  ArtifactSummary
} from "../contracts/artifacts";
import type {
  SaveToLibraryRequest,
  SaveToLibraryAccepted,
  SaveToLibraryTask,
} from "../contracts/save-to-library";
import type { BackendHealth } from "../contracts/health";
import type {
  MyAvatarActionRequest,
  MyAvatarDetails,
  MyAvatarDownloadRecord,
  MyAvatarDownloadRequest,
  MyAvatarImportRequest,
  MyAvatarImportResult,
  MyAvatarStyleOption,
  MyAvatarSummary,
  MyAvatarUpdateImageRequest,
  MyAvatarUpdateInfoRequest
} from "../contracts/my-avatars";
import type {
  PublishPreflightRequest,
  PublishPreflightResult,
  PublishQueueCreateRequest,
  PublishQueueDetails,
  PublishQueueEventPayload,
  AcceptedPublishQueueResponse
} from "../contracts/publish-queue";
import type { AcceptedPublishResponse, PublishRunEventPayload } from "../contracts/publishes";
import type { RunDetails, RunSummary } from "../contracts/runs";
import type { NetworkSettings, UpdateNetworkSettingsRequest, StorageSettings } from "../contracts/settings";
import type { CollectionResponse, PagedCollectionResponse, OperationStatusResponse } from "../contracts/shared";
import { requestJson } from "./http";
import { buildQueryString } from "./query-string";
import { createEventStream, type SseHandlers } from "./sse";

const DEFAULT_BACKEND_BASE_URL = "http://127.0.0.1:38124/api/v1";

export function resolveBackendBaseUrl(): string {
  return import.meta.env.VITE_BACKEND_BASE_URL?.trim() || DEFAULT_BACKEND_BASE_URL;
}

export function createBackendApi(baseUrl: string) {
  return {
    health: {
      get: (signal?: AbortSignal) => requestJson<BackendHealth>(baseUrl, "/health", { signal })
    },
    home: {
      getOverview: (recentLimit = 8, signal?: AbortSignal) =>
        requestJson<HomeOverview>(baseUrl, `/home/overview${buildQueryString({ recentLimit })}`, { signal })
    },
    accounts: {
      list: (signal?: AbortSignal) =>
        requestJson<CollectionResponse<AccountSummary>>(baseUrl, "/accounts", { signal }),
      getImportSource: (signal?: AbortSignal) =>
        requestJson<AccountImportSourceResponse>(baseUrl, "/accounts/import-source", { signal }),
      get: (accountId: string, signal?: AbortSignal) =>
        requestJson<AccountDetails>(baseUrl, `/accounts/${accountId}`, { signal }),
      importSessions: (input: AccountImportRequest, signal?: AbortSignal) =>
        requestJson<AccountImportResult>(baseUrl, "/accounts/import", {
          method: "POST",
          signal,
          body: JSON.stringify(input)
        }),
      login: (input: AccountLoginRequest, signal?: AbortSignal) =>
        requestJson<AccountLoginResponse>(baseUrl, "/accounts/login", {
          method: "POST",
          signal,
          body: JSON.stringify(input)
        }),
      verifyTwoFactor: (input: AccountVerifyTwoFactorRequest, signal?: AbortSignal) =>
        requestJson<AccountLoginResponse>(baseUrl, "/accounts/login/verify-2fa", {
          method: "POST",
          signal,
          body: JSON.stringify(input)
        }),
      cancelLogin: (input: AccountCancelLoginRequest, signal?: AbortSignal) =>
        requestJson<void>(baseUrl, "/accounts/login/cancel", {
          method: "POST",
          signal,
          body: JSON.stringify(input)
        }),
      refresh: (accountId: string, signal?: AbortSignal) =>
        requestJson<AccountSummary>(baseUrl, `/accounts/${accountId}/refresh`, { method: "POST", signal }),
      setDefault: (accountId: string, signal?: AbortSignal) =>
        requestJson<AccountSummary>(baseUrl, `/accounts/${accountId}/set-default`, { method: "POST", signal }),
      logout: (accountId: string, signal?: AbortSignal) =>
        requestJson<AccountDetails>(baseUrl, `/accounts/${accountId}/logout`, { method: "POST", signal }),
      repair: (accountId: string, signal?: AbortSignal) =>
        requestJson<AccountRepairResult>(baseUrl, `/accounts/${accountId}/repair`, { method: "POST", signal }),
      remove: (accountId: string, signal?: AbortSignal) =>
        requestJson<OperationStatusResponse>(baseUrl, `/accounts/${accountId}`, { method: "DELETE", signal })
    },
    myAvatars: {
      list: (
        params: {
          accountId: string;
          limit?: number;
          offset?: number;
          search?: string;
          sort?: string;
          order?: string;
          releaseStatus?: string;
        },
        signal?: AbortSignal
      ) =>
        requestJson<PagedCollectionResponse<MyAvatarSummary>>(
          baseUrl,
          `/my-avatars${buildQueryString({
            accountId: params.accountId,
            limit: params.limit ?? 50,
            offset: params.offset ?? 0,
            search: params.search ?? null,
            sort: params.sort ?? "updated",
            order: params.order ?? "descending",
            releaseStatus: params.releaseStatus ?? "all"
          })}`,
          { signal }
        ),
      get: (accountId: string, avatarId: string, signal?: AbortSignal) =>
        requestJson<MyAvatarDetails>(
          baseUrl,
          `/my-avatars/${avatarId}${buildQueryString({ accountId })}`,
          { signal }
        ),
      listStyles: (accountId: string, signal?: AbortSignal) =>
        requestJson<CollectionResponse<MyAvatarStyleOption>>(
          baseUrl,
          `/my-avatars/styles${buildQueryString({ accountId })}`,
          { signal }
        ),
      updateInfo: (avatarId: string, input: MyAvatarUpdateInfoRequest, signal?: AbortSignal) =>
        requestJson<MyAvatarDetails>(baseUrl, `/my-avatars/${avatarId}`, {
          method: "PATCH",
          signal,
          body: JSON.stringify(input)
        }),
      updateImage: (avatarId: string, input: MyAvatarUpdateImageRequest, signal?: AbortSignal) =>
        requestJson<MyAvatarDetails>(baseUrl, `/my-avatars/${avatarId}/image`, {
          method: "POST",
          signal,
          body: JSON.stringify(input)
        }),
      select: (avatarId: string, input: MyAvatarActionRequest, signal?: AbortSignal) =>
        requestJson<MyAvatarDetails>(baseUrl, `/my-avatars/${avatarId}/select`, {
          method: "POST",
          signal,
          body: JSON.stringify(input)
        }),
      selectFallback: (avatarId: string, input: MyAvatarActionRequest, signal?: AbortSignal) =>
        requestJson<MyAvatarDetails>(baseUrl, `/my-avatars/${avatarId}/select-fallback`, {
          method: "POST",
          signal,
          body: JSON.stringify(input)
        }),
      download: (avatarId: string, input: MyAvatarDownloadRequest, signal?: AbortSignal) =>
        requestJson<MyAvatarDownloadRecord>(baseUrl, `/my-avatars/${avatarId}/download`, {
          method: "POST",
          signal,
          body: JSON.stringify(input)
        }),
      importToArtifacts: (avatarId: string, input: MyAvatarImportRequest, signal?: AbortSignal) =>
        requestJson<MyAvatarImportResult>(baseUrl, `/my-avatars/${avatarId}/import`, {
          method: "POST",
          signal,
          body: JSON.stringify(input)
        }),
      remove: (avatarId: string, input: MyAvatarActionRequest, signal?: AbortSignal) =>
        requestJson<OperationStatusResponse>(baseUrl, `/my-avatars/${avatarId}`, {
          method: "DELETE",
          signal,
          body: JSON.stringify(input)
        }),
      saveToLibrary: (avatarId: string, input: SaveToLibraryRequest, signal?: AbortSignal) =>
        requestJson<SaveToLibraryAccepted>(baseUrl, `/my-avatars/${avatarId}/save-to-library`, {
          method: "POST",
          signal,
          body: JSON.stringify(input)
        }),
      getSaveToLibraryTask: (taskId: string, signal?: AbortSignal) =>
        requestJson<SaveToLibraryTask>(baseUrl, `/my-avatars/save-to-library/${taskId}`, { signal }),
      streamSaveToLibrary: (taskId: string, handlers: SseHandlers<SaveToLibraryTask>) =>
        createEventStream<SaveToLibraryTask>(
          baseUrl,
          `/my-avatars/save-to-library/${taskId}/events`,
          [
            "save_to_library.queued",
            "save_to_library.started",
            "save_to_library.progress",
            "save_to_library.completed",
            "save_to_library.failed",
          ],
          handlers,
        )
    },
    artifacts: {
      list: (signal?: AbortSignal) =>
        requestJson<CollectionResponse<ArtifactSummary>>(baseUrl, "/artifacts", { signal }),
      get: (artifactId: string, signal?: AbortSignal) =>
        requestJson<ArtifactDetails>(baseUrl, `/artifacts/${artifactId}`, { signal }),
      update: (artifactId: string, input: ArtifactUpdateRequest, signal?: AbortSignal) =>
        requestJson<ArtifactDetails>(baseUrl, `/artifacts/${artifactId}`, {
          method: "PATCH",
          signal,
          body: JSON.stringify(input),
        }),
      importFromBundle: (input: ArtifactImportFromBundleRequest, signal?: AbortSignal) =>
        requestJson<ArtifactResponse>(baseUrl, "/artifacts/import-from-bundle", {
          method: "POST",
          signal,
          body: JSON.stringify(input)
        }).then((response) => response.artifact),
      importFromManifest: (input: ArtifactImportFromManifestRequest, signal?: AbortSignal) =>
        requestJson<ArtifactResponse>(baseUrl, "/artifacts/import-from-manifest", {
          method: "POST",
          signal,
          body: JSON.stringify(input)
        }).then((response) => response.artifact),
      remove: (artifactId: string, signal?: AbortSignal) =>
        requestJson<OperationStatusResponse>(baseUrl, `/artifacts/${artifactId}`, { method: "DELETE", signal })
    },
    publishQueue: {
      preflight: (input: PublishPreflightRequest, signal?: AbortSignal) =>
        requestJson<PublishPreflightResult>(baseUrl, "/publishes/preflight", {
          method: "POST",
          signal,
          body: JSON.stringify(input)
        }),
      create: (input: PublishQueueCreateRequest, signal?: AbortSignal) =>
        requestJson<AcceptedPublishQueueResponse>(baseUrl, "/publish-queue", {
          method: "POST",
          signal,
          body: JSON.stringify(input)
        }),
      get: (queueId: string, signal?: AbortSignal) =>
        requestJson<PublishQueueDetails>(baseUrl, `/publish-queue/${queueId}`, { signal }),
      retryFailed: (queueId: string, signal?: AbortSignal) =>
        requestJson<AcceptedPublishQueueResponse>(baseUrl, `/publish-queue/${queueId}/retry-failed`, {
          method: "POST",
          signal
        }),
      stream: (queueId: string, handlers: Parameters<typeof createEventStream<PublishQueueEventPayload>>[3]) =>
        createEventStream<PublishQueueEventPayload>(
          baseUrl,
          `/publish-queue/${queueId}/events`,
          [
            "queue.created",
            "queue.started",
            "queue.execution.started",
            "queue.execution.progress",
            "queue.execution.completed",
            "queue.execution.failed",
            "queue.completed"
          ],
          handlers
        )
    },
    runs: {
      list: (signal?: AbortSignal) =>
        requestJson<CollectionResponse<RunSummary>>(baseUrl, "/runs", { signal }),
      get: (runId: string, signal?: AbortSignal) =>
        requestJson<RunDetails>(baseUrl, `/runs/${runId}`, { signal }),
      retryFailed: (runId: string, signal?: AbortSignal) =>
        requestJson<AcceptedPublishResponse>(baseUrl, `/runs/${runId}/retry-failed`, {
          method: "POST",
          signal
        })
    },
    settings: {
      getNetwork: (signal?: AbortSignal) =>
        requestJson<NetworkSettings>(baseUrl, "/settings/network", { signal }),
      updateNetwork: (input: UpdateNetworkSettingsRequest, signal?: AbortSignal) =>
        requestJson<NetworkSettings>(baseUrl, "/settings/network", {
          method: "PUT",
          signal,
          body: JSON.stringify(input)
        }),
      getStorage: (signal?: AbortSignal) =>
        requestJson<StorageSettings>(baseUrl, "/settings/storage", { signal }),
      updateStorage: (input: StorageSettings, signal?: AbortSignal) =>
        requestJson<StorageSettings>(baseUrl, "/settings/storage", {
          method: "PUT",
          signal,
          body: JSON.stringify(input)
        })
    },
    publishes: {
      start: (input: PublishPreflightRequest, signal?: AbortSignal) =>
        requestJson<AcceptedPublishResponse>(baseUrl, "/publishes", {
          method: "POST",
          signal,
          body: JSON.stringify(input)
        }),
      get: (runId: string, signal?: AbortSignal) =>
        requestJson<import("../contracts/runs").RunDetails>(baseUrl, `/publishes/${runId}`, { signal }),
      stream: (runId: string, handlers: Parameters<typeof createEventStream<PublishRunEventPayload>>[3]) =>
        createEventStream<PublishRunEventPayload>(
          baseUrl,
          `/publishes/${runId}/events`,
          [
            "publish.started",
            "account.started",
            "account.reserved",
            "account.rewriting",
            "account.uploading",
            "account.polling",
            "account.progress",
            "account.succeeded",
            "account.failed",
            "publish.completed"
          ],
          handlers
        )
    }
  };
}

export type BackendApi = ReturnType<typeof createBackendApi>;
