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

function formatHours(value) {
  if (!Number.isFinite(value) || value <= 0) return "0h";
  if (value < 24) return `${value.toFixed(1)}h`;
  return `${(value / 24).toFixed(1)}d`;
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

  const advancedMetrics = useMemo(() => {
    const completedTasks = filtered.filter((task) => task.status === "done" && task.completedAt);
    const leadHours = completedTasks
      .map((task) => {
        const start = new Date(task.createdAt || task.completedAt).getTime();
        const end = new Date(task.completedAt).getTime();
        return (end - start) / (1000 * 60 * 60);
      })
      .filter((value) => Number.isFinite(value) && value >= 0);

    const cycleHours = completedTasks
      .map((task) => {
        const firstTimerStart = (task.timeEntries || [])[0]?.startedAt;
        if (!firstTimerStart) return null;
        const start = new Date(firstTimerStart).getTime();
        const end = new Date(task.completedAt).getTime();
        return (end - start) / (1000 * 60 * 60);
      })
      .filter((value) => Number.isFinite(value) && value >= 0);

    const avgLeadHours =
      leadHours.length === 0 ? 0 : leadHours.reduce((sum, value) => sum + value, 0) / leadHours.length;
    const avgCycleHours =
      cycleHours.length === 0 ? 0 : cycleHours.reduce((sum, value) => sum + value, 0) / cycleHours.length;

    const today = startOfDay(new Date());
    const weeklyThroughput = Array.from({ length: 4 }, (_, index) => {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (index * 7 + 6));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const doneCount = completedTasks.filter((task) => {
        const doneAt = new Date(task.completedAt);
        return doneAt >= weekStart && doneAt < weekEnd;
      }).length;
      return { label: `W${4 - index}`, count: doneCount };
    }).reverse();

    const throughputMax = Math.max(...weeklyThroughput.map((item) => item.count), 1);

    const wipTasks = filtered.filter((task) => task.status === "inprogress");
    const avgWipAgeDays =
      wipTasks.length === 0
        ? 0
        : wipTasks.reduce((sum, task) => {
            const created = new Date(task.createdAt || new Date().toISOString());
            const age = (today - created) / (1000 * 60 * 60 * 24);
            return sum + Math.max(0, age);
          }, 0) / wipTasks.length;

    return {
      avgLeadHours,
      avgCycleHours,
      weeklyThroughput,
      throughputMax,
      avgWipAgeDays,
      completedSample: completedTasks.length,
    };
  }, [filtered]);

  const topTags = useMemo(() => {
    const counts = new Map();
    filtered.forEach((task) => {
      (task.tags || []).forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filtered]);

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
        <div className="stat-card glass-card">
          <h3>Avg Lead Time</h3>
          <p>{formatHours(advancedMetrics.avgLeadHours)}</p>
        </div>
        <div className="stat-card glass-card">
          <h3>Avg Cycle Time</h3>
          <p>{formatHours(advancedMetrics.avgCycleHours)}</p>
        </div>
        <div className="stat-card glass-card">
          <h3>Avg WIP Age</h3>
          <p>{advancedMetrics.avgWipAgeDays.toFixed(1)}d</p>
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

        <motion.article
          className="analytics-card glass-card"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.38 }}
        >
          <h3>4-Week Throughput</h3>
          <div className="mini-chart-list">
            {advancedMetrics.weeklyThroughput.map((item) => (
              <div className="mini-chart-row" key={item.label}>
                <span>{item.label}</span>
                <div className="mini-chart-track">
                  <div
                    className="mini-chart-fill info"
                    style={{ width: `${(item.count / advancedMetrics.throughputMax) * 100}%` }}
                  />
                </div>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
          <p className="analytics-note">
            Completed tasks per week (sample size: {advancedMetrics.completedSample}).
          </p>
        </motion.article>

        <motion.article
          className="analytics-card glass-card"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.42 }}
        >
          <h3>Top Tags</h3>
          <div className="mini-chart-list">
            {topTags.map((item) => (
              <div className="mini-chart-row" key={item.tag}>
                <span>#{item.tag}</span>
                <div className="mini-chart-track">
                  <div
                    className="mini-chart-fill success"
                    style={{ width: `${(item.count / Math.max(topTags[0]?.count || 1, 1)) * 100}%` }}
                  />
                </div>
                <strong>{item.count}</strong>
              </div>
            ))}
            {topTags.length === 0 && <p className="kanban-empty">No tags used yet.</p>}
          </div>
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
