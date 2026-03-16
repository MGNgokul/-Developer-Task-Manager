import TaskFilter from "../components/tasks/TaskFilter";
import TaskCard from "../components/tasks/TaskCard";
import useTasks from "../hooks/useTasks";

function TasksFilterPage() {
  const {
    tasks,
    filteredTasks,
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
    moveTask,
    deleteTask,
    startTaskTimer,
    stopTaskTimer,
    addComment,
    editComment,
    deleteComment,
  } = useTasks();

  return (
    <div className="dashboard-page">
      <section className="dashboard-header glass-card">
        <div>
          <h1>Task Filter</h1>
          <p className="dashboard-subtitle">Filter, search, and sort tasks.</p>
        </div>
      </section>

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

      <section className="task-cards-grid">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onMoveTask={moveTask}
            onDeleteTask={deleteTask}
            onStartTimer={startTaskTimer}
            onStopTimer={stopTaskTimer}
            allTasks={tasks}
            onAddComment={addComment}
            onEditComment={editComment}
            onDeleteComment={deleteComment}
          />
        ))}
        {filteredTasks.length === 0 && <p className="kanban-empty">No tasks match current filter.</p>}
      </section>
    </div>
  );
}

export default TasksFilterPage;
