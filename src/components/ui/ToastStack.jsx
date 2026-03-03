import { AnimatePresence, motion } from "framer-motion";
import useNotifications from "../../hooks/useNotifications";

function ToastStack() {
  const { toasts, dismissToast } = useNotifications();

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.article
            key={toast.toastId}
            className={`toast-item toast-item--${toast.notification.type}`}
            initial={{ opacity: 0, y: 16, x: 24 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 8, x: 24 }}
            transition={{ duration: 0.24 }}
          >
            <div>
              <strong>{toast.notification.title}</strong>
              <p>{toast.notification.message}</p>
            </div>
            <button type="button" onClick={() => dismissToast(toast.toastId)}>
              Dismiss
            </button>
          </motion.article>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ToastStack;
