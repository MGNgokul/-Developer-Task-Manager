import TaskCard from "../components/tasks/TaskCard";
import useTasks from "../hooks/useTasks";

function TasksCardsPage() {
  const {
    tasks,
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
          <h1>Task Cards</h1>
          <p className="dashboard-subtitle">Card view for all created tasks.</p>
        </div>
      </section>

      <section className="task-cards-grid">
        {tasks.map((task) => (
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
        {tasks.length === 0 && <p className="kanban-empty">No tasks available yet.</p>}
      </section>
    </div>
  );
}

export default TasksCardsPage;
