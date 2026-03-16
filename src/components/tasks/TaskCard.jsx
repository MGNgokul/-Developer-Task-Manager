import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import useWorkspaceMembers from "../../hooks/useWorkspaceMembers";
import useAuth from "../../hooks/useAuth";

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

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${String(mins).padStart(2, "0")}m`;
  if (mins > 0) return `${mins}m ${String(secs).padStart(2, "0")}s`;
  return `${secs}s`;
}

function getRecurrenceSummary(task) {
  if (!task.recurrence || task.recurrence === "none") return "";
  const parts = [task.recurrence];
  const rule = task.recurrenceRule || {};

  if (task.recurrence === "daily" && rule.weekdaysOnly) {
    parts.push("weekdays only");
  }

  if (task.recurrence === "monthly" && rule.monthlyMode === "nth-weekday") {
    parts.push("nth weekday");
  }

  if (rule.skipHolidays) {
    parts.push("skip holidays");
  }

  return parts.join(" | ");
}

function resolveDependencies(task, allTasks) {
  const dependencies = task.dependencies || [];
  return dependencies.map((depId) => {
    const depTask = allTasks.find((item) => item.id === depId);
    return {
      id: depId,
      title: depTask?.title || "Unknown dependency",
      isDone: depTask?.status === "done",
    };
  });
}

function TaskCard({
  task,
  onMoveTask,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onStartTimer,
  onStopTimer,
  allTasks = [],
  onAddComment,
  onEditComment,
  onDeleteComment,
  draggableTask = false,
  onDragStart,
  onDragEnd,
}) {
  const members = useWorkspaceMembers();
  const { user } = useAuth();
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const [subtaskError, setSubtaskError] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [commentError, setCommentError] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [tick, setTick] = useState(Date.now());
  const assigneeName =
    members.find((member) => member.id === task.assigneeId)?.name || "Unassigned";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = task.dueDate ? new Date(`${task.dueDate}T00:00:00`) : null;
  const isOverdue = due && due < today && task.status !== "done";
  const cardClassName = [
    "task-card",
    `task-card--priority-${task.priority}`,
    isOverdue ? "task-card--overdue" : "",
    draggableTask ? "task-card--draggable" : "",
  ]
    .join(" ")
    .trim();

  const subtasks = task.subtasks || [];
  const subtaskDone = subtasks.filter((item) => item.done).length;
  const subtaskProgress = subtasks.length === 0 ? 0 : Math.round((subtaskDone / subtasks.length) * 100);
  const recurrenceSummary = getRecurrenceSummary(task);
  const resolvedDependencies = resolveDependencies(task, allTasks);
  const openDependencies = resolvedDependencies.filter((dep) => !dep.isDone);
  const comments = task.comments || [];
  const isTimerRunning = Boolean(task.timerStartedAt);
  const runningSeconds = isTimerRunning
    ? Math.max(0, Math.floor((tick - new Date(task.timerStartedAt).getTime()) / 1000))
    : 0;
  const trackedSeconds = (task.trackedSeconds || 0) + runningSeconds;

  useEffect(() => {
    if (!isTimerRunning) return undefined;
    const interval = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const addSubtask = () => {
    if (!onAddSubtask) return;
    const result = onAddSubtask(task.id, subtaskDraft);
    if (result?.ok === false) {
      setSubtaskError(result.message || "Could not add subtask.");
      return;
    }
    setSubtaskDraft("");
    setSubtaskError("");
  };

  const addComment = () => {
    if (!onAddComment) return;
    const author = user?.name || user?.email || "User";
    const result = onAddComment(task.id, commentDraft, author);
    if (result?.ok === false) {
      setCommentError(result.message || "Could not add comment.");
      return;
    }
    setCommentDraft("");
    setCommentError("");
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingDraft(comment.text);
    setCommentError("");
  };

  const saveCommentEdit = () => {
    if (!onEditComment || !editingCommentId) return;
    const result = onEditComment(task.id, editingCommentId, editingDraft);
    if (result?.ok === false) {
      setCommentError(result.message || "Could not save comment.");
      return;
    }
    setEditingCommentId(null);
    setEditingDraft("");
    setCommentError("");
  };

  const removeComment = (commentId) => {
    if (!onDeleteComment) return;
    onDeleteComment(task.id, commentId);
  };

  return (
    <motion.article
      className={cardClassName}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      draggable={draggableTask}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="task-card-head">
        <p className="task-card-title">{task.title}</p>
        <span className={`priority ${task.priority}`}>{task.priority}</span>
      </div>

      {task.description && <p className="task-card-description">{task.description}</p>}

      {Array.isArray(task.tags) && task.tags.length > 0 && (
        <div className="task-tag-list">
          {task.tags.map((tag) => (
            <span key={tag} className="task-tag-chip">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="task-card-meta">
        <span>Due: {formatDate(task.dueDate)}</span>
        <strong className={isOverdue ? "task-overdue-text" : "task-muted-text"}>
          {getDueLabel(task.dueDate, task.status)}
        </strong>
      </div>

      <p className="task-card-assignee">Assignee: {assigneeName}</p>
      <p className="task-card-time">
        Time: {formatDuration(trackedSeconds)} {isTimerRunning ? "(running)" : ""}
      </p>
      {resolvedDependencies.length > 0 && (
        <div className="task-card-dependencies">
          <p>
            Dependencies: {resolvedDependencies.length} ({openDependencies.length} open)
          </p>
          {openDependencies.length > 0 && (
            <p className="task-card-blocked">
              Blocked by: {openDependencies.map((dep) => dep.title).join(", ")}
            </p>
          )}
        </div>
      )}

      {recurrenceSummary && (
        <p className="task-card-recurrence">Repeats: {recurrenceSummary}</p>
      )}

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
        {onStartTimer && onStopTimer && (
          <button
            type="button"
            className="filter-btn"
            onClick={() => (isTimerRunning ? onStopTimer(task.id) : onStartTimer(task.id))}
          >
            {isTimerRunning ? "Stop Timer" : "Start Timer"}
          </button>
        )}
      </div>

      <div className="task-subtasks">
        <div className="task-subtasks-head">
          <strong>Checklist</strong>
          <span>{subtaskDone}/{subtasks.length} ({subtaskProgress}%)</span>
        </div>

        {subtasks.length > 0 ? (
          <ul className="task-subtask-items">
            {subtasks.map((item) => (
              <li key={item.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => onToggleSubtask && onToggleSubtask(task.id, item.id)}
                  />
                  <span className={item.done ? "task-subtask-done" : ""}>{item.text}</span>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="kanban-empty">No subtasks yet.</p>
        )}

        <div className="task-subtask-add">
          <input
            type="text"
            value={subtaskDraft}
            placeholder="Add checklist item"
            onChange={(e) => {
              setSubtaskDraft(e.target.value);
              if (subtaskError) setSubtaskError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSubtask();
              }
            }}
          />
          <button type="button" className="filter-btn" onClick={addSubtask}>
            Add
          </button>
        </div>

        {subtaskError && <p className="error">{subtaskError}</p>}
      </div>

      <div className="task-comments">
        <div className="task-comments-head">
          <strong>Comments</strong>
          <span>{comments.length}</span>
        </div>

        {comments.length === 0 ? (
          <p className="kanban-empty">No comments yet.</p>
        ) : (
          <ul className="task-comment-list">
            {comments.map((comment) => (
              <li key={comment.id}>
                <div className="task-comment-meta">
                  <strong>{comment.author}</strong>
                  <span>
                    {new Date(comment.createdAt).toLocaleString()}
                    {comment.editedAt ? " | edited" : ""}
                  </span>
                </div>
                {editingCommentId === comment.id ? (
                  <div className="task-comment-edit">
                    <input
                      type="text"
                      value={editingDraft}
                      onChange={(event) => setEditingDraft(event.target.value)}
                      maxLength={220}
                    />
                    <button type="button" className="filter-btn" onClick={saveCommentEdit}>
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditingDraft("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="task-comment-text">{comment.text}</p>
                    <div className="task-comment-actions">
                      <button type="button" className="filter-btn" onClick={() => startEditComment(comment)}>
                        Edit
                      </button>
                      <button type="button" className="btn-outline" onClick={() => removeComment(comment.id)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="task-comment-add">
          <input
            type="text"
            value={commentDraft}
            placeholder="Add a comment"
            onChange={(event) => {
              setCommentDraft(event.target.value);
              if (commentError) setCommentError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addComment();
              }
            }}
            maxLength={220}
          />
          <button type="button" className="filter-btn" onClick={addComment}>
            Add
          </button>
        </div>
        {commentError && <p className="error">{commentError}</p>}
      </div>
    </motion.article>
  );
}

export default TaskCard;
