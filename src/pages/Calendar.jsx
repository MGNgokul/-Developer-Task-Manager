import { useContext, useMemo, useState } from "react";
import { motion } from "framer-motion";
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

  const monthTitle = currentDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

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
      cells.push({ key, day, date, tasks: dayTasks, empty: false });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ key: `empty-end-${cells.length}`, empty: true });
    }

    return cells;
  }, [currentDate, tasks]);

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

  const changeMonth = (offset) => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  return (
    <div className="analytics-page calendar-page">
      <motion.section className="glass-card calendar-header" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h2>Calendar View</h2>
          <p>See due dates by month and review upcoming deadlines quickly.</p>
        </div>
        <div className="calendar-controls">
          <button type="button" className="filter-btn" onClick={() => changeMonth(-1)}>Prev</button>
          <strong>{monthTitle}</strong>
          <button type="button" className="filter-btn" onClick={() => changeMonth(1)}>Next</button>
        </div>
      </motion.section>

      <section className="section-grid">
        <div className="section-main">
          <article className="glass-card calendar-grid-card">
            <div className="calendar-weekdays">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            <div className="calendar-grid">
              {selectedMonthDays.map((cell) => {
                if (cell.empty) {
                  return <div key={cell.key} className="calendar-day calendar-day--empty"></div>;
                }

                return (
                  <div key={cell.key} className="calendar-day">
                    <div className="calendar-day-head">
                      <strong>{cell.day}</strong>
                      {cell.tasks.length > 0 && <span>{cell.tasks.length}</span>}
                    </div>
                    <div className="calendar-task-pills">
                      {cell.tasks.slice(0, 3).map((task) => (
                        <span key={task.id} className={`priority ${task.priority}`}>
                          {task.title}
                        </span>
                      ))}
                      {cell.tasks.length > 3 && <small>+{cell.tasks.length - 3} more</small>}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </div>

        <aside className="section-side">
          <article className="glass-card">
            <h3>Due This Month</h3>
            <div className="dashboard-list">
              {thisMonthTasks.length === 0 && (
                <p className="kanban-empty">No tasks due this month.</p>
              )}
              {thisMonthTasks.slice(0, 12).map((task) => (
                <article key={task.id} className="dashboard-list-item">
                  <div>
                    <strong>{task.title}</strong>
                    <p>Due: {task.dueDate}</p>
                  </div>
                  <span className={`priority ${task.priority}`}>{task.priority}</span>
                </article>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}

export default Calendar;
