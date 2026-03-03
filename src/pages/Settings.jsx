import { useContext, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ThemeContext } from "../context/ThemeContext";

const SETTINGS_KEY = "appSettings";

const DEFAULT_SETTINGS = {
  notifications: {
    overdue: true,
    dueTomorrow: true,
    toast: true,
  },
  tasks: {
    defaultPriority: "medium",
  },
};

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    return {
      notifications: {
        overdue: saved?.notifications?.overdue ?? DEFAULT_SETTINGS.notifications.overdue,
        dueTomorrow: saved?.notifications?.dueTomorrow ?? DEFAULT_SETTINGS.notifications.dueTomorrow,
        toast: saved?.notifications?.toast ?? DEFAULT_SETTINGS.notifications.toast,
      },
      tasks: {
        defaultPriority: saved?.tasks?.defaultPriority || DEFAULT_SETTINGS.tasks.defaultPriority,
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function Settings() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [settings, setSettings] = useState(loadSettings());
  const [message, setMessage] = useState("");

  const themeLabel = useMemo(() => (theme === "dark" ? "Dark" : "Light"), [theme]);

  const saveSettings = (nextSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
    setMessage("Settings saved.");
    setTimeout(() => setMessage(""), 1500);
  };

  const handleNotificationToggle = (field) => {
    const nextSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [field]: !settings.notifications[field],
      },
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  const handlePriorityChange = (value) => {
    const nextSettings = {
      ...settings,
      tasks: {
        ...settings.tasks,
        defaultPriority: value,
      },
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  const setTheme = (targetTheme) => {
    if (theme !== targetTheme) toggleTheme();
  };

  const resetAll = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    setMessage("Settings reset to default.");
    setTimeout(() => setMessage(""), 1500);
  };

  return (
    <div className="settings-page">
      <motion.section
        className="settings-header glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2>Settings</h2>
          <p>Manage app behavior, notifications, and workspace defaults.</p>
        </div>
        <button type="button" className="btn-outline" onClick={resetAll}>
          Reset Default
        </button>
      </motion.section>

      <section className="settings-grid">
        <article className="glass-card settings-card">
          <h3>Appearance</h3>
          <p className="settings-note">Current theme: {themeLabel}</p>
          <div className="settings-row">
            <button
              type="button"
              className={theme === "light" ? "filter-btn filter-btn--active" : "filter-btn"}
              onClick={() => setTheme("light")}
            >
              Light
            </button>
            <button
              type="button"
              className={theme === "dark" ? "filter-btn filter-btn--active" : "filter-btn"}
              onClick={() => setTheme("dark")}
            >
              Dark
            </button>
          </div>
        </article>

        <article className="glass-card settings-card">
          <h3>Notifications</h3>
          <label className="settings-toggle">
            <span>Overdue alerts</span>
            <input
              type="checkbox"
              checked={settings.notifications.overdue}
              onChange={() => handleNotificationToggle("overdue")}
            />
          </label>
          <label className="settings-toggle">
            <span>Due tomorrow alerts</span>
            <input
              type="checkbox"
              checked={settings.notifications.dueTomorrow}
              onChange={() => handleNotificationToggle("dueTomorrow")}
            />
          </label>
          <label className="settings-toggle">
            <span>Toast popups</span>
            <input
              type="checkbox"
              checked={settings.notifications.toast}
              onChange={() => handleNotificationToggle("toast")}
            />
          </label>
        </article>

        <article className="glass-card settings-card">
          <h3>Task Defaults</h3>
          <p className="settings-note">Default priority for newly created tasks.</p>
          <select
            value={settings.tasks.defaultPriority}
            onChange={(e) => handlePriorityChange(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </article>

        <article className="glass-card settings-card">
          <h3>Validation</h3>
          <ul className="section-list">
            <li>Notification engine reads these toggles in real time.</li>
            <li>Task form uses selected default priority.</li>
            <li>Theme applies immediately across all pages.</li>
          </ul>
          {message && <p className="success-msg">{message}</p>}
        </article>
      </section>
    </div>
  );
}

export default Settings;
