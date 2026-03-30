import { useState } from "react";
import { motion } from "motion/react";
import { Users, LogIn, Download } from "lucide-react";
import { spring, makeStagger, fadeIn } from "../../shared/springs";
import { useApi } from "../../app/ApiContext";
import { useAccounts } from "../../app/AccountsContext";
import { Spinner } from "../../shared/components/Spinner";
import { EmptyState } from "../../shared/components/EmptyState";
import { ErrorBanner } from "../../shared/components/ErrorBanner";
import { AccountListItem } from "./AccountListItem";
import { LoginModal } from "./LoginModal";
import { ImportModal } from "./ImportModal";

const listStagger = makeStagger();

export function AccountsPage() {
  const api = useApi();
  const { accounts, loading, error, refetch } = useAccounts();
  const [modal, setModal] = useState<"login" | "import" | null>(null);

  async function handleRefresh(id: string) {
    try {
      await api.accounts.refresh(id);
      refetch();
    } catch { /* swallow — UI will reflect stale state */ }
  }

  async function handleSetDefault(id: string) {
    try {
      await api.accounts.setDefault(id);
      refetch();
    } catch { /* swallow */ }
  }

  async function handleRepair(id: string) {
    try {
      await api.accounts.repair(id);
      refetch();
    } catch { /* swallow */ }
  }

  async function handleLogout(id: string) {
    try {
      await api.accounts.logout(id);
      refetch();
    } catch { /* swallow */ }
  }

  async function handleRemove(id: string) {
    try {
      await api.accounts.remove(id);
      refetch();
    } catch { /* swallow */ }
  }

  return (
    <div className="accounts-page">
      <motion.div
        className="accounts-page-header"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
      >
        <h1>账号</h1>
        <div className="accounts-page-actions">
          <motion.button
            className="btn btn-primary"
            onClick={() => setModal("login")}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
          >
            <LogIn size={14} strokeWidth={1.75} /> 登录
          </motion.button>
          <motion.button
            className="btn btn-secondary"
            onClick={() => setModal("import")}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
          >
            <Download size={14} strokeWidth={1.75} /> 导入
          </motion.button>
        </div>
      </motion.div>

      {loading && accounts.length === 0 ? (
        <div className="accounts-loading"><Spinner size={24} /></div>
      ) : error && accounts.length === 0 ? (
        <ErrorBanner error={error} onRetry={refetch} />
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={<Users size={32} strokeWidth={1.5} />}
          message="添加 VRChat 账号"
          action={{ label: "登录", onClick: () => setModal("login") }}
        />
      ) : (
        <motion.div
          className="account-list"
          variants={listStagger}
          initial="hidden"
          animate="show"
        >
          {accounts.map((account) => (
            <motion.div key={account.accountId} variants={fadeIn}>
              <AccountListItem
                account={account}
                onRefresh={handleRefresh}
                onSetDefault={handleSetDefault}
                onRepair={handleRepair}
                onLogout={handleLogout}
                onRemove={handleRemove}
                onRelogin={() => setModal("login")}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <LoginModal
        open={modal === "login"}
        onClose={() => setModal(null)}
        onSuccess={refetch}
      />
      <ImportModal
        open={modal === "import"}
        onClose={() => setModal(null)}
        onSuccess={refetch}
      />
    </div>
  );
}
