import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const PRIORITIES = ["all", "low", "medium", "high"];

function startOfDay(date) {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function formatShortDay(date) {
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

function Analytics() {
  const [priorityView, setPriorityView] = useState("all");

  const tasks = useMemo(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("tasks")) || [];
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }, []);

  const filtered =
    priorityView === "all"
      ? tasks
      : tasks.filter((task) => task.priority === priorityView);

  const total = filtered.length;
  const completed = filtered.filter((task) => task.status === "done").length;
  const pending = total - completed;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
  const todo = filtered.filter((task) => task.status === "todo").length;
  const inprogress = filtered.filter((task) => task.status === "inprogress").length;

  const overdueMetrics = useMemo(() => {
    const today = startOfDay(new Date());
    const actionable = filtered.filter((task) => task.status !== "done" && task.dueDate);
    const overdue = actionable.filter((task) => new Date(`${task.dueDate}T00:00:00`) < today).length;
    const dueToday = actionable.filter(
      (task) => new Date(`${task.dueDate}T00:00:00`).getTime() === today.getTime()
    ).length;
    const dueThisWeek = actionable.filter((task) => {
      const due = new Date(`${task.dueDate}T00:00:00`);
      const diff = Math.floor((due - today) / (1000 * 60 * 60 * 24));
      return diff >= 1 && diff <= 7;
    }).length;

    const max = Math.max(overdue, dueToday, dueThisWeek, 1);
    return {
      overdue,
      dueToday,
      dueThisWeek,
      max,
    };
  }, [filtered]);

  const priorityData = useMemo(() => {
    const source = priorityView === "all" ? tasks : filtered;
    const low = source.filter((task) => task.priority === "low").length;
    const medium = source.filter((task) => task.priority === "medium").length;
    const high = source.filter((task) => task.priority === "high").length;
    const max = Math.max(low, medium, high, 1);
    return { low, medium, high, max };
  }, [tasks, filtered, priorityView]);

  const weeklyData = useMemo(() => {
    const today = startOfDay(new Date());
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return date;
    });

    const counts = days.map((day) => {
      const dayStr = day.toISOString().slice(0, 10);
      return filtered.filter((task) => (task.createdAt || "").slice(0, 10) === dayStr).length;
    });
    const max = Math.max(...counts, 1);
    const points = counts
      .map((value, index) => {
        const x = (index / 6) * 100;
        const y = 100 - (value / max) * 100;
        return `${x},${y}`;
      })
      .join(" ");

    return { days, counts, max, points };
  }, [filtered]);

  const overdueList = useMemo(() => {
    const today = startOfDay(new Date());
    return filtered
      .filter((task) => task.status !== "done" && task.dueDate)
      .filter((task) => new Date(`${task.dueDate}T00:00:00`) < today)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 6);
  }, [filtered]);

  const insightLines = useMemo(() => {
    const lines = [];
    if (completionRate < 40) {
      lines.push("Completion is low. Prioritize in-progress tasks before adding new work.");
    } else if (completionRate < 70) {
      lines.push("Steady completion. Keep focus on overdue and high-priority tasks.");
    } else {
      lines.push("Strong completion rate. Maintain pace and review priority balance.");
    }

    if (overdueMetrics.overdue > 0) {
      lines.push(`You have ${overdueMetrics.overdue} overdue task(s). Resolve them first this week.`);
    } else {
      lines.push("No overdue tasks right now. Deadline management looks healthy.");
    }

    if (priorityData.high > priorityData.medium + priorityData.low) {
      lines.push("High-priority tasks dominate. Re-balance priorities to avoid burnout.");
    } else {
      lines.push("Priority distribution looks manageable across low/medium/high.");
    }

    return lines;
  }, [completionRate, overdueMetrics.overdue, priorityData]);

  const ringValue = `${completionRate}%`;

  return (
    <div className="analytics-page">
      <motion.section
        className="analytics-header glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>Analytics Overview</h2>
        <p>Track completion, overdue load, priorities, and weekly productivity in one view.</p>
      </motion.section>

      <motion.div
        className="analytics-filter glass-card"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {PRIORITIES.map((item) => (
          <button
            key={item}
            type="button"
            className={priorityView === item ? "filter-btn filter-btn--active" : "filter-btn"}
            onClick={() => setPriorityView(item)}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </motion.div>

      <motion.div
        className="dashboard-stats"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="stat-card glass-card">
          <h3>Total Tasks</h3>
          <p>{total}</p>
        </div>
        <div className="stat-card glass-card">
          <h3>Completed</h3>
          <p>{completed}</p>
        </div>
        <div className="stat-card glass-card">
          <h3>Pending</h3>
          <p>{pending}</p>
        </div>
      </motion.div>

      <section className="analytics-grid analytics-grid-upgraded">
        <motion.article
          className="analytics-card glass-card"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3>Completion Rate</h3>
          <div className="completion-ring-wrap">
            <div
              className="completion-ring"
              style={{
                background: `conic-gradient(#22c55e ${completionRate * 3.6}deg, rgba(148, 163, 184, 0.25) 0deg)`,
              }}
            >
              <div className="completion-ring-inner">{ringValue}</div>
            </div>
          </div>
          <p className="analytics-note">Percentage of completed tasks in current selection.</p>
        </motion.article>

        <motion.article
          className="analytics-card glass-card"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h3>Overdue Tasks Chart</h3>
          <div className="mini-chart-list">
            <div className="mini-chart-row">
              <span>Overdue</span>
              <div className="mini-chart-track">
                <div
                  className="mini-chart-fill danger"
                  style={{ width: `${(overdueMetrics.overdue / overdueMetrics.max) * 100}%` }}
                />
              </div>
              <strong>{overdueMetrics.overdue}</strong>
            </div>
            <div className="mini-chart-row">
              <span>Due Today</span>
              <div className="mini-chart-track">
                <div
                  className="mini-chart-fill warning"
                  style={{ width: `${(overdueMetrics.dueToday / overdueMetrics.max) * 100}%` }}
                />
              </div>
              <strong>{overdueMetrics.dueToday}</strong>
            </div>
            <div className="mini-chart-row">
              <span>Due 7 Days</span>
              <div className="mini-chart-track">
                <div
                  className="mini-chart-fill info"
                  style={{ width: `${(overdueMetrics.dueThisWeek / overdueMetrics.max) * 100}%` }}
                />
              </div>
              <strong>{overdueMetrics.dueThisWeek}</strong>
            </div>
          </div>
        </motion.article>

        <motion.article
          className="analytics-card glass-card"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3>Tasks by Priority</h3>
          <div className="mini-chart-list">
            <div className="mini-chart-row">
              <span>Low</span>
              <div className="mini-chart-track">
                <div
                  className="mini-chart-fill success"
                  style={{ width: `${(priorityData.low / priorityData.max) * 100}%` }}
                />
              </div>
              <strong>{priorityData.low}</strong>
            </div>
            <div className="mini-chart-row">
              <span>Medium</span>
              <div className="mini-chart-track">
                <div
                  className="mini-chart-fill warning"
                  style={{ width: `${(priorityData.medium / priorityData.max) * 100}%` }}
                />
              </div>
              <strong>{priorityData.medium}</strong>
            </div>
            <div className="mini-chart-row">
              <span>High</span>
              <div className="mini-chart-track">
                <div
                  className="mini-chart-fill danger"
                  style={{ width: `${(priorityData.high / priorityData.max) * 100}%` }}
                />
              </div>
              <strong>{priorityData.high}</strong>
            </div>
          </div>
        </motion.article>

        <motion.article
          className="analytics-card glass-card"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h3>Weekly Productivity Graph</h3>
          <div className="weekly-chart-wrap">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="weekly-chart">
              <polyline
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="2.6"
                strokeLinecap="round"
                points={weeklyData.points}
              />
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <div className="weekly-chart-labels">
              {weeklyData.days.map((day, index) => (
                <span key={day.toISOString()} title={`${weeklyData.counts[index]} task(s)`}>
                  {formatShortDay(day)}
                </span>
              ))}
            </div>
          </div>
          <p className="analytics-note">Tasks created each day over the last 7 days.</p>
        </motion.article>
      </section>

      <section className="section-grid">
        <div className="section-main">
          <motion.article
            className="analytics-card glass-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3>Status Distribution</h3>
            <div className="status-list">
              <div className="status-row">
                <span>To Do</span>
                <strong>{todo}</strong>
              </div>
              <div className="status-row">
                <span>In Progress</span>
                <strong>{inprogress}</strong>
              </div>
              <div className="status-row">
                <span>Done</span>
                <strong>{completed}</strong>
              </div>
            </div>
          </motion.article>

          <motion.article
            className="analytics-card glass-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <h3>Actionable Insights</h3>
            <ul className="section-list analytics-list">
              {insightLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </motion.article>
        </div>

        <aside className="section-side">
          <motion.article
            className="analytics-card glass-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3>Overdue Focus List</h3>
            <div className="dashboard-list">
              {overdueList.length === 0 && (
                <p className="kanban-empty">No overdue tasks. Great deadline discipline.</p>
              )}
              {overdueList.map((task) => (
                <article key={task.id} className="dashboard-list-item">
                  <div>
                    <strong>{task.title}</strong>
                    <p>Due: {task.dueDate}</p>
                  </div>
                  <span className={`priority ${task.priority}`}>{task.priority}</span>
                </article>
              ))}
            </div>
          </motion.article>
        </aside>
      </section>
    </div>
  );
}

export default Analytics;
