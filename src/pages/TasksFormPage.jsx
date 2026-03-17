import { useContext } from "react";
import TaskForm from "../components/tasks/TaskForm";
import { TaskContext } from "../context/TaskContext";

function TasksFormPage() {
  const { tasks, addTask, stats } = useContext(TaskContext);

  return (
    <div className="dashboard-page">
      <section className="dashboard-header glass-card">
        <div>
          <h1>Task Form</h1>
          <p className="dashboard-subtitle">Create validated tasks quickly.</p>
        </div>
        <div className="progress-badge">
          <strong>{stats.total}</strong>
          <span>Total Tasks</span>
        </div>
      </section>

      <TaskForm addTask={addTask} tasks={tasks} />
    </div>
  );
}

export default TasksFormPage;
