import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["publish", "accounts"]);
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
          <Users size={13} strokeWidth={1.75} /> {t("publish:steps.selectAllAvailable")}
        </motion.button>
        <span className="fg-muted" style={{ fontSize: 13 }}>{t("publish:steps.selectedCount", { count: selected.length })}</span>
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
                  {account.sessionValid ? t("publish:steps.accountConnected") : t("publish:steps.accountUnavailable")}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
