import { contextBridge, ipcRenderer } from "electron";

type RuntimeMode = "browser" | "desktop-dev" | "desktop-release";
type BackendLifecycleState = "starting" | "ready" | "degraded" | "stopped";

type BackendLifecycleEvent = {
  state: BackendLifecycleState;
  message: string;
  baseUrl: string | null;
  logDirectoryPath: string | null;
};

function readRuntimeArg(prefix: string): string | null {
  const entry = process.argv.find((value) => value.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : null;
}

const runtimeMode = (readRuntimeArg("--abp-runtime-mode=") ?? "browser") as RuntimeMode;
const backendBaseUrl = readRuntimeArg("--abp-backend-base-url=");
const logDirectoryPath = readRuntimeArg("--abp-log-dir=");

const runtimeInfo = {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  },
  runtime: {
    mode: runtimeMode,
    backendBaseUrl,
    logDirectoryPath,
    onBackendLifecycle: (listener: (event: BackendLifecycleEvent) => void) => {
      const wrapped = (_event: unknown, payload: BackendLifecycleEvent) => listener(payload);
      ipcRenderer.on("runtime:backend-lifecycle", wrapped);
      return () => {
        ipcRenderer.removeListener("runtime:backend-lifecycle", wrapped);
      };
    },
    revealLogDirectory: () => ipcRenderer.invoke("runtime:reveal-log-directory") as Promise<void>
  },
  desktop: {
    pickFiles: (options?: {
      title?: string;
      defaultPath?: string;
      buttonLabel?: string;
      filters?: Array<{ name: string; extensions: string[] }>;
      allowMultiple?: boolean;
    }) => ipcRenderer.invoke("desktop:pick-files", options) as Promise<string[] | null>,
    pickDirectory: (options?: {
      title?: string;
      defaultPath?: string;
      buttonLabel?: string;
    }) => ipcRenderer.invoke("desktop:pick-directory", options) as Promise<string | null>,
    revealPath: (absolutePath: string) => ipcRenderer.invoke("desktop:reveal-path", absolutePath) as Promise<void>,
    copyFileToDirectory: (request: {
      sourceFilePath: string;
      targetDirectoryPath: string;
      targetFileName?: string | null;
    }) =>
      ipcRenderer.invoke("desktop:copy-file-to-directory", request) as Promise<{
        destinationPath: string;
        fileName: string;
        extension: string;
      }>,
    readFileAsDataUrl: (absolutePath: string) =>
      ipcRenderer.invoke("desktop:read-file-as-data-url", absolutePath) as Promise<string>
  }
};

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld("avatarBatchPublisher", runtimeInfo);
} else {
  (globalThis as typeof globalThis & { avatarBatchPublisher: typeof runtimeInfo }).avatarBatchPublisher = runtimeInfo;
}
