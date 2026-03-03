import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import Column from "./Column";

const COLUMNS = [
  { key: "todo", label: "To Do", limit: 12, guidance: "Queue ready items only." },
  { key: "inprogress", label: "In Progress", limit: 5, guidance: "Keep WIP focused." },
  { key: "done", label: "Done", limit: null, guidance: "Completed and reviewed work." },
];

const ALLOWED_TRANSITIONS = {
  todo: ["inprogress"],
  inprogress: ["todo", "done"],
  done: ["inprogress"],
};

function getBoardChecks(tasks) {
  const titleMap = new Map();
  const issues = [];

  tasks.forEach((task) => {
    const normalizedTitle = task.title.trim().toLowerCase();
    if (normalizedTitle) {
      const seen = titleMap.get(normalizedTitle) || [];
      seen.push(task.id);
      titleMap.set(normalizedTitle, seen);
    }
  });

  titleMap.forEach((ids, title) => {
    if (ids.length > 1) {
      issues.push({
        type: "error",
        message: `Duplicate title found: "${title}" (${ids.length} tasks).`,
      });
    }
  });

  const overdueCount = tasks.filter((task) => {
    if (!task.dueDate || task.status === "done") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(`${task.dueDate}T00:00:00`) < today;
  }).length;

  if (overdueCount > 0) {
    issues.push({
      type: "warning",
      message: `${overdueCount} task(s) are overdue and still open.`,
    });
  }

  COLUMNS.forEach((column) => {
    if (!column.limit) return;
    const count = tasks.filter((task) => task.status === column.key).length;
    if (count > column.limit) {
      issues.push({
        type: "error",
        message: `${column.label} exceeds limit (${count}/${column.limit}).`,
      });
    }
  });

  return issues;
}

function KanbanBoard({ tasks, onMoveTask, onDeleteTask }) {
  const [actionError, setActionError] = useState("");
  const getColumnTasks = (column) => tasks.filter((task) => task.status === column);
  const boardChecks = useMemo(() => getBoardChecks(tasks), [tasks]);

  const columnCounts = useMemo(
    () =>
      COLUMNS.reduce((acc, column) => {
        acc[column.key] = getColumnTasks(column.key).length;
        return acc;
      }, {}),
    [tasks]
  );

  const handleMoveTask = (taskId, nextStatus) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      setActionError("Could not move task. Task no longer exists.");
      return;
    }

    if (task.status === nextStatus) {
      setActionError("");
      return;
    }

    const allowedNext = ALLOWED_TRANSITIONS[task.status] || [];
    if (!allowedNext.includes(nextStatus)) {
      setActionError("Invalid move: follow workflow To Do -> In Progress -> Done.");
      return;
    }

    const targetColumn = COLUMNS.find((column) => column.key === nextStatus);
    if (targetColumn?.limit && columnCounts[nextStatus] >= targetColumn.limit) {
      setActionError(`${targetColumn.label} limit reached (${targetColumn.limit}).`);
      return;
    }

    const result = onMoveTask(taskId, nextStatus);
    if (result?.ok === false) {
      setActionError(result.message || "Unable to move task.");
      return;
    }

    setActionError("");
  };

  return (
    <motion.div
      className="kanban-wrap"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      <section className="glass-card kanban-validation">
        <div className="kanban-validation-head">
          <h3>Board Validation</h3>
          <span className={boardChecks.length === 0 ? "kanban-pass" : "kanban-fail"}>
            {boardChecks.length === 0 ? "Healthy" : `${boardChecks.length} issue(s)`}
          </span>
        </div>
        {actionError && <p className="kanban-action-error">{actionError}</p>}
        {boardChecks.length === 0 ? (
          <p className="kanban-empty">No blocking validation issues right now.</p>
        ) : (
          <ul className="kanban-validation-list">
            {boardChecks.map((issue, index) => (
              <li key={`${issue.type}-${index}`} className={`kanban-validation-${issue.type}`}>
                {issue.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="kanban">
      {COLUMNS.map((column) => {
        const columnTasks = getColumnTasks(column.key);
        return (
          <Column
            key={column.key}
            title={column.label}
            count={columnTasks.length}
            limit={column.limit}
            guidance={column.guidance}
            isLimitExceeded={Boolean(column.limit && columnTasks.length > column.limit)}
            tasks={columnTasks}
            onMoveTask={handleMoveTask}
            onDeleteTask={onDeleteTask}
          />
        );
      })}
      </div>
    </motion.div>
  );
}

export default KanbanBoard;
