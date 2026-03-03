import { useEffect, useMemo, useState } from "react";

const VALID_STATUS = ["todo", "inprogress", "done"];
const VALID_PRIORITY = ["low", "medium", "high"];

function normalizeTask(task) {
  const title = String(task?.title || "").trim();
  if (!title) return null;

  return {
    id: task?.id || crypto.randomUUID(),
    title,
    priority: VALID_PRIORITY.includes(task?.priority) ? task.priority : "medium",
    status: VALID_STATUS.includes(task?.status) ? task.status : "todo",
    description: String(task?.description || "").trim(),
    dueDate: task?.dueDate || "",
    createdAt: task?.createdAt || new Date().toISOString(),
  };
}

function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("tasks")) || [];
      const normalized = Array.isArray(saved)
        ? saved.map(normalizeTask).filter(Boolean)
        : [];
      setTasks(normalized);
    } catch {
      setTasks([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (task) => setTasks((prev) => [task, ...prev]);
  const moveTask = (id, status) => {
    if (!VALID_STATUS.includes(status)) {
      return { ok: false, message: "Invalid status selected." };
    }

    const taskExists = tasks.some((task) => task.id === id);
    if (!taskExists) {
      return { ok: false, message: "Task not found." };
    }

    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status } : task)));
    return { ok: true };
  };
  const deleteTask = (id) => setTasks((prev) => prev.filter((task) => task.id !== id));
  const clearCompleted = () => setTasks((prev) => prev.filter((task) => task.status !== "done"));

  const filteredTasks = useMemo(() => {
    const byPriority = filter === "all" ? tasks : tasks.filter((task) => task.priority === filter);
    const query = search.trim().toLowerCase();
    const bySearch = query
      ? byPriority.filter(
          (task) =>
            task.title.toLowerCase().includes(query) ||
            task.description.toLowerCase().includes(query)
        )
      : byPriority;

    return [...bySearch].sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "due-soon") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [tasks, filter, search, sortBy]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "done").length;
    const pending = total - completed;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, pending, progress };
  }, [tasks]);

  return {
    tasks,
    filteredTasks,
    filter,
    setFilter,
    search,
    setSearch,
    sortBy,
    setSortBy,
    addTask,
    moveTask,
    deleteTask,
    clearCompleted,
    stats,
  };
}

export default useTasks;
