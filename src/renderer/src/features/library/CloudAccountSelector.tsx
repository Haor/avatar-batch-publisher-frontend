import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useAccounts } from "../../app/AccountsContext";
import { StatusDot } from "../../shared/components/StatusDot";

interface CloudAccountSelectorProps {
  selectedAccountId: string | null;
  onAccountChange: (accountId: string) => void;
}

export function CloudAccountSelector({
  selectedAccountId,
  onAccountChange,
}: CloudAccountSelectorProps) {
  const { accounts } = useAccounts();
  const validAccounts = accounts.filter((a) => a.sessionValid);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (validAccounts.length === 0) return null;

  const selected = validAccounts.find((a) => a.accountId === selectedAccountId) ?? validAccounts[0];

  return (
    <div className="cloud-selector" ref={ref}>
      <button className="cloud-selector-trigger" onClick={() => setOpen(!open)}>
        <div className="cloud-selector-avatar">
          {(selected.displayName?.[0] ?? selected.loginName[0] ?? "?").toUpperCase()}
        </div>
        <span className="cloud-selector-name">{selected.displayName || selected.loginName}</span>
        <ChevronDown size={13} strokeWidth={1.75} className={`cloud-selector-chevron ${open ? "cloud-selector-chevron--open" : ""}`} />
      </button>
      {open && (
        <div className="cloud-selector-dropdown">
          {validAccounts.map((a) => (
            <button
              key={a.accountId}
              className={`cloud-selector-option ${a.accountId === selected.accountId ? "cloud-selector-option--active" : ""}`}
              onClick={() => { onAccountChange(a.accountId); setOpen(false); }}
            >
              <div className="cloud-selector-option-avatar">
                {(a.displayName?.[0] ?? a.loginName[0] ?? "?").toUpperCase()}
              </div>
              <span className="cloud-selector-option-name">{a.displayName || a.loginName}</span>
              <StatusDot tone="ok" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
