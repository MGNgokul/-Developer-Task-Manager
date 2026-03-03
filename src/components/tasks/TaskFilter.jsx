import { motion } from "framer-motion";

const FILTERS = ["all", "low", "medium", "high"];

function TaskFilter({
  filter,
  setFilter,
  tasks,
  search,
  setSearch,
  sortBy,
  setSortBy,
}) {
  const counts = {
    all: tasks.length,
    low: tasks.filter((task) => task.priority === "low").length,
    medium: tasks.filter((task) => task.priority === "medium").length,
    high: tasks.filter((task) => task.priority === "high").length,
  };

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

        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="due-soon">Due Soon</option>
        </select>
      </div>
    </motion.div>
  );
}

export default TaskFilter;
