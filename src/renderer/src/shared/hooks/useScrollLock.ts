import { useEffect } from "react";

export function useScrollLock(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    const previousScrollbarGutter = root.style.scrollbarGutter;

    root.style.scrollbarGutter = "stable";
    root.style.overflow = "hidden";

    return () => {
      root.style.overflow = previousOverflow;
      root.style.scrollbarGutter = previousScrollbarGutter;
    };
  }, [enabled]);
}
