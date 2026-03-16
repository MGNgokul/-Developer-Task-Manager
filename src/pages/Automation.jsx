import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const KEY = "automationSettings";

const DEFAULT_AUTOMATION = {
  autoArchiveDone: false,
  archiveAfterDays: 14,
  autoPrioritizeOverdue: true,
  dailyDigest: true,
  digestHour: 9,
};

function loadAutomationSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY)) || {};
    return {
      autoArchiveDone: saved?.autoArchiveDone ?? DEFAULT_AUTOMATION.autoArchiveDone,
      archiveAfterDays: Number.isFinite(saved?.archiveAfterDays)
        ? saved.archiveAfterDays
        : DEFAULT_AUTOMATION.archiveAfterDays,
      autoPrioritizeOverdue:
        saved?.autoPrioritizeOverdue ?? DEFAULT_AUTOMATION.autoPrioritizeOverdue,
      dailyDigest: saved?.dailyDigest ?? DEFAULT_AUTOMATION.dailyDigest,
      digestHour: Number.isFinite(saved?.digestHour) ? saved.digestHour : DEFAULT_AUTOMATION.digestHour,
    };
  } catch {
    return DEFAULT_AUTOMATION;
  }
}

function Automation() {
  const [settings, setSettings] = useState(loadAutomationSettings);
  const [message, setMessage] = useState("");
  const hours = useMemo(
    () =>
      Array.from({ length: 24 }, (_, hour) => ({
        value: hour,
        label: `${String(hour).padStart(2, "0")}:00`,
      })),
    []
  );

  const save = (next) => {
    setSettings(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    setMessage("Automation settings saved.");
    setTimeout(() => setMessage(""), 1200);
  };

  return (
    <div className="settings-page automation-page">
      <motion.section
        className="settings-header glass-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2>Automation Center</h2>
          <p>Define operational rules to reduce manual project maintenance.</p>
        </div>
      </motion.section>

      <section className="settings-grid">
        <article className="glass-card settings-card">
          <h3>Task Lifecycle</h3>
          <label className="settings-toggle">
            <span>Auto archive completed tasks</span>
            <input
              type="checkbox"
              checked={settings.autoArchiveDone}
              onChange={() => save({ ...settings, autoArchiveDone: !settings.autoArchiveDone })}
            />
          </label>
          <label className="settings-toggle">
            <span>Archive after days</span>
            <input
              type="number"
              min={1}
              max={90}
              value={settings.archiveAfterDays}
              onChange={(e) =>
                save({
                  ...settings,
                  archiveAfterDays: Math.max(1, Math.min(90, Number(e.target.value) || 1)),
                })
              }
            />
          </label>
        </article>

        <article className="glass-card settings-card">
          <h3>Priority Engine</h3>
          <label className="settings-toggle">
            <span>Auto boost overdue to high priority</span>
            <input
              type="checkbox"
              checked={settings.autoPrioritizeOverdue}
              onChange={() =>
                save({
                  ...settings,
                  autoPrioritizeOverdue: !settings.autoPrioritizeOverdue,
                })
              }
            />
          </label>
          <p className="settings-note">
            Helps team focus on critical deadlines without manual triage.
          </p>
        </article>

        <article className="glass-card settings-card">
          <h3>Digest Scheduler</h3>
          <label className="settings-toggle">
            <span>Daily digest</span>
            <input
              type="checkbox"
              checked={settings.dailyDigest}
              onChange={() => save({ ...settings, dailyDigest: !settings.dailyDigest })}
            />
          </label>
          <label className="settings-toggle">
            <span>Digest hour</span>
            <select
              value={settings.digestHour}
              onChange={(e) =>
                save({
                  ...settings,
                  digestHour: Math.max(0, Math.min(23, Number(e.target.value) || 0)),
                })
              }
            >
              {hours.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          {message && <p className="success-msg">{message}</p>}
        </article>
      </section>
    </div>
  );
}

export default Automation;
