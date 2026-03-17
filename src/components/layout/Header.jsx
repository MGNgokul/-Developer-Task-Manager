import { useContext, useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ThemeContext } from "../../context/ThemeContext";
import { AuthContext } from "../../context/AuthContext";
import useNotifications from "../../hooks/useNotifications";

function Header() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const searchRef = useRef(null);
  const [quickQuery, setQuickQuery] = useState("");
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const profileInitial = (user?.name || user?.email || "U").trim().charAt(0).toUpperCase();

  const navClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

  useEffect(() => {
    const onShortcut = (event) => {
      if (!user) return;
      const isSlash = event.key === "/";
      if (!isSlash) return;

      const tag = event.target?.tagName?.toLowerCase();
      const isTypingField =
        tag === "input" || tag === "textarea" || event.target?.isContentEditable;
      if (isTypingField) return;

      event.preventDefault();
      searchRef.current?.focus();
    };

    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [user]);

  const handleQuickSearch = (event) => {
    event.preventDefault();
    const query = quickQuery.trim();
    navigate(query ? `/tasks/filter?q=${encodeURIComponent(query)}` : "/tasks/filter");
  };

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
        {user && (
          <form className="nav-search" onSubmit={handleQuickSearch}>
            <input
              ref={searchRef}
              type="search"
              value={quickQuery}
              onChange={(event) => setQuickQuery(event.target.value)}
              placeholder="Search tasks... (/)"
              aria-label="Quick search tasks"
            />
          </form>
        )}

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

        {user && (
          <NavLink to="/calendar" className={navClass}>
            <span className="nav-icon" aria-hidden="true">C</span>
            Calendar
          </NavLink>
        )}

        {user && (
          <NavLink to="/notifications" className={navClass}>
            <span className="nav-icon" aria-hidden="true">{"\uD83D\uDD14"}</span>
            Alerts
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </NavLink>
        )}

        {user && (
          <NavLink to="/profile" className={navClass}>
            <span className="nav-icon nav-icon-profile" aria-hidden="true">{profileInitial}</span>
            Profile
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


