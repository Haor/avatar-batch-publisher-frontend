export interface AvatarBatchPublisherFileDialogFilter {
  name: string;
  extensions: string[];
}

export interface AvatarBatchPublisherDesktopBridge {
  pickFiles: (options?: {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
    filters?: AvatarBatchPublisherFileDialogFilter[];
    allowMultiple?: boolean;
  }) => Promise<string[] | null>;
  pickDirectory: (options?: {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
  }) => Promise<string | null>;
  revealPath: (absolutePath: string) => Promise<void>;
  copyFileToDirectory: (request: {
    sourceFilePath: string;
    targetDirectoryPath: string;
    targetFileName?: string | null;
  }) => Promise<{
    destinationPath: string;
    fileName: string;
    extension: string;
  }>;
  readFileAsDataUrl: (absolutePath: string) => Promise<string>;
}

export interface AvatarBatchPublisherRuntimeInfo {
  platform: NodeJS.Platform;
  versions: {
    electron: string;
    chrome: string;
    node: string;
  };
  desktop?: AvatarBatchPublisherDesktopBridge;
}

declare global {
  interface Window {
    avatarBatchPublisher: AvatarBatchPublisherRuntimeInfo;
  }
}

export {};
