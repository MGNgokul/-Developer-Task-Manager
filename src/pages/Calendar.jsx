import { useContext, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskContext } from "../context/TaskContext";

function toKey(date) {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function Calendar() {
  const { tasks } = useContext(TaskContext);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(null);

  const todayKey = toKey(new Date());

  const monthTitle = currentDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  // ── Validation helpers ────────────────────────────────────────────────────
  const tasksWithoutDueDate = useMemo(
    () => tasks.filter((t) => !t.dueDate && !t.completed),
    [tasks]
  );

  const overdueTasks = useMemo(
    () =>
      tasks.filter(
        (t) => t.dueDate && !t.completed && new Date(t.dueDate) < new Date(todayKey)
      ),
    [tasks, todayKey]
  );

  // ── Calendar grid ─────────────────────────────────────────────────────────
  const selectedMonthDays = useMemo(() => {
    const first = startOfMonth(currentDate);
    const last = endOfMonth(currentDate);
    const startWeekDay = first.getDay();
    const totalDays = last.getDate();
    const cells = [];

    for (let i = 0; i < startWeekDay; i += 1) {
      cells.push({ key: `empty-start-${i}`, empty: true });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const key = toKey(date);
      const dayTasks = tasks.filter((task) => task.dueDate === key);
      const hasOverdue = dayTasks.some((t) => !t.completed && key < todayKey);
      const isToday = key === todayKey;
      cells.push({ key, day, date, tasks: dayTasks, empty: false, hasOverdue, isToday });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ key: `empty-end-${cells.length}`, empty: true });
    }

    return cells;
  }, [currentDate, tasks, todayKey]);

  const thisMonthTasks = useMemo(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    return tasks
      .filter((task) => {
        if (!task.dueDate) return false;
        const due = new Date(`${task.dueDate}T00:00:00`);
        return due.getMonth() === month && due.getFullYear() === year;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [currentDate, tasks]);

  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    return tasks.filter((t) => t.dueDate === selectedDay);
  }, [selectedDay, tasks]);

  const changeMonth = (offset) => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    setSelectedDay(null);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(todayKey);
  };

  const formatDueDate = (dateStr) => {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  };

  const getDueDateStatus = (dateStr, completed) => {
    if (completed) return "completed";
    const today = new Date(todayKey);
    const due = new Date(dateStr);
    if (due < today) return "overdue";
    const diff = (due - today) / (1000 * 60 * 60 * 24);
    if (diff <= 2) return "soon";
    return "ok";
  };

  return (
    <div className="analytics-page calendar-page">
      {/* ── Validation banner: tasks without due dates ── */}
      <AnimatePresence>
        {tasksWithoutDueDate.length > 0 && (
          <motion.div
            className="calendar-validation-banner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <span className="banner-icon">⚠️</span>
            <span>
              <strong>{tasksWithoutDueDate.length} task{tasksWithoutDueDate.length > 1 ? "s" : ""}</strong>{" "}
              {tasksWithoutDueDate.length > 1 ? "have" : "has"} no due date — they won't appear on this calendar.
            </span>
            <span className="banner-items">
              {tasksWithoutDueDate.slice(0, 3).map((t) => (
                <span key={t.id} className="banner-task-chip">{t.title}</span>
              ))}
              {tasksWithoutDueDate.length > 3 && (
                <span className="banner-task-chip muted">+{tasksWithoutDueDate.length - 3} more</span>
              )}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Overdue alert ── */}
      <AnimatePresence>
        {overdueTasks.length > 0 && (
          <motion.div
            className="calendar-validation-banner calendar-validation-banner--overdue"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <span className="banner-icon">🔴</span>
            <span>
              <strong>{overdueTasks.length} overdue task{overdueTasks.length > 1 ? "s" : ""}</strong> past their due date and not yet completed.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <motion.section
        className="glass-card calendar-header"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2>Calendar View</h2>
          <p>See due dates by month and review upcoming deadlines quickly.</p>
        </div>
        <div className="calendar-controls">
          <button type="button" className="filter-btn" onClick={() => changeMonth(-1)}>← Prev</button>
          <strong>{monthTitle}</strong>
          <button type="button" className="filter-btn" onClick={() => changeMonth(1)}>Next →</button>
          <button type="button" className="filter-btn filter-btn--today" onClick={goToToday}>Today</button>
        </div>
      </motion.section>

      <section className="section-grid">
        <div className="section-main">
          <article className="glass-card calendar-grid-card">
            <div className="calendar-weekdays">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className="calendar-grid">
              {selectedMonthDays.map((cell) => {
                if (cell.empty) {
                  return <div key={cell.key} className="calendar-day calendar-day--empty" />;
                }

                const isSelected = selectedDay === cell.key;
                const isPast = cell.key < todayKey;

                return (
                  <motion.div
                    key={cell.key}
                    className={[
                      "calendar-day",
                      cell.isToday ? "calendar-day--today" : "",
                      cell.hasOverdue ? "calendar-day--overdue" : "",
                      isPast && !cell.isToday ? "calendar-day--past" : "",
                      isSelected ? "calendar-day--selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setSelectedDay(isSelected ? null : cell.key)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="calendar-day-head">
                      <strong>{cell.day}</strong>
                      {cell.tasks.length > 0 && (
                        <span
                          className={`calendar-day-count ${
                            cell.hasOverdue ? "calendar-day-count--overdue" : ""
                          }`}
                        >
                          {cell.tasks.length}
                        </span>
                      )}
                      {cell.isToday && <span className="today-dot" title="Today" />}
                    </div>

                    <div className="calendar-task-pills">
                      {cell.tasks.slice(0, 3).map((task) => {
                        const status = getDueDateStatus(cell.key, task.completed);
                        return (
                          <span
                            key={task.id}
                            className={`priority ${task.priority} ${
                              status === "overdue" ? "pill--overdue" : ""
                            } ${task.completed ? "pill--done" : ""}`}
                            title={task.title}
                          >
                            {task.completed ? "✓ " : status === "overdue" ? "⚠ " : ""}
                            {task.title}
                          </span>
                        );
                      })}
                      {cell.tasks.length > 3 && (
                        <small>+{cell.tasks.length - 3} more</small>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="calendar-legend">
              <span className="legend-item"><span className="legend-dot legend-dot--today" /> Today</span>
              <span className="legend-item"><span className="legend-dot legend-dot--overdue" /> Overdue</span>
              <span className="legend-item"><span className="legend-dot legend-dot--has-tasks" /> Has tasks</span>
            </div>
          </article>

          {/* ── Day detail panel ── */}
          <AnimatePresence>
            {selectedDay && (
              <motion.article
                className="glass-card calendar-day-detail"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                <div className="day-detail-header">
                  <h3>📅 {formatDueDate(selectedDay)}</h3>
                  <button
                    type="button"
                    className="filter-btn"
                    onClick={() => setSelectedDay(null)}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                {selectedDayTasks.length === 0 ? (
                  <p className="kanban-empty">No tasks due on this day.</p>
                ) : (
                  <div className="dashboard-list">
                    {selectedDayTasks.map((task) => {
                      const status = getDueDateStatus(task.dueDate, task.completed);
                      return (
                        <article key={task.id} className="dashboard-list-item">
                          <div>
                            <strong
                              style={{
                                textDecoration: task.completed ? "line-through" : "none",
                                opacity: task.completed ? 0.5 : 1,
                              }}
                            >
                              {task.title}
                            </strong>
                            <p>
                              {status === "overdue" && !task.completed && (
                                <span className="status-badge status-badge--overdue">Overdue</span>
                              )}
                              {status === "soon" && !task.completed && (
                                <span className="status-badge status-badge--soon">Due soon</span>
                              )}
                              {task.completed && (
                                <span className="status-badge status-badge--done">Completed</span>
                              )}
                            </p>
                          </div>
                          <span className={`priority ${task.priority}`}>{task.priority}</span>
                        </article>
                      );
                    })}
                  </div>
                )}
              </motion.article>
            )}
          </AnimatePresence>
        </div>

        {/* ── Sidebar ── */}
        <aside className="section-side">
          <article className="glass-card">
            <h3>Due This Month</h3>

            {/* Mini summary stats */}
            <div className="month-stats">
              <div className="month-stat">
                <span className="month-stat-val">{thisMonthTasks.length}</span>
                <span className="month-stat-label">Total</span>
              </div>
              <div className="month-stat">
                <span className="month-stat-val month-stat-val--overdue">
                  {thisMonthTasks.filter((t) => !t.completed && new Date(t.dueDate) < new Date(todayKey)).length}
                </span>
                <span className="month-stat-label">Overdue</span>
              </div>
              <div className="month-stat">
                <span className="month-stat-val month-stat-val--done">
                  {thisMonthTasks.filter((t) => t.completed).length}
                </span>
                <span className="month-stat-label">Done</span>
              </div>
            </div>

            <div className="dashboard-list">
              {thisMonthTasks.length === 0 && (
                <p className="kanban-empty">No tasks due this month.</p>
              )}
              {thisMonthTasks.slice(0, 12).map((task) => {
                const status = getDueDateStatus(task.dueDate, task.completed);
                return (
                  <article
                    key={task.id}
                    className={`dashboard-list-item ${
                      status === "overdue" ? "dashboard-list-item--overdue" : ""
                    }`}
                    onClick={() => setSelectedDay(task.dueDate)}
                    style={{ cursor: "pointer" }}
                  >
                    <div>
                      <strong
                        style={{
                          textDecoration: task.completed ? "line-through" : "none",
                          opacity: task.completed ? 0.55 : 1,
                        }}
                      >
                        {task.title}
                      </strong>
                      <p style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {formatDueDate(task.dueDate)}
                        {status === "overdue" && !task.completed && (
                          <span className="status-badge status-badge--overdue">Overdue</span>
                        )}
                        {status === "soon" && !task.completed && (
                          <span className="status-badge status-badge--soon">Soon</span>
                        )}
                        {task.completed && (
                          <span className="status-badge status-badge--done">✓</span>
                        )}
                      </p>
                    </div>
                    <span className={`priority ${task.priority}`}>{task.priority}</span>
                  </article>
                );
              })}
              {thisMonthTasks.length > 12 && (
                <p className="kanban-empty" style={{ textAlign: "center" }}>
                  +{thisMonthTasks.length - 12} more tasks this month
                </p>
              )}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}

export default Calendar;