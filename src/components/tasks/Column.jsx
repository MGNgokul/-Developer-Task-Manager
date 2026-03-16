import TaskCard from "./TaskCard";

function Column({
  title,
  count,
  limit,
  guidance,
  isLimitExceeded,
  tasks,
  onMoveTask,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onStartTimer,
  onStopTimer,
  allTasks,
  onAddComment,
  onEditComment,
  onDeleteComment,
  columnKey,
  onTaskDragStart,
  onTaskDragEnd,
  onTaskDrop,
  draggedTaskId,
}) {
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
        <div
          className="kanban-drop-zone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            onTaskDrop && onTaskDrop(columnKey, null);
          }}
        >
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`kanban-task-drop-target ${draggedTaskId === task.id ? "kanban-task-drop-target--dragging" : ""}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                onTaskDrop && onTaskDrop(columnKey, task.id);
              }}
            >
              <TaskCard
                task={task}
                onMoveTask={onMoveTask}
                onDeleteTask={onDeleteTask}
                onAddSubtask={onAddSubtask}
                onToggleSubtask={onToggleSubtask}
                onStartTimer={onStartTimer}
                onStopTimer={onStopTimer}
                allTasks={allTasks}
                onAddComment={onAddComment}
                onEditComment={onEditComment}
                onDeleteComment={onDeleteComment}
                draggableTask
                onDragStart={() => onTaskDragStart && onTaskDragStart(task.id)}
                onDragEnd={() => onTaskDragEnd && onTaskDragEnd()}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Column;
