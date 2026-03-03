import KanbanBoard from "../components/tasks/KanbanBoard";
import useTasks from "../hooks/useTasks";

function TasksKanbanPage() {
  const { filteredTasks, moveTask, deleteTask, stats } = useTasks();

  return (
    <div className="dashboard-page">
      <section className="dashboard-header glass-card">
        <div>
          <h1>Kanban Board</h1>
          <p className="dashboard-subtitle">Manage status across workflow columns.</p>
        </div>
        <div className="progress-badge">
          <strong>{stats.progress}%</strong>
          <span>Completion</span>
        </div>
      </section>

      <KanbanBoard tasks={filteredTasks} onMoveTask={moveTask} onDeleteTask={deleteTask} />
    </div>
  );
}

export default TasksKanbanPage;
