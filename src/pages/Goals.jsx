import { useContext, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TaskContext } from "../context/TaskContext";

const SETTINGS_KEY = "appSettings";

function loadMonthlyGoal() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    const value = Number(saved?.goals?.monthlyCompletedTarget);
    return Number.isFinite(value) && value > 0 ? value : 30;
  } catch {
    return 30;
  }
}

function Goals() {
  const { tasks, stats } = useContext(TaskContext);
  const [monthlyGoal, setMonthlyGoal] = useState(loadMonthlyGoal);
  const [message, setMessage] = useState("");

  const monthCompleted = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return tasks.filter((task) => {
      if (task.status !== "done" || !task.completedAt) return false;
      const completed = new Date(task.completedAt);
      return completed.getMonth() === month && completed.getFullYear() === year;
    }).length;
  }, [tasks]);

  const monthlyProgress = Math.min(100, Math.round((monthCompleted / Math.max(1, monthlyGoal)) * 100));

  const updateMonthlyGoal = (value) => {
    const next = Math.max(1, Math.min(500, Number(value) || 1));
    setMonthlyGoal(next);
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
      const payload = {
        ...saved,
        goals: {
          ...(saved.goals || {}),
          monthlyCompletedTarget: next,
        },
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
      window.dispatchEvent(new Event("app-settings-updated"));
      setMessage("Monthly goal saved.");
      setTimeout(() => setMessage(""), 1200);
    } catch {
      setMessage("Save failed.");
      setTimeout(() => setMessage(""), 1200);
    }
  };

  return (
    <div className="analytics-page goals-page">
      <motion.section
        className="analytics-header glass-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>Goals Planner</h2>
        <p>Set execution targets and track weekly/monthly delivery confidence.</p>
      </motion.section>

      <section className="analytics-grid">
        <article className="glass-card analytics-card">
          <h3>Weekly Goal</h3>
          <p className="dashboard-subtitle">
            {stats.weeklyCompleted} / {stats.weeklyGoal} completed
          </p>
          <div className="analytics-progress-track">
            <div className="analytics-progress-bar" style={{ width: `${stats.weeklyGoalProgress}%` }} />
          </div>
          <p className="analytics-note">{stats.weeklyGoalProgress}% this week</p>
        </article>

        <article className="glass-card analytics-card">
          <h3>Monthly Goal</h3>
          <label className="settings-toggle">
            <span>Target completed tasks</span>
            <input
              type="number"
              min={1}
              max={500}
              value={monthlyGoal}
              onChange={(e) => updateMonthlyGoal(e.target.value)}
            />
          </label>
          <p className="dashboard-subtitle">
            {monthCompleted} / {monthlyGoal} completed this month
          </p>
          <div className="analytics-progress-track">
            <div className="analytics-progress-bar" style={{ width: `${monthlyProgress}%` }} />
          </div>
          {message && <p className="success-msg">{message}</p>}
        </article>
      </section>

      <section className="analytics-grid">
        <article className="glass-card analytics-card">
          <h3>Consistency</h3>
          <ul className="section-list">
            <li>Current completion streak: {stats.completionStreakDays} day(s)</li>
            <li>Focus score: {stats.focusScore}</li>
            <li>On-time rate: {stats.onTimeRate}%</li>
          </ul>
        </article>

        <article className="glass-card analytics-card">
          <h3>Delivery Health</h3>
          <ul className="section-list">
            <li>Overdue tasks: {stats.overdue}</li>
            <li>Blocked tasks: {stats.blocked}</li>
            <li>SLA breaches: {stats.slaBreached}</li>
          </ul>
        </article>
      </section>
    </div>
  );
}

export default Goals;
