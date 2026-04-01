import { ApiError } from "./errors";
import i18n from "../i18n";

type FileDialogFilter = {
  name: string;
  extensions: string[];
};

type PickFilesOptions = {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: FileDialogFilter[];
  allowMultiple?: boolean;
};

type PickDirectoryOptions = {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
};

type CopyFileToDirectoryRequest = {
  sourceFilePath: string;
  targetDirectoryPath: string;
  targetFileName?: string | null;
};

type CopyFileToDirectoryResult = {
  destinationPath: string;
  fileName: string;
  extension: string;
};

function getDesktopBridge() {
  return window.avatarBatchPublisher?.desktop ?? null;
}

export function isDesktopBridgeAvailable(): boolean {
  return getDesktopBridge() !== null;
}

export async function pickFiles(options?: PickFilesOptions): Promise<string[] | null> {
  const bridge = getDesktopBridge();
  if (!bridge) {
    throw new ApiError(0, i18n.t("runtime:desktop.filePickerUnavailable"), "desktop.unavailable", null, {}, null);
  }

  return bridge.pickFiles(options);
}

export async function pickSingleFile(options?: PickFilesOptions): Promise<string | null> {
  const paths = await pickFiles({
    ...options,
    allowMultiple: false
  });

  return paths?.[0] ?? null;
}

export async function pickDirectory(options?: PickDirectoryOptions): Promise<string | null> {
  const bridge = getDesktopBridge();
  if (!bridge) {
    throw new ApiError(0, i18n.t("runtime:desktop.directoryPickerUnavailable"), "desktop.unavailable", null, {}, null);
  }

  return bridge.pickDirectory(options);
}

export async function revealPath(absolutePath: string): Promise<void> {
  const bridge = getDesktopBridge();
  if (!bridge) {
    throw new ApiError(0, i18n.t("runtime:desktop.revealPathUnavailable"), "desktop.unavailable", null, {}, null);
  }

  await bridge.revealPath(absolutePath);
}

export async function copyFileToDirectory(
  request: CopyFileToDirectoryRequest
): Promise<CopyFileToDirectoryResult> {
  const bridge = getDesktopBridge();
  if (!bridge) {
    throw new ApiError(0, i18n.t("runtime:desktop.copyFileUnavailable"), "desktop.unavailable", null, {}, null);
  }

  return bridge.copyFileToDirectory(request);
}

export async function readFileAsDataUrl(absolutePath: string): Promise<string> {
  const bridge = getDesktopBridge();
  if (!bridge) {
    throw new ApiError(0, i18n.t("runtime:desktop.readFileUnavailable"), "desktop.unavailable", null, {}, null);
  }

  return bridge.readFileAsDataUrl(absolutePath);
}
