import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function Sidebar() {
  const getViewport = () => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const isTablet = window.matchMedia("(min-width: 769px) and (max-width: 1024px)").matches;
    return { isMobile, isTablet };
  };

  const [viewport, setViewport] = useState(getViewport);
  const [open, setOpen] = useState(false);
  const { isMobile, isTablet } = viewport;

  useEffect(() => {
    const onResize = () => {
      const next = getViewport();
      setViewport(next);
      if (!next.isMobile) {
        setOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    onResize();

    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      {isMobile && (
        <button
          type="button"
          className="mobile-menu-btn"
          aria-label="Open sidebar menu"
          onClick={() => setOpen(true)}
        >
          ☰
        </button>
      )}

      <AnimatePresence>
        {(open || !isMobile) && (
          <>
            {isMobile && open && (
              <motion.button
                type="button"
                aria-label="Close sidebar"
                className="sidebar-overlay"
                onClick={() => setOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}

            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3 }}
              className={`sidebar ${isTablet ? "sidebar--collapsed" : ""}`.trim()}
            >
              <div className="sidebar-header">
                <h3>Workspace</h3>
                {isMobile && (
                  <button className="close-btn" onClick={() => setOpen(false)}>
                    Close
                  </button>
                )}
              </div>

              <nav>
                <NavLink to="/dashboard" className="sidebar-link" onClick={() => setOpen(false)}>
                  <span className="nav-icon" aria-hidden="true">D</span>
                  <span className="sidebar-label">Dashboard</span>
                </NavLink>
                <NavLink to="/tasks" className="sidebar-link" onClick={() => setOpen(false)}>
                  <span className="nav-icon" aria-hidden="true">T</span>
                  <span className="sidebar-label">Tasks</span>
                </NavLink>
                <NavLink to="/analytics" className="sidebar-link" onClick={() => setOpen(false)}>
                  <span className="nav-icon" aria-hidden="true">A</span>
                  <span className="sidebar-label">Analytics</span>
                </NavLink>
                <NavLink to="/settings" className="sidebar-link" onClick={() => setOpen(false)}>
                  <span className="nav-icon" aria-hidden="true">S</span>
                  <span className="sidebar-label">Settings</span>
                </NavLink>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;

