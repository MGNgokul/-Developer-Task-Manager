import { useContext } from "react";
import KanbanBoard from "../components/tasks/KanbanBoard";
import { TaskContext } from "../context/TaskContext";

function TasksKanbanPage() {
  const { filteredTasks, moveTask, deleteTask, stats } = useContext(TaskContext);

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
