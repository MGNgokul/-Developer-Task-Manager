import { useContext } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ThemeContext } from "../../context/ThemeContext";
import { AuthContext } from "../../context/AuthContext";
import useNotifications from "../../hooks/useNotifications";

function Header() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const { unreadCount } = useNotifications();
  const { pathname } = useLocation();
  const isTasksRoute = pathname.startsWith("/tasks");
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const profileInitial = (user?.name || user?.email || "U").trim().charAt(0).toUpperCase();

  const navClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="navbar"
    >
      <NavLink to="/" className="brand-logo" aria-label="DevTask Home">
        <span className="brand-glyph" aria-hidden="true">
          <span className="brand-orbit"></span>
          <span className="brand-core"></span>
          <span className="brand-spark"></span>
        </span>
        <span className="brand-text">DevTask</span>
      </NavLink>

      <div className="nav-actions">
        {!user && !isAuthRoute && (
          <NavLink to="/login" className={navClass}>
            <span className="nav-icon" aria-hidden="true">{">"}</span>
            Login
          </NavLink>
        )}
        {!user && !isAuthRoute && (
          <NavLink to="/register" className={navClass}>
            <span className="nav-icon" aria-hidden="true">+</span>
            Register
          </NavLink>
        )}

        {user && !isTasksRoute && (
          <NavLink to="/notifications" className={navClass}>
            <span className="nav-icon" aria-hidden="true">{"\uD83D\uDD14"}</span>
            Alerts
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </NavLink>
        )}

        {user && !isTasksRoute && (
          <NavLink to="/profile" className={navClass}>
            <span className="nav-icon nav-icon-profile" aria-hidden="true">{profileInitial}</span>
            Profile
          </NavLink>
        )}

        {user && isTasksRoute && (
          <NavLink to="/tasks?section=task-form" className={navClass}>
            <span className="nav-icon" aria-hidden="true">F</span>
            Task Form
          </NavLink>
        )}
        {user && isTasksRoute && (
          <NavLink to="/tasks?section=task-filter" className={navClass}>
            <span className="nav-icon" aria-hidden="true">L</span>
            Task Filter
          </NavLink>
        )}
        {user && isTasksRoute && (
          <NavLink to="/tasks?section=kanban-board" className={navClass}>
            <span className="nav-icon" aria-hidden="true">K</span>
            Kanban Board
          </NavLink>
        )}
        {user && isTasksRoute && (
          <NavLink to="/tasks?section=task-cards" className={navClass}>
            <span className="nav-icon" aria-hidden="true">C</span>
            Task Cards
          </NavLink>
        )}

        <button
          className={`theme-toggle ${theme === "light" ? "theme-toggle--light" : "theme-toggle--dark"}`}
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? "\uD83C\uDF19" : "\u2600\uFE0F"}
        </button>
      </div>
    </motion.header>
  );
}

export default Header;


