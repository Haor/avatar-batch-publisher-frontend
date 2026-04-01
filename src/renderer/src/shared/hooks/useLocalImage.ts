import { useEffect, useState } from "react";
import { isDesktopBridgeAvailable, readFileAsDataUrl } from "../../lib/desktop";

const IMAGE_CACHE_LIMIT = 200;
const localImageCache = new Map<string, string>();

function cacheLocalImage(key: string, dataUrl: string): void {
  if (localImageCache.size >= IMAGE_CACHE_LIMIT) {
    const oldest = localImageCache.keys().next().value;
    if (oldest) localImageCache.delete(oldest);
  }
  localImageCache.set(key, dataUrl);
}

function isRemoteUrl(path: string): boolean {
  return path.startsWith("http://") || path.startsWith("https://");
}

function stripFileProtocol(path: string): string {
  return path.startsWith("file://") ? path.slice(7) : path;
}

/**
 * 将本地文件路径转为 data URL 用于 <img src>。
 * 接受绝对路径或 file:// URL，返回 data URL 或 null。
 * 本地文件结果会被模块级缓存，避免重复读盘。
 */
export function useLocalImage(pathOrUrl: string | null | undefined): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(() => {
    if (!pathOrUrl) return null;
    if (isRemoteUrl(pathOrUrl)) return pathOrUrl;
    return localImageCache.get(stripFileProtocol(pathOrUrl)) ?? null;
  });

  useEffect(() => {
    if (!pathOrUrl) { setDataUrl(null); return; }
    if (isRemoteUrl(pathOrUrl)) { setDataUrl(pathOrUrl); return; }
    if (!isDesktopBridgeAvailable()) { setDataUrl(null); return; }

    const localPath = stripFileProtocol(pathOrUrl);
    const cached = localImageCache.get(localPath);
    if (cached) {
      setDataUrl(cached);
      return;
    }

    let active = true;
    readFileAsDataUrl(localPath)
      .then((url) => {
        cacheLocalImage(localPath, url);
        if (active) setDataUrl(url);
      })
      .catch(() => { if (active) setDataUrl(null); });
    return () => { active = false; };
  }, [pathOrUrl]);

  return dataUrl;
}
