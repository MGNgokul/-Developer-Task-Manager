import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

function QuickActions() {
  const [open, setOpen] = useState(false);

  return (
    <div className="quick-actions">
      <button
        type="button"
        className="quick-actions-toggle"
        aria-expanded={open}
        aria-label="Open quick actions"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? "x" : "+"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="quick-actions-menu"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.22 }}
          >
            <Link to="/tasks/form" onClick={() => setOpen(false)}>New Task</Link>
            <Link to="/tasks/kanban" onClick={() => setOpen(false)}>Kanban</Link>
            <Link to="/analytics" onClick={() => setOpen(false)}>Analytics</Link>
            <Link to="/calendar" onClick={() => setOpen(false)}>Calendar</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default QuickActions;
