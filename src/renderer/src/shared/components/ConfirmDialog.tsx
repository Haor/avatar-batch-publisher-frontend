import { motion } from "motion/react";
import { spring } from "../springs";
import { Modal } from "./Modal";
import { Spinner } from "./Spinner";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "brand" | "err";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "确认",
  cancelLabel = "取消",
  tone = "brand",
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} width={380}>
      <div className="confirm-dialog">
        <h2 className="confirm-dialog-title">{title}</h2>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <motion.button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
          >
            {cancelLabel}
          </motion.button>
          <motion.button
            className={`btn ${tone === "err" ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
          >
            {loading ? <Spinner size={14} /> : confirmLabel}
          </motion.button>
        </div>
      </div>
    </Modal>
  );
}
