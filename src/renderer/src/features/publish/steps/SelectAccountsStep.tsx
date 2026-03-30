import { motion } from "motion/react";
import { Users } from "lucide-react";
import { spring, makeStagger, fadeIn } from "../../../shared/springs";
import { useAccounts } from "../../../app/AccountsContext";
import { StatusDot } from "../../../shared/components/StatusDot";

interface SelectAccountsStepProps {
  selected: string[];
  onSelectionChange: (ids: string[]) => void;
}

const listStagger = makeStagger();

export function SelectAccountsStep({ selected, onSelectionChange }: SelectAccountsStepProps) {
  const { accounts } = useAccounts();

  function toggle(id: string) {
    if (selected.includes(id)) {
      onSelectionChange(selected.filter((s) => s !== id));
    } else {
      onSelectionChange([...selected, id]);
    }
  }

  function selectAll() {
    const publishable = accounts
      .filter((a) => a.canPublishAvatars && a.sessionValid)
      .map((a) => a.accountId);
    onSelectionChange(publishable);
  }

  return (
    <div className="select-accounts-step">
      <div className="select-accounts-header">
        <motion.button
          className="btn btn-ghost"
          onClick={selectAll}
          whileTap={{ scale: 0.97 }}
          transition={spring.snappy}
        >
          <Users size={13} strokeWidth={1.75} /> 全选可用
        </motion.button>
        <span className="fg-muted" style={{ fontSize: 13 }}>已选 {selected.length} 个</span>
      </div>
      <motion.div
        className="account-select-list"
        variants={listStagger}
        initial="hidden"
        animate="show"
      >
        {accounts.map((account) => {
          const canUse = account.canPublishAvatars && account.sessionValid;
          const isSelected = selected.includes(account.accountId);
          return (
            <motion.div
              key={account.accountId}
              className={`card card-interactive account-select-card ${isSelected ? "card-active" : ""} ${!canUse ? "account-select-card--disabled" : ""}`}
              variants={fadeIn}
              onClick={() => canUse && toggle(account.accountId)}
              data-selected={isSelected || undefined}
            >
              <div className="account-select-check">
                {isSelected && <span className="account-select-checkmark" />}
              </div>
              <div className="account-select-info">
                <span className="account-select-name">{account.displayName || account.loginName}</span>
                <span className="account-select-sub">
                  <StatusDot tone={account.sessionValid ? "ok" : "warn"} />
                  {account.sessionValid ? "已连接" : "不可用"}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
