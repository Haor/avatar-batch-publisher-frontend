import { contextBridge, ipcRenderer } from "electron";

const runtimeInfo = {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
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
