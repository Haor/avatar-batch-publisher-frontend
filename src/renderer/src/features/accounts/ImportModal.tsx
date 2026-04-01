import { useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { FolderOpen, Download } from "lucide-react";
import { spring } from "../../shared/springs";
import { Modal } from "../../shared/components/Modal";
import { Spinner } from "../../shared/components/Spinner";
import { ErrorBanner } from "../../shared/components/ErrorBanner";
import { useApi } from "../../app/ApiContext";
import { useQuery } from "../../shared/hooks/useQuery";
import { useMutation } from "../../shared/hooks/useMutation";
import { pickSingleFile } from "../../lib/desktop";
import type { AccountImportResult } from "../../contracts/accounts";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportModal({ open, onClose, onSuccess }: ImportModalProps) {
  const { t } = useTranslation(["accounts", "common"]);
  const api = useApi();
  const [result, setResult] = useState<AccountImportResult | null>(null);

  const source = useQuery(
    (signal) => {
      if (!open) return Promise.resolve(null);
      return api.accounts.getImportSource(signal);
    },
    [open],
  );

  const importMut = useMutation(
    (input: { sourceFilePath: string | null }) =>
      api.accounts.importSessions(input),
  );

  async function handleImport(filePath: string | null) {
    try {
      const res = await importMut.execute({ sourceFilePath: filePath });
      setResult(res);
      onSuccess();
    } catch { /* error shown via importMut.error */ }
  }

  async function handlePickFile() {
    try {
      const path = await pickSingleFile({
        title: t("accounts:importModal.chooseSessionFile"),
        filters: [{ name: t("accounts:importModal.allFiles"), extensions: ["*"] }],
      });
      if (path) await handleImport(path);
    } catch { /* ignore desktop bridge errors in browser */ }
  }

  function handleClose() {
    setResult(null);
    importMut.reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} width={420}>
      <h2 style={{ font: "600 16px var(--font)", color: "var(--fg)", margin: "0 0 20px" }}>
        {t("accounts:importModal.title")}
      </h2>

      {result ? (
        <div className="import-result">
          <p style={{ font: "400 14px var(--font)", color: "var(--fg-muted)", margin: "0 0 16px" }}>
            {t("accounts:importModal.importDone")}
          </p>
          <div className="import-result-stats">
            <div className="import-result-stat">
              <span className="import-result-number">{result.importedCount}</span>
              <span className="import-result-label">{t("accounts:importModal.imported")}</span>
            </div>
            <div className="import-result-stat">
              <span className="import-result-number">{result.updatedCount}</span>
              <span className="import-result-label">{t("accounts:importModal.updated")}</span>
            </div>
            <div className="import-result-stat">
              <span className="import-result-number">{result.skippedCount}</span>
              <span className="import-result-label">{t("accounts:importModal.skipped")}</span>
            </div>
          </div>
          <div className="login-form-actions" style={{ paddingTop: 16 }}>
            <motion.button
              className="btn btn-primary"
              onClick={handleClose}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
            >
              {t("accounts:importModal.done")}
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="login-form">
          {source.data && (
            <div className="import-source-path">
              <span className="fg-faint" style={{ fontSize: 12 }}>{t("accounts:importModal.suggestedPath")}</span>
              <code className="import-path-text">{source.data.suggestedSourcePath}</code>
            </div>
          )}

          {importMut.error && <ErrorBanner error={importMut.error} />}

          <div className="import-actions">
            <motion.button
              className="btn btn-primary btn-full"
              onClick={() => handleImport(null)}
              disabled={importMut.loading}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
            >
              {importMut.loading ? <Spinner size={14} /> : <><Download size={14} strokeWidth={1.75} /> {t("accounts:importModal.importDefault")}</>}
            </motion.button>
            <motion.button
              className="btn btn-secondary btn-full"
              onClick={handlePickFile}
              disabled={importMut.loading}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
            >
              <FolderOpen size={14} strokeWidth={1.75} /> {t("accounts:importModal.chooseFile")}
            </motion.button>
          </div>

          <div className="login-form-actions">
            <motion.button
              className="btn btn-secondary"
              onClick={handleClose}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
            >
              {t("common:cancel")}
            </motion.button>
          </div>
        </div>
      )}
    </Modal>
  );
}
