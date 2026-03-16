import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ThemeContext } from "../context/ThemeContext";
import { TaskContext } from "../context/TaskContext";
import useAuth from "../hooks/useAuth";
import useNotifications from "../hooks/useNotifications";
import usePwaInstall from "../hooks/usePwaInstall";
import { buildSummaryReport, downloadTextFile, tasksToCsv } from "../utils/exportCenter";
import {
  ensureWorkspaceSeed,
  getRoleOptions,
  saveWorkspaceMembers,
} from "../utils/workspace";

const SETTINGS_KEY = "appSettings";

const DEFAULT_SETTINGS = {
  notifications: {
    overdue: true,
    dueSoon: true,
    slaBreach: true,
    escalation: true,
    toast: true,
    browser: false,
    leadDays: 1,
    quietHoursEnabled: false,
    quietStartHour: 22,
    quietEndHour: 8,
    muteWeekends: false,
    webhookEnabled: false,
    webhookUrl: "",
  },
  tasks: {
    defaultPriority: "medium",
    holidayDates: [],
  },
  goals: {
    weeklyCompletedTarget: 8,
  },
  backup: {
    enabled: false,
    frequencyHours: 24,
  },
  security: {
    sessionTimeoutMinutes: 0,
  },
  sla: {
    enabled: false,
    hoursByPriority: {
      low: 72,
      medium: 48,
      high: 24,
    },
  },
  escalation: {
    enabled: false,
    blockedHours: 24,
    overdueHours: 24,
  },
  workload: {
    defaultCapacityHours: 40,
    capacitiesByMemberId: {},
  },
  focus: {
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    cyclesBeforeLongBreak: 4,
    autoStartBreak: false,
    autoStartFocus: false,
  },
};

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    return {
      notifications: {
        overdue: saved?.notifications?.overdue ?? DEFAULT_SETTINGS.notifications.overdue,
        dueSoon:
          saved?.notifications?.dueSoon ??
          saved?.notifications?.dueTomorrow ??
          DEFAULT_SETTINGS.notifications.dueSoon,
        toast: saved?.notifications?.toast ?? DEFAULT_SETTINGS.notifications.toast,
        slaBreach: saved?.notifications?.slaBreach ?? DEFAULT_SETTINGS.notifications.slaBreach,
        escalation: saved?.notifications?.escalation ?? DEFAULT_SETTINGS.notifications.escalation,
        browser: saved?.notifications?.browser ?? DEFAULT_SETTINGS.notifications.browser,
        leadDays: Number.isFinite(saved?.notifications?.leadDays)
          ? saved.notifications.leadDays
          : DEFAULT_SETTINGS.notifications.leadDays,
        quietHoursEnabled:
          saved?.notifications?.quietHoursEnabled ?? DEFAULT_SETTINGS.notifications.quietHoursEnabled,
        quietStartHour: Number.isFinite(saved?.notifications?.quietStartHour)
          ? saved.notifications.quietStartHour
          : DEFAULT_SETTINGS.notifications.quietStartHour,
        quietEndHour: Number.isFinite(saved?.notifications?.quietEndHour)
          ? saved.notifications.quietEndHour
          : DEFAULT_SETTINGS.notifications.quietEndHour,
        muteWeekends:
          saved?.notifications?.muteWeekends ?? DEFAULT_SETTINGS.notifications.muteWeekends,
        webhookEnabled:
          saved?.notifications?.webhookEnabled ?? DEFAULT_SETTINGS.notifications.webhookEnabled,
        webhookUrl: saved?.notifications?.webhookUrl ?? DEFAULT_SETTINGS.notifications.webhookUrl,
      },
      tasks: {
        defaultPriority: saved?.tasks?.defaultPriority || DEFAULT_SETTINGS.tasks.defaultPriority,
        holidayDates: Array.isArray(saved?.tasks?.holidayDates)
          ? saved.tasks.holidayDates
          : DEFAULT_SETTINGS.tasks.holidayDates,
      },
      goals: {
        weeklyCompletedTarget: Number.isFinite(saved?.goals?.weeklyCompletedTarget)
          ? saved.goals.weeklyCompletedTarget
          : DEFAULT_SETTINGS.goals.weeklyCompletedTarget,
      },
      backup: {
        enabled: saved?.backup?.enabled ?? DEFAULT_SETTINGS.backup.enabled,
        frequencyHours: Number.isFinite(saved?.backup?.frequencyHours)
          ? saved.backup.frequencyHours
          : DEFAULT_SETTINGS.backup.frequencyHours,
      },
      security: {
        sessionTimeoutMinutes: Number.isFinite(saved?.security?.sessionTimeoutMinutes)
          ? saved.security.sessionTimeoutMinutes
          : DEFAULT_SETTINGS.security.sessionTimeoutMinutes,
      },
      sla: {
        enabled: saved?.sla?.enabled ?? DEFAULT_SETTINGS.sla.enabled,
        hoursByPriority: {
          low: Number.isFinite(saved?.sla?.hoursByPriority?.low)
            ? saved.sla.hoursByPriority.low
            : DEFAULT_SETTINGS.sla.hoursByPriority.low,
          medium: Number.isFinite(saved?.sla?.hoursByPriority?.medium)
            ? saved.sla.hoursByPriority.medium
            : DEFAULT_SETTINGS.sla.hoursByPriority.medium,
          high: Number.isFinite(saved?.sla?.hoursByPriority?.high)
            ? saved.sla.hoursByPriority.high
            : DEFAULT_SETTINGS.sla.hoursByPriority.high,
        },
      },
      escalation: {
        enabled: saved?.escalation?.enabled ?? DEFAULT_SETTINGS.escalation.enabled,
        blockedHours: Number.isFinite(saved?.escalation?.blockedHours)
          ? saved.escalation.blockedHours
          : DEFAULT_SETTINGS.escalation.blockedHours,
        overdueHours: Number.isFinite(saved?.escalation?.overdueHours)
          ? saved.escalation.overdueHours
          : DEFAULT_SETTINGS.escalation.overdueHours,
      },
      workload: {
        defaultCapacityHours: Number.isFinite(saved?.workload?.defaultCapacityHours)
          ? saved.workload.defaultCapacityHours
          : DEFAULT_SETTINGS.workload.defaultCapacityHours,
        capacitiesByMemberId:
          saved?.workload?.capacitiesByMemberId &&
          typeof saved.workload.capacitiesByMemberId === "object"
            ? saved.workload.capacitiesByMemberId
            : DEFAULT_SETTINGS.workload.capacitiesByMemberId,
      },
      focus: {
        workMinutes: Number.isFinite(saved?.focus?.workMinutes)
          ? saved.focus.workMinutes
          : DEFAULT_SETTINGS.focus.workMinutes,
        shortBreakMinutes: Number.isFinite(saved?.focus?.shortBreakMinutes)
          ? saved.focus.shortBreakMinutes
          : DEFAULT_SETTINGS.focus.shortBreakMinutes,
        longBreakMinutes: Number.isFinite(saved?.focus?.longBreakMinutes)
          ? saved.focus.longBreakMinutes
          : DEFAULT_SETTINGS.focus.longBreakMinutes,
        cyclesBeforeLongBreak: Number.isFinite(saved?.focus?.cyclesBeforeLongBreak)
          ? saved.focus.cyclesBeforeLongBreak
          : DEFAULT_SETTINGS.focus.cyclesBeforeLongBreak,
        autoStartBreak: saved?.focus?.autoStartBreak ?? DEFAULT_SETTINGS.focus.autoStartBreak,
        autoStartFocus: saved?.focus?.autoStartFocus ?? DEFAULT_SETTINGS.focus.autoStartFocus,
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function Settings() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const {
    tasks,
    stats,
    exportTasks,
    importTasks,
    recycleBin,
    auditLog,
    restoreTask,
    permanentlyDeleteTask,
    clearRecycleBin,
  } = useContext(TaskContext);
  const { requestBrowserPermission } = useNotifications();
  const { canInstall, isInstalled, isOnline, install } = usePwaInstall();
  const { user, logout } = useAuth();
  const fileInputRef = useRef(null);
  const [settings, setSettings] = useState(loadSettings());
  const [importMode, setImportMode] = useState("replace");
  const [members, setMembers] = useState(() => ensureWorkspaceSeed(user));
  const [memberDraft, setMemberDraft] = useState({ name: "", email: "", role: "member" });
  const [message, setMessage] = useState("");
  const [autoBackups, setAutoBackups] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("taskAutoBackups")) || [];
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const roleOptions = useMemo(() => getRoleOptions(), []);
  const hourOptions = useMemo(
    () =>
      Array.from({ length: 24 }, (_, hour) => ({
        value: hour,
        label: `${String(hour).padStart(2, "0")}:00`,
      })),
    []
  );

  const themeLabel = useMemo(() => (theme === "dark" ? "Dark" : "Light"), [theme]);

  useEffect(() => {
    const syncMembers = () => setMembers(ensureWorkspaceSeed(user));
    window.addEventListener("workspace-members-updated", syncMembers);
    return () => window.removeEventListener("workspace-members-updated", syncMembers);
  }, [user]);

  const saveSettings = (nextSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
    window.dispatchEvent(new Event("app-settings-updated"));
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

  const handleQuietHourChange = (field, value) => {
    const nextHour = Math.max(0, Math.min(23, Number(value) || 0));
    const nextSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [field]: nextHour,
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

  const handleHolidayDatesChange = (value) => {
    const holidayDates = Array.from(
      new Set(
        value
          .split(/[\n,]/)
          .map((item) => item.trim())
          .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item))
      )
    );

    const nextSettings = {
      ...settings,
      tasks: {
        ...settings.tasks,
        holidayDates,
      },
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  const setTheme = (targetTheme) => {
    if (theme !== targetTheme) toggleTheme();
  };

  const handleWeeklyGoalChange = (value) => {
    const numeric = Math.max(1, Math.min(100, Number(value) || 1));
    const nextSettings = {
      ...settings,
      goals: {
        ...settings.goals,
        weeklyCompletedTarget: numeric,
      },
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  const resetAll = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    window.dispatchEvent(new Event("app-settings-updated"));
    setMessage("Settings reset to default.");
    setTimeout(() => setMessage(""), 1500);
  };

  const requestBrowserAlerts = async () => {
    const permission = await requestBrowserPermission();
    if (permission === "granted") {
      handleNotificationToggle("browser");
      return;
    }
    if (permission === "denied") {
      setMessage("Browser notification permission denied.");
      setTimeout(() => setMessage(""), 1500);
      return;
    }
    setMessage("Browser notifications are not supported.");
    setTimeout(() => setMessage(""), 1500);
  };

  const addMember = () => {
    const name = memberDraft.name.trim();
    const email = memberDraft.email.trim().toLowerCase();
    if (!name || !email) {
      setMessage("Member name and email are required.");
      setTimeout(() => setMessage(""), 1800);
      return;
    }

    if (members.some((member) => member.email === email)) {
      setMessage("Member email already exists.");
      setTimeout(() => setMessage(""), 1800);
      return;
    }

    const next = saveWorkspaceMembers([
      ...members,
      { id: crypto.randomUUID(), name, email, role: memberDraft.role },
    ]);
    setMembers(next);
    setMemberDraft({ name: "", email: "", role: "member" });
    setMessage("Member added.");
    setTimeout(() => setMessage(""), 1500);
  };

  const updateMemberRole = (memberId, role) => {
    const next = saveWorkspaceMembers(
      members.map((member) => (member.id === memberId ? { ...member, role } : member))
    );
    setMembers(next);
    setMessage("Role updated.");
    setTimeout(() => setMessage(""), 1200);
  };

  const removeMember = (memberId) => {
    if (members.length <= 1) {
      setMessage("At least one member is required.");
      setTimeout(() => setMessage(""), 1800);
      return;
    }
    const next = saveWorkspaceMembers(members.filter((member) => member.id !== memberId));
    setMembers(next);
    const nextSettings = {
      ...settings,
      workload: {
        ...settings.workload,
        capacitiesByMemberId: Object.fromEntries(
          Object.entries(settings.workload.capacitiesByMemberId || {}).filter(
            ([id]) => id !== memberId
          )
        ),
      },
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
    setMessage("Member removed.");
    setTimeout(() => setMessage(""), 1200);
  };

  const handleBackupToggle = () => {
    const nextSettings = {
      ...settings,
      backup: {
        ...settings.backup,
        enabled: !settings.backup.enabled,
      },
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  const handleBackupFrequency = (value) => {
    const hours = Math.max(1, Math.min(168, Number(value) || 24));
    const nextSettings = {
      ...settings,
      backup: {
        ...settings.backup,
        frequencyHours: hours,
      },
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  const handleExport = () => {
    const data = exportTasks();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `devtask-backup-${stamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setMessage("Tasks backup exported.");
    setTimeout(() => setMessage(""), 1800);
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const result = importTasks(text, { mode: importMode });
    if (result.ok) {
      setMessage(`Imported ${result.imported} task(s) using ${result.mode} mode.`);
    } else {
      setMessage(result.message || "Import failed.");
    }
    setTimeout(() => setMessage(""), 2200);
    event.target.value = "";
  };

  const exportCsv = () => {
    const csv = tasksToCsv(tasks);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`devtask-export-${stamp}.csv`, csv, "text/csv");
    setMessage("CSV exported.");
    setTimeout(() => setMessage(""), 1500);
  };

  const exportSummary = () => {
    const report = buildSummaryReport(tasks, stats);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`devtask-summary-${stamp}.json`, report, "application/json");
    setMessage("Summary report exported.");
    setTimeout(() => setMessage(""), 1500);
  };

  const refreshAutoBackups = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("taskAutoBackups")) || [];
      setAutoBackups(Array.isArray(saved) ? saved : []);
    } catch {
      setAutoBackups([]);
    }
  };

  const handleSessionTimeoutChange = (value) => {
    const minutes = Math.max(0, Math.min(240, Number(value) || 0));
    const nextSettings = {
      ...settings,
      security: {
        ...settings.security,
        sessionTimeoutMinutes: minutes,
      },
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  const handleSlaToggle = () => {
    const nextSettings = {
      ...settings,
      sla: {
        ...settings.sla,
        enabled: !settings.sla.enabled,
      },
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  const handleSlaHoursChange = (priority, value) => {
    const hours = Math.max(1, Math.min(240, Number(value) || 1));
    const nextSettings = {
      ...settings,
      sla: {
        ...settings.sla,
        hoursByPriority: {
          ...settings.sla.hoursByPriority,
          [priority]: hours,
        },
      },
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  const handleEscalationToggle = () => {
    const nextSettings = {
      ...settings,
      escalation: {
        ...settings.escalation,
        enabled: !settings.escalation.enabled,
      },
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  const handleEscalationHours = (field, value) => {
    const hours = Math.max(1, Math.min(240, Number(value) || 1));
    const nextSettings = {
      ...settings,
      escalation: {
        ...settings.escalation,
        [field]: hours,
      },
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  const handleWorkloadDefaultCapacityChange = (value) => {
    const hours = Math.max(1, Math.min(80, Number(value) || 1));
    const nextSettings = {
      ...settings,
      workload: {
        ...settings.workload,
        defaultCapacityHours: hours,
      },
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  const handleWorkloadMemberCapacity = (memberId, value) => {
    const hours = Math.max(1, Math.min(80, Number(value) || 1));
    const nextSettings = {
      ...settings,
      workload: {
        ...settings.workload,
        capacitiesByMemberId: {
          ...(settings.workload.capacitiesByMemberId || {}),
          [memberId]: hours,
        },
      },
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  const handleFocusNumericChange = (field, value) => {
    const ranges = {
      workMinutes: { min: 10, max: 120 },
      shortBreakMinutes: { min: 1, max: 30 },
      longBreakMinutes: { min: 5, max: 60 },
      cyclesBeforeLongBreak: { min: 2, max: 8 },
    };
    const range = ranges[field] || { min: 1, max: 120 };
    const numeric = Math.max(range.min, Math.min(range.max, Number(value) || range.min));
    const nextSettings = {
      ...settings,
      focus: {
        ...settings.focus,
        [field]: numeric,
      },
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  const handleFocusToggle = (field) => {
    const nextSettings = {
      ...settings,
      focus: {
        ...settings.focus,
        [field]: !settings.focus[field],
      },
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  const handleInstallApp = async () => {
    const result = await install();
    if (result.ok) {
      setMessage("App installed successfully.");
    } else {
      setMessage(result.message || "Install not available.");
    }
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
            <span>Upcoming deadline alerts</span>
            <input
              type="checkbox"
              checked={settings.notifications.dueSoon}
              onChange={() => handleNotificationToggle("dueSoon")}
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
          <label className="settings-toggle">
            <span>SLA breach alerts</span>
            <input
              type="checkbox"
              checked={settings.notifications.slaBreach}
              onChange={() => handleNotificationToggle("slaBreach")}
            />
          </label>
          <label className="settings-toggle">
            <span>Escalation alerts</span>
            <input
              type="checkbox"
              checked={settings.notifications.escalation}
              onChange={() => handleNotificationToggle("escalation")}
            />
          </label>
          <label className="settings-toggle">
            <span>Browser push alerts</span>
            <input
              type="checkbox"
              checked={settings.notifications.browser}
              onChange={requestBrowserAlerts}
            />
          </label>
          <label className="settings-toggle">
            <span>Reminder lead days</span>
            <select
              value={settings.notifications.leadDays}
              onChange={(e) => {
                const nextSettings = {
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    leadDays: Number(e.target.value),
                  },
                };
                setSettings(nextSettings);
                saveSettings(nextSettings);
              }}
            >
              <option value={0}>Due day only</option>
              <option value={1}>1 day before</option>
              <option value={2}>2 days before</option>
              <option value={3}>3 days before</option>
              <option value={7}>7 days before</option>
            </select>
          </label>
          <label className="settings-toggle">
            <span>Quiet hours</span>
            <input
              type="checkbox"
              checked={settings.notifications.quietHoursEnabled}
              onChange={() => handleNotificationToggle("quietHoursEnabled")}
            />
          </label>
          <label className="settings-toggle">
            <span>Quiet start</span>
            <select
              value={settings.notifications.quietStartHour}
              onChange={(e) => handleQuietHourChange("quietStartHour", e.target.value)}
            >
              {hourOptions.map((option) => (
                <option key={`quiet-start-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="settings-toggle">
            <span>Quiet end</span>
            <select
              value={settings.notifications.quietEndHour}
              onChange={(e) => handleQuietHourChange("quietEndHour", e.target.value)}
            >
              {hourOptions.map((option) => (
                <option key={`quiet-end-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="settings-toggle">
            <span>Mute on weekends</span>
            <input
              type="checkbox"
              checked={settings.notifications.muteWeekends}
              onChange={() => handleNotificationToggle("muteWeekends")}
            />
          </label>
          <label className="settings-toggle">
            <span>Webhook hook</span>
            <input
              type="checkbox"
              checked={settings.notifications.webhookEnabled}
              onChange={() => handleNotificationToggle("webhookEnabled")}
            />
          </label>
          <label className="settings-toggle settings-toggle--stack">
            <span>Webhook URL</span>
            <input
              type="url"
              placeholder="https://example.com/reminder-hook"
              value={settings.notifications.webhookUrl}
              onChange={(e) => {
                const nextSettings = {
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    webhookUrl: e.target.value,
                  },
                };
                setSettings(nextSettings);
              }}
              onBlur={() => saveSettings(settings)}
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
          <p className="settings-note">
            Holiday dates for recurrence rules (format: YYYY-MM-DD, comma or new line separated).
          </p>
          <textarea
            rows={4}
            placeholder="2026-01-01, 2026-12-25"
            value={(settings.tasks.holidayDates || []).join("\n")}
            onChange={(e) => handleHolidayDatesChange(e.target.value)}
          />
        </article>

        <article className="glass-card settings-card">
          <h3>Goals</h3>
          <p className="settings-note">Set your weekly completed-task target.</p>
          <label className="settings-toggle">
            <span>Weekly completion goal</span>
            <input
              type="number"
              min={1}
              max={100}
              value={settings.goals.weeklyCompletedTarget}
              onChange={(e) => handleWeeklyGoalChange(e.target.value)}
            />
          </label>
        </article>

        <article className="glass-card settings-card">
          <h3>Focus Mode</h3>
          <p className="settings-note">Configure pomodoro sessions for deep work.</p>
          <label className="settings-toggle">
            <span>Focus minutes</span>
            <input
              type="number"
              min={10}
              max={120}
              value={settings.focus.workMinutes}
              onChange={(e) => handleFocusNumericChange("workMinutes", e.target.value)}
            />
          </label>
          <label className="settings-toggle">
            <span>Short break minutes</span>
            <input
              type="number"
              min={1}
              max={30}
              value={settings.focus.shortBreakMinutes}
              onChange={(e) => handleFocusNumericChange("shortBreakMinutes", e.target.value)}
            />
          </label>
          <label className="settings-toggle">
            <span>Long break minutes</span>
            <input
              type="number"
              min={5}
              max={60}
              value={settings.focus.longBreakMinutes}
              onChange={(e) => handleFocusNumericChange("longBreakMinutes", e.target.value)}
            />
          </label>
          <label className="settings-toggle">
            <span>Cycles before long break</span>
            <input
              type="number"
              min={2}
              max={8}
              value={settings.focus.cyclesBeforeLongBreak}
              onChange={(e) => handleFocusNumericChange("cyclesBeforeLongBreak", e.target.value)}
            />
          </label>
          <label className="settings-toggle">
            <span>Auto start break</span>
            <input
              type="checkbox"
              checked={settings.focus.autoStartBreak}
              onChange={() => handleFocusToggle("autoStartBreak")}
            />
          </label>
          <label className="settings-toggle">
            <span>Auto start focus</span>
            <input
              type="checkbox"
              checked={settings.focus.autoStartFocus}
              onChange={() => handleFocusToggle("autoStartFocus")}
            />
          </label>
        </article>

        <article className="glass-card settings-card">
          <h3>SLA Rules</h3>
          <label className="settings-toggle">
            <span>Enable SLA tracking</span>
            <input
              type="checkbox"
              checked={settings.sla.enabled}
              onChange={handleSlaToggle}
            />
          </label>
          <label className="settings-toggle">
            <span>Low priority SLA (hours)</span>
            <input
              type="number"
              min={1}
              max={240}
              value={settings.sla.hoursByPriority.low}
              onChange={(e) => handleSlaHoursChange("low", e.target.value)}
            />
          </label>
          <label className="settings-toggle">
            <span>Medium priority SLA (hours)</span>
            <input
              type="number"
              min={1}
              max={240}
              value={settings.sla.hoursByPriority.medium}
              onChange={(e) => handleSlaHoursChange("medium", e.target.value)}
            />
          </label>
          <label className="settings-toggle">
            <span>High priority SLA (hours)</span>
            <input
              type="number"
              min={1}
              max={240}
              value={settings.sla.hoursByPriority.high}
              onChange={(e) => handleSlaHoursChange("high", e.target.value)}
            />
          </label>
        </article>

        <article className="glass-card settings-card">
          <h3>Escalation Rules</h3>
          <label className="settings-toggle">
            <span>Enable escalation engine</span>
            <input
              type="checkbox"
              checked={settings.escalation.enabled}
              onChange={handleEscalationToggle}
            />
          </label>
          <label className="settings-toggle">
            <span>Escalate blocked after (hours)</span>
            <input
              type="number"
              min={1}
              max={240}
              value={settings.escalation.blockedHours}
              onChange={(e) => handleEscalationHours("blockedHours", e.target.value)}
            />
          </label>
          <label className="settings-toggle">
            <span>Escalate overdue after (hours)</span>
            <input
              type="number"
              min={1}
              max={240}
              value={settings.escalation.overdueHours}
              onChange={(e) => handleEscalationHours("overdueHours", e.target.value)}
            />
          </label>
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

        <article className="glass-card settings-card">
          <h3>Team Workspace</h3>
          <p className="settings-note">Manage members and roles for task assignment.</p>
          <div className="workspace-member-form">
            <input
              type="text"
              placeholder="Member name"
              value={memberDraft.name}
              onChange={(e) => setMemberDraft((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              type="email"
              placeholder="Member email"
              value={memberDraft.email}
              onChange={(e) => setMemberDraft((prev) => ({ ...prev, email: e.target.value }))}
            />
            <select
              value={memberDraft.role}
              onChange={(e) => setMemberDraft((prev) => ({ ...prev, role: e.target.value }))}
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <button type="button" className="btn" onClick={addMember}>
              Add Member
            </button>
          </div>

          <div className="workspace-member-list">
            {members.map((member) => (
              <article key={member.id} className="workspace-member-item">
                <div>
                  <strong>{member.name}</strong>
                  <p>{member.email}</p>
                </div>
                <div className="workspace-member-actions">
                  <select
                    value={member.role}
                    onChange={(e) => updateMemberRole(member.id, e.target.value)}
                  >
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => removeMember(member.id)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="workload-config">
            <h4>Workload Capacity (hours/week)</h4>
            <label className="settings-toggle">
              <span>Default capacity</span>
              <input
                type="number"
                min={1}
                max={80}
                value={settings.workload.defaultCapacityHours}
                onChange={(e) => handleWorkloadDefaultCapacityChange(e.target.value)}
              />
            </label>
            <div className="workload-member-capacity-list">
              {members.map((member) => (
                <label key={member.id} className="settings-toggle">
                  <span>{member.name}</span>
                  <input
                    type="number"
                    min={1}
                    max={80}
                    value={
                      settings.workload.capacitiesByMemberId?.[member.id] ??
                      settings.workload.defaultCapacityHours
                    }
                    onChange={(e) => handleWorkloadMemberCapacity(member.id, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </div>
        </article>

        <article className="glass-card settings-card">
          <h3>Backup & Restore</h3>
          <p className="settings-note">Export your tasks or import from a JSON backup file.</p>
          <div className="settings-row">
            <button type="button" className="btn" onClick={handleExport}>
              Export Backup
            </button>
            <button type="button" className="btn-outline" onClick={exportCsv}>
              Export CSV
            </button>
            <button type="button" className="btn-outline" onClick={exportSummary}>
              Export Summary
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Import Backup
            </button>
          </div>
          <label className="settings-toggle">
            <span>Import mode</span>
            <select value={importMode} onChange={(e) => setImportMode(e.target.value)}>
              <option value="replace">Replace existing tasks</option>
              <option value="merge">Merge with existing tasks</option>
            </select>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="settings-file-input"
          />
          <label className="settings-toggle">
            <span>Scheduled auto backup</span>
            <input
              type="checkbox"
              checked={settings.backup.enabled}
              onChange={handleBackupToggle}
            />
          </label>
          <label className="settings-toggle">
            <span>Backup frequency (hours)</span>
            <input
              type="number"
              min={1}
              max={168}
              value={settings.backup.frequencyHours}
              onChange={(e) => handleBackupFrequency(e.target.value)}
            />
          </label>
          <div className="settings-row">
            <button type="button" className="btn-outline" onClick={refreshAutoBackups}>
              Refresh Snapshots
            </button>
          </div>
          <div className="backup-list">
            {autoBackups.slice(0, 5).map((snapshot) => (
              <article key={snapshot.id} className="backup-item">
                <strong>{new Date(snapshot.createdAt).toLocaleString()}</strong>
                <p>{snapshot.total} task(s)</p>
              </article>
            ))}
            {autoBackups.length === 0 && <p className="settings-note">No auto-backups yet.</p>}
          </div>
        </article>

        <article className="glass-card settings-card">
          <h3>PWA & Offline</h3>
          <p className="settings-note">
            Status: {isOnline ? "Online" : "Offline"} | {isInstalled ? "Installed" : "Browser mode"}
          </p>
          <div className="settings-row">
            <button
              type="button"
              className="btn"
              onClick={handleInstallApp}
              disabled={!canInstall}
            >
              {isInstalled ? "Installed" : "Install App"}
            </button>
          </div>
          <ul className="section-list">
            <li>Core pages are cached for offline access.</li>
            <li>Static assets are cached and refreshed in background.</li>
            <li>Use install for app-like full-screen experience.</li>
          </ul>
        </article>

        <article className="glass-card settings-card">
          <h3>Security</h3>
          <label className="settings-toggle">
            <span>Idle session timeout (minutes, 0 to disable)</span>
            <input
              type="number"
              min={0}
              max={240}
              value={settings.security.sessionTimeoutMinutes}
              onChange={(e) => handleSessionTimeoutChange(e.target.value)}
            />
          </label>
          <div className="settings-row">
            <button type="button" className="btn-outline" onClick={logout}>
              Lock Now
            </button>
          </div>
        </article>

        <article className="glass-card settings-card">
          <h3>Recycle Bin</h3>
          <p className="settings-note">Soft-deleted tasks can be restored or removed permanently.</p>
          <div className="settings-row">
            <button
              type="button"
              className="btn-outline"
              onClick={clearRecycleBin}
              disabled={recycleBin.length === 0}
            >
              Empty Bin
            </button>
          </div>
          <div className="backup-list">
            {recycleBin.slice(0, 8).map((task) => (
              <article key={task.id} className="backup-item">
                <strong>{task.title}</strong>
                <p>Deleted: {new Date(task.deletedAt).toLocaleString()}</p>
                <div className="settings-row">
                  <button type="button" className="filter-btn" onClick={() => restoreTask(task.id)}>
                    Restore
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => permanentlyDeleteTask(task.id)}
                  >
                    Delete Forever
                  </button>
                </div>
              </article>
            ))}
            {recycleBin.length === 0 && <p className="settings-note">Recycle bin is empty.</p>}
          </div>
        </article>

        <article className="glass-card settings-card">
          <h3>Audit Log</h3>
          <p className="settings-note">Recent system activity.</p>
          <div className="backup-list">
            {auditLog.slice(0, 12).map((entry) => (
              <article key={entry.id} className="backup-item">
                <strong>{entry.message}</strong>
                <p>{new Date(entry.createdAt).toLocaleString()}</p>
              </article>
            ))}
            {auditLog.length === 0 && <p className="settings-note">No audit activity yet.</p>}
          </div>
        </article>
      </section>
    </div>
  );
}

export default Settings;
