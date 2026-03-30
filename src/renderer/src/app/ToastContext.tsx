import { createContext, useCallback, useContext, useEffect, useReducer, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { spring } from "../shared/springs";

interface Toast {
  id: string;
  title: string;
  detail?: string;
  tone: "ok" | "warn" | "err" | "neutral";
}

interface ToastContextValue {
  toast: (input: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

type Action =
  | { type: "add"; toast: Toast }
  | { type: "remove"; id: string };

function reducer(state: Toast[], action: Action): Toast[] {
  switch (action.type) {
    case "add":
      return [...state.slice(-2), action.toast];
    case "remove":
      return state.filter((t) => t.id !== action.id);
  }
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  const toast = useCallback((input: Omit<Toast, "id">) => {
    const id = String(++nextId);
    dispatch({ type: "add", toast: { ...input, id } });
    const timer = setTimeout(() => {
      dispatch({ type: "remove", id });
      timersRef.current.delete(id);
    }, 3000);
    timersRef.current.set(id, timer);
  }, []);

  return (
    <ToastContext value={{ toast }}>
      {children}
      {createPortal(
        <div className="toast-stack">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                className={`toast toast--${t.tone}`}
                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={spring.smooth}
                layout
              >
                <div className="toast-content">
                  <span className="toast-title">{t.title}</span>
                  {t.detail && <span className="toast-detail">{t.detail}</span>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
