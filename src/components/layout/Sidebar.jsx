import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function Sidebar() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      if (!mobile) {
        setOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setOpen(true)}>
        Menu
      </button>

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
              className="sidebar"
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
                  Dashboard
                </NavLink>
                <NavLink to="/tasks" className="sidebar-link" onClick={() => setOpen(false)}>
                  <span className="nav-icon" aria-hidden="true">T</span>
                  Tasks
                </NavLink>
                <NavLink to="/analytics" className="sidebar-link" onClick={() => setOpen(false)}>
                  <span className="nav-icon" aria-hidden="true">A</span>
                  Analytics
                </NavLink>
                <NavLink to="/settings" className="sidebar-link" onClick={() => setOpen(false)}>
                  <span className="nav-icon" aria-hidden="true">S</span>
                  Settings
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

