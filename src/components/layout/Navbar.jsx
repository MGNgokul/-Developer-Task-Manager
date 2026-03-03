import { useContext } from "react";
import { motion } from "framer-motion";
import { ThemeContext } from "../../context/ThemeContext";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

function Navbar() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const { pathname } = useLocation();
  const isLanding = pathname === "/";
  const isTasksRoute = pathname.startsWith("/tasks/");

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="navbar"
    >
      <Link to="/" className="brand-logo" aria-label="DevTask Home">
        <span className="brand-glyph" aria-hidden="true">
          <span className="brand-orbit"></span>
          <span className="brand-core"></span>
          <span className="brand-spark"></span>
        </span>
        <span className="brand-text">DevTask</span>
      </Link>

      <div className="nav-actions">
        {isLanding && (
          <>
            <Link to="/">Home</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
        {!isLanding && !user && <Link to="/">Home</Link>}
        {!isLanding && !user && <Link to="/login">Login</Link>}
        {!isLanding && !user && <Link to="/register">Register</Link>}
        {!isLanding && user && !isTasksRoute && <Link to="/dashboard">Tasks</Link>}
        {!isLanding && user && !isTasksRoute && <Link to="/analytics">Analytics</Link>}
        {!isLanding && user && !isTasksRoute && <Link to="/profile">Profile</Link>}
        {!isLanding && user && isTasksRoute && <Link to="/tasks/form">Task Form</Link>}
        {!isLanding && user && isTasksRoute && <Link to="/tasks/filter">Task Filter</Link>}
        {!isLanding && user && isTasksRoute && <Link to="/tasks/kanban">Kanban Board</Link>}
        {!isLanding && user && isTasksRoute && <Link to="/tasks/cards">Task Cards</Link>}

        <button
          className={`theme-toggle ${theme === "light" ? "theme-toggle--light" : "theme-toggle--dark"}`}
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? "\uD83C\uDF19" : "\u2600\uFE0F"}
        </button>
      </div>
    </motion.nav>
  );
}

export default Navbar;


