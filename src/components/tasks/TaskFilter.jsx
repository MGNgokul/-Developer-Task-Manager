import { motion } from "framer-motion";
import { useState } from "react";

const FILTERS = ["all", "low", "medium", "high"];

function TaskFilter({
  filter,
  setFilter,
  tasks,
  search,
  setSearch,
  tagFilter,
  setTagFilter,
  sortBy,
  setSortBy,
  savedViews,
  onSaveView,
  onApplyView,
  onDeleteView,
}) {
  const [viewName, setViewName] = useState("");
  const counts = {
    all: tasks.length,
    low: tasks.filter((task) => task.priority === "low").length,
    medium: tasks.filter((task) => task.priority === "medium").length,
    high: tasks.filter((task) => task.priority === "high").length,
  };
  const tags = Array.from(
    new Set(tasks.flatMap((task) => (Array.isArray(task.tags) ? task.tags : [])))
  ).sort((a, b) => a.localeCompare(b));

  return (
    <motion.div
      className="task-filter glass-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <h3>Filter By Priority</h3>
      <div className="task-filter-buttons">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={filter === item ? "filter-btn filter-btn--active" : "filter-btn"}
          >
            {item[0].toUpperCase() + item.slice(1)} ({counts[item]})
          </button>
        ))}
      </div>

      <div className="task-filter-controls">
        <input
          type="text"
          placeholder="Search task..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
          <option value="all">All Tags</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              #{tag}
            </option>
          ))}
        </select>

        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="due-soon">Due Soon</option>
        </select>
      </div>

      <div className="task-view-controls">
        <input
          type="text"
          placeholder="Saved view name"
          value={viewName}
          onChange={(event) => setViewName(event.target.value)}
          maxLength={40}
        />
        <button
          type="button"
          className="filter-btn"
          onClick={() => {
            const result = onSaveView ? onSaveView(viewName) : { ok: false };
            if (result?.ok) setViewName("");
          }}
        >
          Save View
        </button>
        <select onChange={(event) => event.target.value && onApplyView && onApplyView(event.target.value)}>
          <option value="">Apply saved view</option>
          {(savedViews || []).map((view) => (
            <option key={view.id} value={view.id}>
              {view.name}
            </option>
          ))}
        </select>
      </div>

      {(savedViews || []).length > 0 && (
        <div className="task-view-list">
          {savedViews.slice(0, 8).map((view) => (
            <button
              key={view.id}
              type="button"
              className="filter-btn"
              onClick={() => onDeleteView && onDeleteView(view.id)}
            >
              Delete {view.name}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default TaskFilter;
