import { useEffect, useState } from "react";
import { isDesktopBridgeAvailable, readFileAsDataUrl } from "../../lib/desktop";

/**
 * 将本地文件路径转为 data URL 用于 <img src>。
 * 接受绝对路径或 file:// URL，返回 data URL 或 null。
 */
export function useLocalImage(pathOrUrl: string | null | undefined): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pathOrUrl) { setDataUrl(null); return; }

    // 云端 URL 直接返回
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
      setDataUrl(pathOrUrl);
      return;
    }

    // 非桌面环境无法读取本地文件
    if (!isDesktopBridgeAvailable()) {
      setDataUrl(null);
      return;
    }

    // 提取本地路径 (去掉 file:// 前缀)
    const localPath = pathOrUrl.startsWith("file://")
      ? pathOrUrl.slice(7)
      : pathOrUrl;

    let active = true;
    readFileAsDataUrl(localPath)
      .then((url) => { if (active) setDataUrl(url); })
      .catch(() => { if (active) setDataUrl(null); });
    return () => { active = false; };
  }, [pathOrUrl]);

  return dataUrl;
}
