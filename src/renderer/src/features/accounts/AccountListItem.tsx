import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { RefreshCw, Star, Wrench, LogOut, Trash2, MoreHorizontal, KeyRound } from "lucide-react";
import { spring } from "../../shared/springs";
import { StatusDot } from "../../shared/components/StatusDot";
import { Badge } from "../../shared/components/Badge";
import { ConfirmDialog } from "../../shared/components/ConfirmDialog";
import { Spinner } from "../../shared/components/Spinner";
import type { AccountSummary } from "../../contracts/accounts";

interface AccountListItemProps {
  account: AccountSummary;
  onRefresh: (id: string) => Promise<void>;
  onSetDefault: (id: string) => Promise<void>;
  onRepair: (id: string) => Promise<void>;
  onLogout: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onRelogin: (id: string) => void;
}

function sessionTone(account: AccountSummary): "ok" | "warn" | null {
  if (account.sessionValid) return "ok";
  if (account.needsReauthentication || account.sessionState === "PendingTwoFactor") return "warn";
  if (account.sessionState === "LoggedOut") return null;
  return "warn";
}

function sessionLabel(account: AccountSummary): string {
  if (account.sessionValid) return "已连接";
  if (account.sessionState === "PendingTwoFactor") return "等待验证";
  if (account.needsReauthentication) return "需重连";
  if (account.sessionState === "LoggedOut") return "已登出";
  return account.sessionIssue ?? "异常";
}

export function AccountListItem({
  account,
  onRefresh,
  onSetDefault,
  onRepair,
  onLogout,
  onRemove,
  onRelogin,
}: AccountListItemProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"logout" | "remove" | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const tone = sessionTone(account);
  const needsWarn = account.needsReauthentication && !account.sessionValid;

  const openMenu = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.right });
    }
    setShowMore(true);
  }, []);

  useEffect(() => {
    if (!showMore) return;
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setShowMore(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMore]);

  async function handleAction(key: string, action: () => Promise<void>) {
    setLoading(key);
    setShowMore(false);
    try { await action(); }
    finally { setLoading(null); }
  }

  return (
    <>
      <motion.div
        className={`card account-list-item ${needsWarn ? "account-list-item--warn" : ""}`}
        layout
      >
        <div className="account-avatar-circle">
          {account.displayName?.[0]?.toUpperCase() ?? account.loginName[0]?.toUpperCase() ?? "?"}
        </div>

        <div className="account-info">
          <span className="account-display-name">
            {account.displayName || account.loginName}
            {account.isDefault && <Star size={11} strokeWidth={2} className="account-default-star" />}
          </span>
          <span className="account-login-name">{account.loginName}</span>
        </div>

        <div className="account-status">
          {tone && <StatusDot tone={tone} animate />}
          <span className={`account-status-text ${!account.sessionValid ? "fg-faint" : ""}`}>
            {sessionLabel(account)}
          </span>
        </div>

        {account.canPublishAvatars && account.sessionValid && (
          <Badge tone="brand">可发布</Badge>
        )}

        <div className="account-actions">
          <motion.button
            className="btn btn-ghost btn-icon"
            title="刷新"
            disabled={loading !== null}
            onClick={() => handleAction("refresh", () => onRefresh(account.accountId))}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
          >
            {loading === "refresh" ? <Spinner size={14} /> : <RefreshCw size={14} strokeWidth={1.75} />}
          </motion.button>

          <motion.button
            ref={triggerRef}
            className="btn btn-ghost btn-icon"
            onClick={() => showMore ? setShowMore(false) : openMenu()}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
          >
            <MoreHorizontal size={14} strokeWidth={1.75} />
          </motion.button>
        </div>
      </motion.div>

      {/* Portal 菜单 — 脱离卡片 stacking context */}
      {showMore && createPortal(
        <div
          ref={menuRef}
          className="account-more-menu"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          {!account.isDefault && (
            <button
              className="account-more-item"
              onClick={() => handleAction("default", () => onSetDefault(account.accountId))}
            >
              <Star size={13} strokeWidth={1.75} /> 设为默认
            </button>
          )}
          {account.supportsAutoRepair && (
            <button
              className="account-more-item"
              onClick={() => handleAction("repair", () => onRepair(account.accountId))}
            >
              <Wrench size={13} strokeWidth={1.75} /> 修复
            </button>
          )}
          {account.needsReauthentication && (
            <button
              className="account-more-item"
              onClick={() => { setShowMore(false); onRelogin(account.accountId); }}
            >
              <KeyRound size={13} strokeWidth={1.75} /> 重新登录
            </button>
          )}
          <div className="account-more-divider" />
          <button
            className="account-more-item"
            onClick={() => { setShowMore(false); setConfirm("logout"); }}
          >
            <LogOut size={13} strokeWidth={1.75} /> 登出
          </button>
          <button
            className="account-more-item account-more-item--danger"
            onClick={() => { setShowMore(false); setConfirm("remove"); }}
          >
            <Trash2 size={13} strokeWidth={1.75} /> 删除
          </button>
        </div>,
        document.body,
      )}

      <ConfirmDialog
        open={confirm === "logout"}
        title="登出账号"
        message={`确定要登出 ${account.displayName || account.loginName} 吗？`}
        onConfirm={() => { setConfirm(null); handleAction("logout", () => onLogout(account.accountId)); }}
        onCancel={() => setConfirm(null)}
        loading={loading === "logout"}
      />

      <ConfirmDialog
        open={confirm === "remove"}
        title="删除账号"
        message={`确定要删除 ${account.displayName || account.loginName} 吗？此操作不可撤销。`}
        tone="err"
        confirmLabel="删除"
        onConfirm={() => { setConfirm(null); handleAction("remove", () => onRemove(account.accountId)); }}
        onCancel={() => setConfirm(null)}
        loading={loading === "remove"}
      />
    </>
  );
}
