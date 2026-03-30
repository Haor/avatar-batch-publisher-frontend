import { useState } from "react";
import { motion } from "motion/react";
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
        title: "选择 VRChat 会话文件",
        filters: [{ name: "所有文件", extensions: ["*"] }],
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
        导入账号会话
      </h2>

      {result ? (
        <div className="import-result">
          <p style={{ font: "400 14px var(--font)", color: "var(--fg-muted)", margin: "0 0 16px" }}>
            导入完成
          </p>
          <div className="import-result-stats">
            <div className="import-result-stat">
              <span className="import-result-number">{result.importedCount}</span>
              <span className="import-result-label">新导入</span>
            </div>
            <div className="import-result-stat">
              <span className="import-result-number">{result.updatedCount}</span>
              <span className="import-result-label">已更新</span>
            </div>
            <div className="import-result-stat">
              <span className="import-result-number">{result.skippedCount}</span>
              <span className="import-result-label">已跳过</span>
            </div>
          </div>
          <div className="login-form-actions" style={{ paddingTop: 16 }}>
            <motion.button
              className="btn btn-primary"
              onClick={handleClose}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
            >
              完成
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="login-form">
          {source.data && (
            <div className="import-source-path">
              <span className="fg-faint" style={{ fontSize: 12 }}>建议路径</span>
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
              {importMut.loading ? <Spinner size={14} /> : <><Download size={14} strokeWidth={1.75} /> 从默认路径导入</>}
            </motion.button>
            <motion.button
              className="btn btn-secondary btn-full"
              onClick={handlePickFile}
              disabled={importMut.loading}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
            >
              <FolderOpen size={14} strokeWidth={1.75} /> 选择文件
            </motion.button>
          </div>

          <div className="login-form-actions">
            <motion.button
              className="btn btn-secondary"
              onClick={handleClose}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
            >
              取消
            </motion.button>
          </div>
        </div>
      )}
    </Modal>
  );
}
