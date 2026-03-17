import { useContext, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { TaskContext } from "../context/TaskContext";
import TaskForm from "../components/tasks/TaskForm";
import TaskFilter from "../components/tasks/TaskFilter";
import KanbanBoard from "../components/tasks/KanbanBoard";
import TaskCard from "../components/tasks/TaskCard";

function Tasks() {
  const [searchParams] = useSearchParams();
  const activeSection = searchParams.get("section") || "workspace";
  const query = searchParams.get("q") || "";
  const {
    tasks,
    filteredTasks,
    kanbanTasks,
    filter,
    setFilter,
    search,
    setSearch,
    tagFilter,
    setTagFilter,
    sortBy,
    setSortBy,
    savedViews,
    saveCurrentView,
    applySavedView,
    deleteSavedView,
    addTask,
    moveTask,
    reorderTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    addComment,
    editComment,
    deleteComment,
    startTaskTimer,
    stopTaskTimer,
    clearCompleted,
    stats,
  } = useContext(TaskContext);

  useEffect(() => {
    if (!query) return;
    if (search !== query) {
      setSearch(query);
    }
  }, [query, search, setSearch]);

  const workspaceData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueSoon = tasks
      .filter((task) => task.dueDate && task.status !== "done")
      .filter((task) => {
        const due = new Date(`${task.dueDate}T00:00:00`);
        const diff = Math.floor((due - today) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 7;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    const highPriority = tasks
      .filter((task) => task.priority === "high" && task.status !== "done")
      .slice(0, 6);

    const recent = [...tasks]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    return { dueSoon, highPriority, recent };
  }, [tasks]);

  const formatDate = (dateInput) => {
    if (!dateInput) return "No date";
    const date = new Date(`${dateInput}T00:00:00`);
    return date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="dashboard-page">
      {activeSection === "workspace" && (
        <>
          <motion.section
            className="dashboard-header glass-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div>
              <h1>Tasks Workspace</h1>
              <p className="dashboard-subtitle">
                Create, filter, and move tasks across your workflow.
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
              <h3>Due This Week</h3>
              <p>{workspaceData.dueSoon.length}</p>
            </div>
            <div className="stat-card glass-card">
              <h3>Recurring</h3>
              <p>{stats.recurring}</p>
            </div>
            <div className="stat-card glass-card">
              <h3>Checklist Done</h3>
              <p>{stats.subtaskDone}/{stats.subtaskTotal}</p>
            </div>
          </motion.div>

          <section className="dashboard-local-nav">
            <Link
              className={`filter-btn dashboard-nav-btn ${activeSection === "task-form" ? "filter-btn--active" : ""}`}
              to="/tasks/form"
            >
              <span className="dashboard-nav-letter" aria-hidden="true">F</span>
              <span>Task Form</span>
            </Link>
            <Link
              className={`filter-btn dashboard-nav-btn ${activeSection === "task-filter" ? "filter-btn--active" : ""}`}
              to="/tasks/filter"
            >
              <span className="dashboard-nav-letter" aria-hidden="true">L</span>
              <span>Task Filter</span>
            </Link>
            <Link
              className={`filter-btn dashboard-nav-btn ${activeSection === "kanban-board" ? "filter-btn--active" : ""}`}
              to="/tasks/kanban"
            >
              <span className="dashboard-nav-letter" aria-hidden="true">K</span>
              <span>Kanban Board</span>
            </Link>
            <Link
              className={`filter-btn dashboard-nav-btn ${activeSection === "task-cards" ? "filter-btn--active" : ""}`}
              to="/tasks/cards"
            >
              <span className="dashboard-nav-letter" aria-hidden="true">C</span>
              <span>Task Cards</span>
            </Link>
          </section>

          <section className="section-grid">
            <div className="section-main">
              <div className="glass-card">
                <h3>Upcoming Deadlines (7 Days)</h3>
                <div className="dashboard-list">
                  {workspaceData.dueSoon.length === 0 && (
                    <p className="kanban-empty">No upcoming deadlines in the next 7 days.</p>
                  )}
                  {workspaceData.dueSoon.map((task) => (
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
                <h3>Recent Activity</h3>
                <div className="dashboard-list">
                  {workspaceData.recent.length === 0 && (
                    <p className="kanban-empty">No tasks yet. Create your first task.</p>
                  )}
                  {workspaceData.recent.map((task) => (
                    <article key={task.id} className="dashboard-list-item">
                      <div>
                        <strong>{task.title}</strong>
                        <p>
                          {task.status} | {task.priority} | {formatDate(task.createdAt?.slice(0, 10))}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <aside className="section-side">
              <div className="glass-card">
                <h3>High Priority Queue</h3>
                <div className="dashboard-list">
                  {workspaceData.highPriority.length === 0 && (
                    <p className="kanban-empty">No high-priority pending tasks.</p>
                  )}
                  {workspaceData.highPriority.map((task) => (
                    <article key={task.id} className="dashboard-list-item">
                      <div>
                        <strong>{task.title}</strong>
                        <p>Status: {task.status}</p>
                      </div>
                      <span className="priority high">high</span>
                    </article>
                  ))}
                </div>
              </div>

              <div className="glass-card">
                <h3>Workspace Tips</h3>
                <ul className="section-list">
                  <li>Create tasks with clear action-based titles</li>
                  <li>Review due-this-week tasks daily</li>
                  <li>Use recurring tasks for repeating routines</li>
                  <li>Break large work into checklist subtasks</li>
                </ul>
              </div>
            </aside>
          </section>
        </>
      )}

      {activeSection === "task-form" && (
        <section className="section-grid">
          <div className="section-main">
            <TaskForm addTask={addTask} tasks={tasks} />
          </div>
          <aside className="section-side">
            <div className="glass-card">
              <h3>
                <span className="card-icon" aria-hidden="true">F</span>
                Form Guide
              </h3>
              <p className="dashboard-subtitle">
                Create clear tasks with a short title and a realistic due date.
              </p>
              <ul className="section-list">
                <li>Use recurrence for repeated work</li>
                <li>Add checklist items for task progress</li>
                <li>Pick a due date to track urgency</li>
              </ul>
            </div>
          </aside>
        </section>
      )}

      {activeSection === "task-filter" && (
        <section className="section-grid">
          <div className="section-main">
            <TaskFilter
              filter={filter}
              setFilter={setFilter}
              tasks={tasks}
              search={search}
              setSearch={setSearch}
              tagFilter={tagFilter}
              setTagFilter={setTagFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              savedViews={savedViews}
              onSaveView={saveCurrentView}
              onApplyView={applySavedView}
              onDeleteView={deleteSavedView}
            />
            <div className="glass-card">
              <h3>Filtered Results</h3>
              <p className="dashboard-subtitle">
                Results update as you change priority, search, and sorting.
              </p>
              <div className="task-cards-grid">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onMoveTask={moveTask}
                    onDeleteTask={deleteTask}
                    onAddSubtask={addSubtask}
                    onToggleSubtask={toggleSubtask}
                    onStartTimer={startTaskTimer}
                    onStopTimer={stopTaskTimer}
                    allTasks={tasks}
                    onAddComment={addComment}
                    onEditComment={editComment}
                    onDeleteComment={deleteComment}
                  />
                ))}
                {filteredTasks.length === 0 && (
                  <p className="kanban-empty">No tasks match current filter.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {activeSection === "kanban-board" && (
        <section className="section-grid">
          <div className="section-main">
            <KanbanBoard
              tasks={kanbanTasks}
              onMoveTask={moveTask}
              onReorderTask={reorderTask}
              onDeleteTask={deleteTask}
              onAddSubtask={addSubtask}
              onToggleSubtask={toggleSubtask}
              onStartTimer={startTaskTimer}
              onStopTimer={stopTaskTimer}
              allTasks={tasks}
              onAddComment={addComment}
              onEditComment={editComment}
              onDeleteComment={deleteComment}
            />
          </div>
        </section>
      )}

      {activeSection === "task-cards" && (
        <section className="section-grid">
          <div className="section-main">
            <div className="glass-card">
              <h3>Task Cards</h3>
              <p className="dashboard-subtitle">Card view for all created tasks.</p>
              <div className="task-cards-grid task-cards-grid--premium">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onMoveTask={moveTask}
                    onDeleteTask={deleteTask}
                    onAddSubtask={addSubtask}
                    onToggleSubtask={toggleSubtask}
                    onStartTimer={startTaskTimer}
                    onStopTimer={stopTaskTimer}
                    allTasks={tasks}
                    onAddComment={addComment}
                    onEditComment={editComment}
                    onDeleteComment={deleteComment}
                  />
                ))}
                {filteredTasks.length === 0 && <p className="kanban-empty">No tasks available yet.</p>}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="dashboard-actions">
        <button
          type="button"
          className="btn-outline"
          onClick={clearCompleted}
          disabled={stats.completed === 0}
        >
          Clear Completed Tasks
        </button>
      </div>
    </div>
  );
}

export default Tasks;
