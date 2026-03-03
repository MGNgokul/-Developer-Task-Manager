import TaskCard from "./TaskCard";

function Column({ title, count, limit, guidance, isLimitExceeded, tasks, onMoveTask, onDeleteTask }) {
  return (
    <div className={`glass-card kanban-column ${isLimitExceeded ? "kanban-column--invalid" : ""}`}>
      <div className="kanban-column-header">
        <h3>{title}</h3>
        <span>{limit ? `${count}/${limit}` : count}</span>
      </div>
      {guidance && <p className="kanban-column-guidance">{guidance}</p>}
      {tasks.length === 0 ? (
        <p className="kanban-empty">No tasks here yet.</p>
      ) : (
        tasks.map((task) => (
          <TaskCard key={task.id} task={task} onMoveTask={onMoveTask} onDeleteTask={onDeleteTask} />
        ))
      )}
    </div>
  );
}

export default Column;
