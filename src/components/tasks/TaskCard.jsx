import { motion } from "framer-motion";

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "inprogress", label: "In Progress" },
  { value: "done", label: "Done" },
];

function formatDate(dateInput) {
  if (!dateInput) return "No due date";
  const date = new Date(`${dateInput}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDueLabel(dateInput, status) {
  if (!dateInput) return "No deadline";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dateInput}T00:00:00`);
  const diff = Math.floor((due - today) / (1000 * 60 * 60 * 24));

  if (status === "done") return "Completed";
  if (diff < 0) return `${Math.abs(diff)} day(s) late`;
  if (diff === 0) return "Due today";
  return `${diff} day(s) left`;
}

function TaskCard({ task, onMoveTask, onDeleteTask }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = task.dueDate ? new Date(`${task.dueDate}T00:00:00`) : null;
  const isOverdue = due && due < today && task.status !== "done";
  const cardClassName = [
    "task-card",
    `task-card--priority-${task.priority}`,
    isOverdue ? "task-card--overdue" : "",
  ]
    .join(" ")
    .trim();

  return (
    <motion.article
      className={cardClassName}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="task-card-head">
        <p className="task-card-title">{task.title}</p>
        <span className={`priority ${task.priority}`}>{task.priority}</span>
      </div>

      {task.description && <p className="task-card-description">{task.description}</p>}

      <div className="task-card-meta">
        <span>Due: {formatDate(task.dueDate)}</span>
        <strong className={isOverdue ? "task-overdue-text" : "task-muted-text"}>
          {getDueLabel(task.dueDate, task.status)}
        </strong>
      </div>

      <div className="task-card-actions">
        <select value={task.status} onChange={(e) => onMoveTask(task.id, e.target.value)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="task-delete-btn"
          onClick={() => onDeleteTask(task.id)}
        >
          Delete
        </button>
      </div>
    </motion.article>
  );
}

export default TaskCard;
