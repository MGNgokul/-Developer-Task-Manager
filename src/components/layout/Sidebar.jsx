import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function Sidebar() {
  const getViewport = () => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const isTablet = window.matchMedia("(min-width: 769px) and (max-width: 1024px)").matches;
    return { isMobile, isTablet };
  };

  const [viewport, setViewport] = useState(getViewport);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
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

  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [pathname, isMobile]);

  useEffect(() => {
    if (!isMobile) return undefined;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, isMobile]);

  return (
    <>
      {isMobile && (
        <button
          type="button"
          className="mobile-menu-btn"
          aria-label="Open sidebar menu"
          aria-expanded={open}
          aria-controls="workspace-sidebar"
          onClick={() => setOpen(true)}
        >
          {"\u2630"}
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
              id="workspace-sidebar"
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
                <NavLink to="/calendar" className="sidebar-link" onClick={() => setOpen(false)}>
                  <span className="nav-icon" aria-hidden="true">C</span>
                  <span className="sidebar-label">Calendar</span>
                </NavLink>
                <NavLink to="/team" className="sidebar-link" onClick={() => setOpen(false)}>
                  <span className="nav-icon" aria-hidden="true">M</span>
                  <span className="sidebar-label">Team</span>
                </NavLink>
                <NavLink to="/goals" className="sidebar-link" onClick={() => setOpen(false)}>
                  <span className="nav-icon" aria-hidden="true">G</span>
                  <span className="sidebar-label">Goals</span>
                </NavLink>
                <NavLink to="/automation" className="sidebar-link" onClick={() => setOpen(false)}>
                  <span className="nav-icon" aria-hidden="true">R</span>
                  <span className="sidebar-label">Automation</span>
                </NavLink>
               
                <NavLink to="/risk-register" className="sidebar-link" onClick={() => setOpen(false)}>
                  <span className="nav-icon" aria-hidden="true">X</span>
                  <span className="sidebar-label">Risk Register</span>
                </NavLink>
                <NavLink to="/client-portal" className="sidebar-link" onClick={() => setOpen(false)}>
                  <span className="nav-icon" aria-hidden="true">P</span>
                  <span className="sidebar-label">Client Portal</span>
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
