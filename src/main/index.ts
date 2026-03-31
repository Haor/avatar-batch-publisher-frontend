import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import type { OpenDialogOptions } from "electron";
import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { basename, extname, parse } from "node:path";

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

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function buildUniqueDestinationPath(targetDirectoryPath: string, targetFileName: string): Promise<string> {
  const parsed = parse(targetFileName);
  let attempt = 0;

  while (true) {
    const candidateName = attempt === 0 ? targetFileName : `${parsed.name} (${attempt})${parsed.ext}`;
    const candidatePath = join(targetDirectoryPath, candidateName);

    if (!(await pathExists(candidatePath))) {
      return candidatePath;
    }

    attempt += 1;
  }
}

function registerDesktopHandlers(): void {
  ipcMain.handle("desktop:pick-files", async (_event, options: PickFilesOptions = {}) => {
    const window = BrowserWindow.getFocusedWindow();
    const dialogOptions: OpenDialogOptions = {
      title: options.title,
      defaultPath: options.defaultPath,
      buttonLabel: options.buttonLabel,
      properties: options.allowMultiple ? ["openFile", "multiSelections"] : ["openFile"],
      filters: options.filters
    };
    const response = window
      ? await dialog.showOpenDialog(window, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions);

    return response.canceled ? null : response.filePaths;
  });

  ipcMain.handle("desktop:pick-directory", async (_event, options: PickDirectoryOptions = {}) => {
    const window = BrowserWindow.getFocusedWindow();
    const dialogOptions: OpenDialogOptions = {
      title: options.title,
      defaultPath: options.defaultPath,
      buttonLabel: options.buttonLabel,
      properties: ["openDirectory", "createDirectory"]
    };
    const response = window
      ? await dialog.showOpenDialog(window, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions);

    return response.canceled ? null : response.filePaths[0] ?? null;
  });

  ipcMain.handle("desktop:read-file-as-data-url", async (_event, absolutePath: string) => {
    const ext = extname(absolutePath).toLowerCase().replace(".", "");
    const mimeMap: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      gif: "image/gif",
      svg: "image/svg+xml",
    };
    const mime = mimeMap[ext] ?? "application/octet-stream";
    const buffer = await readFile(absolutePath);
    return `data:${mime};base64,${buffer.toString("base64")}`;
  });

  ipcMain.handle("desktop:reveal-path", async (_event, absolutePath: string) => {
    if (absolutePath) {
      shell.showItemInFolder(absolutePath);
    }
  });

  ipcMain.handle("runtime:reveal-log-directory", async () => {
    shell.showItemInFolder(app.getPath("logs"));
  });

  ipcMain.handle(
    "desktop:copy-file-to-directory",
    async (_event, request: CopyFileToDirectoryRequest) => {
      const sourceFileName = basename(request.sourceFilePath);
      const targetFileName = request.targetFileName?.trim() || sourceFileName;

      await mkdir(request.targetDirectoryPath, { recursive: true });
      const destinationPath = await buildUniqueDestinationPath(request.targetDirectoryPath, targetFileName);
      await copyFile(request.sourceFilePath, destinationPath);

      return {
        destinationPath,
        fileName: basename(destinationPath),
        extension: extname(destinationPath)
      };
    }
  );
}

function createWindow(): void {
  const backendBaseUrl = process.env.VITE_BACKEND_BASE_URL?.trim() || "http://127.0.0.1:38124/api/v1";
  const logDirectoryPath = app.getPath("logs");
  const window = new BrowserWindow({
    width: 1460,
    height: 960,
    minWidth: 1180,
    minHeight: 760,
    title: "Avatar Publisher",
    backgroundColor: "#E4E9ED",
    autoHideMenuBar: true,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      contextIsolation: true,
      sandbox: false,
      additionalArguments: [
        "--abp-runtime-mode=desktop-dev",
        `--abp-backend-base-url=${backendBaseUrl}`,
        `--abp-log-dir=${logDirectoryPath}`
      ]
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void window.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  registerDesktopHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
