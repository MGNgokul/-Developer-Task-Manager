import { useState } from "react";
import { motion } from "framer-motion";

function TaskForm({ addTask, tasks }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("appSettings")) || {};
      return saved?.tasks?.defaultPriority || "low";
    } catch {
      return "low";
    }
  });
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const normalizedTitle = title.trim();

    if (normalizedTitle.length < 3) {
      setError("Task title must be at least 3 characters.");
      return;
    }

    if (normalizedTitle.length > 80) {
      setError("Task title cannot exceed 80 characters.");
      return;
    }

    if (description.trim().length > 220) {
      setError("Description cannot exceed 220 characters.");
      return;
    }

    if (!dueDate) {
      setError("Due date is required.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(`${dueDate}T00:00:00`);
    if (selectedDate < today) {
      setError("Due date cannot be in the past.");
      return;
    }

    const isDuplicate = tasks.some(
      (task) => task.title.trim().toLowerCase() === normalizedTitle.toLowerCase()
    );
    if (isDuplicate) {
      setError("A task with this title already exists.");
      return;
    }

    addTask({
      id: crypto.randomUUID(),
      title: normalizedTitle,
      priority,
      status: "todo",
      description: description.trim(),
      dueDate,
      createdAt: new Date().toISOString(),
    });

    setTitle("");
    setDescription("");
    setDueDate("");
    setError("");
  };

  return (
    <motion.form
      className="task-form glass-card"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <h3>Create Task</h3>
      <input
        placeholder="Task Title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (error) setError("");
        }}
        maxLength={80}
      />

      <input
        type="date"
        value={dueDate}
        onChange={(e) => {
          setDueDate(e.target.value);
          if (error) setError("");
        }}
      />

      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <textarea
        placeholder="Task description (optional)"
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
          if (error) setError("");
        }}
        maxLength={220}
      />

      <button className="btn">Add Task</button>
      {error && <p className="error">{error}</p>}
    </motion.form>
  );
}

export default TaskForm;
