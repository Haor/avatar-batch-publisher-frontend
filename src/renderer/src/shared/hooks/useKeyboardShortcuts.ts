import { useEffect } from "react";
import type { PageKey } from "../../app/navigation";

export function useKeyboardShortcuts(
  navigate: (page: PageKey) => void,
  onSearch: () => void,
) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;

      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        if (e.key !== "k") return;
      }

      switch (e.key) {
        case "n":
          e.preventDefault();
          navigate("publish");
          break;
        case "i":
          e.preventDefault();
          navigate("library");
          break;
        case "k":
          e.preventDefault();
          onSearch();
          break;
        case "1":
          e.preventDefault();
          navigate("home");
          break;
        case "2":
          e.preventDefault();
          navigate("library");
          break;
        case "3":
          e.preventDefault();
          navigate("publish");
          break;
        case "4":
          e.preventDefault();
          navigate("accounts");
          break;
        case "5":
          e.preventDefault();
          navigate("history");
          break;
        case "6":
          e.preventDefault();
          navigate("settings");
          break;
      }
    }

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [navigate, onSearch]);
}
