import { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TaskContext } from "../context/TaskContext";

function formatDate(dateInput) {
  if (!dateInput) return "No date";
  const date = new Date(`${dateInput}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Dashboard() {
  const { tasks, stats, clearCompleted } = useContext(TaskContext);

  const insights = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const withDue = tasks.filter((task) => task.dueDate && task.status !== "done");
    const overdue = withDue.filter((task) => new Date(`${task.dueDate}T00:00:00`) < today);
    const dueSoon = withDue
      .filter((task) => {
        const due = new Date(`${task.dueDate}T00:00:00`);
        const diff = Math.floor((due - today) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 7;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    const recent = [...tasks]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    const priority = {
      low: tasks.filter((task) => task.priority === "low").length,
      medium: tasks.filter((task) => task.priority === "medium").length,
      high: tasks.filter((task) => task.priority === "high").length,
    };

    const status = {
      todo: tasks.filter((task) => task.status === "todo").length,
      inprogress: tasks.filter((task) => task.status === "inprogress").length,
      done: tasks.filter((task) => task.status === "done").length,
    };

    return { overdue, dueSoon, recent, priority, status };
  }, [tasks]);

  return (
    <div className="dashboard-page">
      <motion.section
        className="dashboard-header glass-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div>
          <h1>Dashboard Overview</h1>
          <p className="dashboard-subtitle">
            Prioritize work, track deadlines, and move faster with focused actions.
          </p>
        </div>
        <div className="progress-badge">
          <strong>{stats.progress}%</strong>
          <span>Completion</span>
        </div>
      </motion.section>

      <motion.div
        className="stats-grid dashboard-stats"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
      >
        <div className="stat-card glass-card">
          <h3>Total Tasks</h3>
          <p>{stats.total}</p>
        </div>
        <div className="stat-card glass-card">
          <h3>Completed</h3>
          <p>{stats.completed}</p>
        </div>
        <div className="stat-card glass-card">
          <h3>Pending</h3>
          <p>{stats.pending}</p>
        </div>
        <div className="stat-card glass-card">
          <h3>Overdue</h3>
          <p>{insights.overdue.length}</p>
        </div>
      </motion.div>

      <section className="dashboard-local-nav">
        <Link className="filter-btn" to="/tasks?section=task-form">Create Task</Link>
        <Link className="filter-btn" to="/tasks?section=task-filter">Filter Tasks</Link>
        <Link className="filter-btn" to="/tasks?section=kanban-board">Open Kanban</Link>
        <Link className="filter-btn" to="/analytics">View Analytics</Link>
      </section>

      <section className="section-grid">
        <div className="section-main">
          <div className="glass-card">
            <h3>Upcoming Deadlines (Next 7 Days)</h3>
            <div className="dashboard-list">
              {insights.dueSoon.length === 0 && (
                <p className="kanban-empty">No upcoming deadlines in the next 7 days.</p>
              )}
              {insights.dueSoon.map((task) => (
                <article key={task.id} className="dashboard-list-item">
                  <div>
                    <strong>{task.title}</strong>
                    <p>Due: {formatDate(task.dueDate)}</p>
                  </div>
                  <span className={`priority ${task.priority}`}>{task.priority}</span>
                </article>
              ))}
            </div>
          </div>

          <div className="glass-card">
            <h3>Recent Tasks</h3>
            <div className="dashboard-list">
              {insights.recent.length === 0 && (
                <p className="kanban-empty">No tasks yet. Create your first task to get started.</p>
              )}
              {insights.recent.map((task) => (
                <article key={task.id} className="dashboard-list-item">
                  <div>
                    <strong>{task.title}</strong>
                    <p>
                      {task.status} • {formatDate(task.createdAt?.slice(0, 10))}
                    </p>
                  </div>
                  <span className={`priority ${task.priority}`}>{task.priority}</span>
                </article>
              ))}
            </div>
          </div>
        </div>

        <aside className="section-side">
          <div className="glass-card">
            <h3>Priority Distribution</h3>
            <div className="dash-bars">
              <div className="dash-bar-row">
                <span>Low</span>
                <div className="dash-bar-track">
                  <div
                    className="dash-bar-fill low"
                    style={{ width: `${stats.total ? (insights.priority.low / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <strong>{insights.priority.low}</strong>
              </div>
              <div className="dash-bar-row">
                <span>Medium</span>
                <div className="dash-bar-track">
                  <div
                    className="dash-bar-fill medium"
                    style={{ width: `${stats.total ? (insights.priority.medium / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <strong>{insights.priority.medium}</strong>
              </div>
              <div className="dash-bar-row">
                <span>High</span>
                <div className="dash-bar-track">
                  <div
                    className="dash-bar-fill high"
                    style={{ width: `${stats.total ? (insights.priority.high / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <strong>{insights.priority.high}</strong>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3>Workflow Health</h3>
            <ul className="section-list">
              <li>To Do: {insights.status.todo}</li>
              <li>In Progress: {insights.status.inprogress}</li>
              <li>Done: {insights.status.done}</li>
              <li>Overdue: {insights.overdue.length}</li>
            </ul>
          </div>

          <div className="glass-card">
            <h3>Maintenance</h3>
            <p className="dashboard-subtitle">Remove completed tasks to keep the workspace clean.</p>
            <button
              type="button"
              className="btn-outline"
              onClick={clearCompleted}
              disabled={stats.completed === 0}
            >
              Clear Completed
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default Dashboard;
