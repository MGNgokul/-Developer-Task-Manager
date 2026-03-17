import { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TaskContext } from "../context/TaskContext";
import { FocusContext } from "../context/FocusContext";

function formatDate(dateInput) {
  if (!dateInput) return "No date";
  const date = new Date(`${dateInput}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatClock(totalSeconds) {
  const safe = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function trendLabel(trend, delta) {
  if (trend === "up") return `Up +${delta}`;
  if (trend === "down") return `Down ${delta}`;
  return "Stable";
}

function formatSlaCountdown(hoursLeft) {
  if (!Number.isFinite(hoursLeft)) return "-";
  if (hoursLeft <= 0) return "Breached";
  const totalMinutes = Math.round(hoursLeft * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function Dashboard() {
  const { tasks, stats, clearCompleted } = useContext(TaskContext);
  const focus = useContext(FocusContext);

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
        <div className="stat-card glass-card">
          <h3>On-Time Rate</h3>
          <p>{stats.onTimeRate}%</p>
        </div>
        <div className="stat-card glass-card">
          <h3>Focus Score</h3>
          <p>{stats.focusScore}</p>
        </div>
        <div className="stat-card glass-card">
          <h3>Weekly Done</h3>
          <p>{stats.weeklyCompleted}/{stats.weeklyGoal}</p>
        </div>
        <div className="stat-card glass-card">
          <h3>Streak</h3>
          <p>{stats.completionStreakDays} day(s)</p>
        </div>
        <div className="stat-card glass-card">
          <h3>Tracked Today</h3>
          <p>{formatDuration(stats.trackedTodaySeconds)}</p>
        </div>
        <div className="stat-card glass-card">
          <h3>Tracked Week</h3>
          <p>{formatDuration(stats.trackedWeekSeconds)}</p>
        </div>
        <div className="stat-card glass-card">
          <h3>Blocked Tasks</h3>
          <p>{stats.blocked}</p>
        </div>
        <div className="stat-card glass-card">
          <h3>SLA Breached</h3>
          <p>{stats.slaBreached}</p>
        </div>
        <div className="stat-card glass-card">
          <h3>SLA At Risk</h3>
          <p>{stats.slaAtRisk}</p>
        </div>
        <div className="stat-card glass-card">
          <h3>Overloaded Members</h3>
          <p>{stats.overloadedMembers}</p>
        </div>
      </motion.div>

      <section className="dashboard-local-nav">
        <Link className="filter-btn" to="/tasks/form">Create Task</Link>
        <Link className="filter-btn" to="/tasks/filter">Filter Tasks</Link>
        <Link className="filter-btn" to="/tasks/kanban">Open Kanban</Link>
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
            <h3>SLA Live Monitor</h3>
            <p className="dashboard-subtitle">
              Next breach in: {formatSlaCountdown(stats.nextSlaBreachHours)}
            </p>
            <div className="sla-monitor-list">
              {(stats.slaWatchlist || []).slice(0, 6).map((item) => (
                <article key={item.taskId} className="sla-monitor-item">
                  <div>
                    <strong>{item.title}</strong>
                    <p className="analytics-note">
                      {item.priority} priority | age {item.ageHours}h / SLA {item.thresholdHours}h
                    </p>
                  </div>
                  <span className={`sla-pill sla-pill--${item.status}`}>
                    {formatSlaCountdown(item.hoursLeft)}
                  </span>
                </article>
              ))}
              {stats.slaWatchlist?.length === 0 && (
                <p className="kanban-empty">Enable SLA rules in Settings to activate live monitor.</p>
              )}
            </div>
          </div>

          <div className="glass-card">
            <h3>Smart Daily Briefing</h3>
            <p className="dashboard-subtitle">{stats.dailyBriefing.summaryLine}</p>
            <ul className="section-list">
              <li>Overdue: {stats.dailyBriefing.overdueCount}</li>
              <li>Due today: {stats.dailyBriefing.dueTodayCount}</li>
              <li>Blocked: {stats.dailyBriefing.blockedCount}</li>
              <li>High-priority open: {stats.dailyBriefing.highPriorityOpenCount}</li>
            </ul>
            <p className="analytics-note">{stats.dailyBriefing.recommendation}</p>
            <div className="briefing-focus-list">
              {stats.dailyBriefing.focusCandidates.map((item) => (
                <article key={item.id} className="briefing-focus-item">
                  <div>
                    <strong>{item.title}</strong>
                    <p className="analytics-note">
                      {item.priority} priority
                      {item.dueDate ? ` | due ${formatDate(item.dueDate)}` : ""}
                    </p>
                  </div>
                  <Link className="filter-btn" to="/tasks/filter">
                    Open
                  </Link>
                </article>
              ))}
              {stats.dailyBriefing.focusCandidates.length === 0 && (
                <p className="kanban-empty">No focus queue right now.</p>
              )}
            </div>
          </div>

          <div className="glass-card">
            <h3>Productivity Insights</h3>
            <div className="insight-list">
              <article className="insight-item">
                <div>
                  <strong>Momentum</strong>
                  <p className="analytics-note">
                    Last 7 days: {stats.last7Completed} vs previous {stats.prev7Completed}
                  </p>
                </div>
                <span className={`insight-pill insight-pill--${stats.momentumTrend}`}>
                  {trendLabel(stats.momentumTrend, stats.momentumDelta)}
                </span>
              </article>

              <article className="insight-item">
                <div>
                  <strong>Burnout Risk</strong>
                  <p className="analytics-note">
                    Score from workload hours, overdue tasks, and high-priority pressure.
                  </p>
                </div>
                <span className={`insight-pill insight-pill--${stats.burnoutRiskLevel}`}>
                  {stats.burnoutRiskLevel} ({stats.burnoutRiskScore})
                </span>
              </article>

              <article className="insight-item">
                <div>
                  <strong>Workload Balance</strong>
                  <p className="analytics-note">
                    Team utilization spread score based on planner distribution.
                  </p>
                </div>
                <span className="insight-pill insight-pill--info">
                  {stats.workloadBalanceScore}/100
                </span>
              </article>
            </div>
          </div>

          <div className="glass-card">
            <h3>Team Workload Planner</h3>
            <p className="dashboard-subtitle">
              Capacity utilization is estimated from open tasks and tracked week time.
            </p>
            <div className="workload-list">
              {stats.memberWorkload?.length ? (
                stats.memberWorkload.map((member) => (
                  <article key={member.memberId} className="workload-item">
                    <div className="workload-item-head">
                      <strong>{member.name}</strong>
                      <span
                        className={
                          member.overloaded
                            ? "workload-pill workload-pill--over"
                            : "workload-pill"
                        }
                      >
                        {member.utilization}%
                      </span>
                    </div>
                    <div className="analytics-progress-track">
                      <div
                        className={`analytics-progress-bar ${
                          member.overloaded ? "workload-bar--over" : ""
                        }`}
                        style={{ width: `${Math.min(100, member.utilization)}%` }}
                      />
                    </div>
                    <p className="analytics-note">
                      {member.estimatedHours}h planned / {member.capacity}h capacity
                    </p>
                  </article>
                ))
              ) : (
                <p className="kanban-empty">
                  No workspace members found. Add members in Settings to enable planner.
                </p>
              )}
            </div>
          </div>

          <div className="glass-card goal-card">
            <h3>Weekly Goal</h3>
            <p className="dashboard-subtitle">
              {stats.weeklyCompleted} of {stats.weeklyGoal} completed
            </p>
            <div className="analytics-progress-track">
              <div
                className="analytics-progress-bar"
                style={{ width: `${stats.weeklyGoalProgress}%` }}
              />
            </div>
            <p className="analytics-note">{stats.weeklyGoalProgress}% reached this week</p>
            <p className="analytics-note">
              {stats.activeTimerTaskId ? "A task timer is currently running." : "No active timer running."}
            </p>
          </div>

          <div className="glass-card">
            <h3>Focus Mode</h3>
            <p className="dashboard-subtitle">
              {focus.phaseLabel} - {focus.completedToday} session(s) completed today
            </p>
            <p className="focus-clock">{formatClock(focus.secondsLeft)}</p>
            <div className="settings-row focus-actions">
              {focus.isRunning ? (
                <button type="button" className="filter-btn" onClick={focus.pause}>
                  Pause
                </button>
              ) : (
                <button type="button" className="btn" onClick={focus.start}>
                  Start
                </button>
              )}
              <button type="button" className="filter-btn" onClick={focus.skip}>
                Skip
              </button>
              <button type="button" className="btn-outline" onClick={focus.reset}>
                Reset
              </button>
            </div>
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
