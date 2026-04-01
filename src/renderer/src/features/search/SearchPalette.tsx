import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Search, Home, Layers, Send, History, Users, Settings } from "lucide-react";
import { spring } from "../../shared/springs";
import { Modal } from "../../shared/components/Modal";
import { useAccounts } from "../../app/AccountsContext";
import { useNavigation } from "../../app/NavigationContext";
import type { PageKey } from "../../app/navigation";

interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
}

const pageIcons: Record<string, React.ReactNode> = {
  home: <Home size={14} strokeWidth={1.75} />,
  library: <Layers size={14} strokeWidth={1.75} />,
  publish: <Send size={14} strokeWidth={1.75} />,
  history: <History size={14} strokeWidth={1.75} />,
  accounts: <Users size={14} strokeWidth={1.75} />,
  settings: <Settings size={14} strokeWidth={1.75} />,
};

const pages: PageKey[] = ["home", "library", "publish", "history", "accounts", "settings"];

export function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const { t } = useTranslation(["navigation", "search"]);
  const { navigate } = useNavigation();
  const { accounts } = useAccounts();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.toLowerCase();
    const items: SearchResult[] = [];

    for (const page of pages) {
      const label = t(`navigation:${page}`);

      if (!q || label.toLowerCase().includes(q) || page.includes(q)) {
        items.push({
          id: `page-${page}`,
          label,
          category: t("search:categories.page"),
          icon: pageIcons[page],
          action: () => { navigate(page); onClose(); },
        });
      }
    }

    for (const account of accounts) {
      const name = account.displayName || account.loginName;
      if (!q || name.toLowerCase().includes(q)) {
        items.push({
          id: `account-${account.accountId}`,
          label: name,
          category: t("search:categories.account"),
          icon: <Users size={14} strokeWidth={1.75} />,
          action: () => { navigate("accounts"); onClose(); },
        });
      }
    }

    return items.slice(0, 12);
  }, [query, accounts, navigate, onClose, t]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      results[activeIndex].action();
    }
  }

  return (
    <Modal open={open} onClose={onClose} width={520}>
      <div className="search-palette">
        <div className="search-palette-input-wrap">
          <Search size={16} strokeWidth={1.75} className="fg-faint" />
          <input
            ref={inputRef}
            className="search-palette-input"
            placeholder={t("search:placeholder")}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            onKeyDown={handleKeyDown}
          />
        </div>
        {results.length > 0 && (
          <motion.div
            className="search-palette-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={spring.gentle}
          >
            {results.map((r, i) => (
              <button
                key={r.id}
                className="search-palette-item"
                data-active={i === activeIndex || undefined}
                onClick={r.action}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {r.icon}
                <span className="search-palette-item-label">{r.label}</span>
                <span className="search-palette-item-category">{r.category}</span>
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </Modal>
  );
}
