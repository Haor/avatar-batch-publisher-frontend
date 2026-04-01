type RuntimeBridge = Window["avatarBatchPublisher"]["runtime"];
type RuntimeMode = NonNullable<RuntimeBridge>["mode"];
type BackendLifecycleEvent = Parameters<
  NonNullable<NonNullable<RuntimeBridge>["onBackendLifecycle"]>
>[0] extends (event: infer T) => void
  ? T
  : never;

function getRuntimeBridge(): RuntimeBridge | null {
  return window.avatarBatchPublisher?.runtime ?? null;
}

export function getRuntimeMode(): RuntimeMode {
  return getRuntimeBridge()?.mode ?? "browser";
}

export function getRuntimeBackendBaseUrl(): string | null {
  return getRuntimeBridge()?.backendBaseUrl?.trim() || null;
}

export function getRuntimeLogDirectoryPath(): string | null {
  return getRuntimeBridge()?.logDirectoryPath?.trim() || null;
}

export function getRuntimePreferredSystemLanguages(): string[] {
  return getRuntimeBridge()?.preferredSystemLanguages?.filter(Boolean) ?? [];
}

export function getRuntimeSystemLocale(): string | null {
  return getRuntimeBridge()?.systemLocale?.trim() || null;
}

export function subscribeBackendLifecycle(
  listener: (event: BackendLifecycleEvent) => void
): (() => void) | null {
  const unsubscribe = getRuntimeBridge()?.onBackendLifecycle?.(listener);
  return typeof unsubscribe === "function" ? unsubscribe : null;
}

export async function revealRuntimeLogDirectory(): Promise<void> {
  await getRuntimeBridge()?.revealLogDirectory?.();
}
