import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import useWorkspaceMembers from "../../hooks/useWorkspaceMembers";
import { getTaskAssistInsights } from "../../utils/taskAssist";

const RECURRENCE_OPTIONS = [
  { value: "none", label: "No Repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const TEMPLATE_KEY = "taskTemplates";

function loadTemplates() {
  try {
    const saved = JSON.parse(localStorage.getItem(TEMPLATE_KEY)) || [];
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTemplates(list) {
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(list));
}

function TaskForm({ addTask, tasks }) {
  const members = useWorkspaceMembers();
  const appSettings = (() => {
    try {
      return JSON.parse(localStorage.getItem("appSettings")) || {};
    } catch {
      return {};
    }
  })();
  const defaultHolidayDates = Array.isArray(appSettings?.tasks?.holidayDates)
    ? appSettings.tasks.holidayDates
    : [];
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const [subtasks, setSubtasks] = useState([]);
  const [tagDraft, setTagDraft] = useState("");
  const [tags, setTags] = useState([]);
  const [dependencyDraft, setDependencyDraft] = useState("");
  const [dependencies, setDependencies] = useState([]);
  const [assigneeId, setAssigneeId] = useState("unassigned");
  const [weekdaysOnly, setWeekdaysOnly] = useState(false);
  const [skipHolidays, setSkipHolidays] = useState(false);
  const [monthlyMode, setMonthlyMode] = useState("same-date");
  const [priority, setPriority] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("appSettings")) || {};
      return saved?.tasks?.defaultPriority || "low";
    } catch {
      return "low";
    }
  });
  const [templates, setTemplates] = useState(() => loadTemplates());
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [error, setError] = useState("");
  const assist = useMemo(
    () =>
      getTaskAssistInsights({
        title,
        description,
        dueDate,
        subtasks,
        dependencies,
        priority,
      }),
    [title, description, dueDate, subtasks, dependencies, priority]
  );

  const pushSubtask = () => {
    const text = subtaskDraft.trim();
    if (!text) return;
    if (subtasks.some((item) => item.text.toLowerCase() === text.toLowerCase())) {
      setError("Subtask already exists.");
      return;
    }

    setSubtasks((prev) => [...prev, { id: crypto.randomUUID(), text, done: false }]);
    setSubtaskDraft("");
    if (error) setError("");
  };

  const removeSubtask = (id) => {
    setSubtasks((prev) => prev.filter((item) => item.id !== id));
  };

  const addTag = () => {
    const normalized = tagDraft.trim().toLowerCase();
    if (!normalized) return;
    if (tags.includes(normalized)) return;
    if (tags.length >= 8) {
      setError("Maximum 8 tags allowed.");
      return;
    }
    setTags((prev) => [...prev, normalized]);
    setTagDraft("");
  };

  const removeTag = (tag) => {
    setTags((prev) => prev.filter((item) => item !== tag));
  };

  const addDependency = () => {
    if (!dependencyDraft) return;
    if (dependencies.includes(dependencyDraft)) return;
    setDependencies((prev) => [...prev, dependencyDraft]);
    setDependencyDraft("");
  };

  const removeDependency = (id) => {
    setDependencies((prev) => prev.filter((item) => item !== id));
  };

  const dependencyCandidates = tasks.filter((task) => !dependencies.includes(task.id));

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

    const result = addTask({
      id: crypto.randomUUID(),
      title: normalizedTitle,
      priority,
      status: "todo",
      recurrence,
      recurrenceRule: {
        weekdaysOnly,
        skipHolidays,
        monthlyMode,
        holidayDates: skipHolidays ? defaultHolidayDates : [],
      },
      description: description.trim(),
      assigneeId: assigneeId === "unassigned" ? null : assigneeId,
      tags,
      dependencies,
      dueDate,
      subtasks,
      createdAt: new Date().toISOString(),
    });

    if (result?.ok === false) {
      setError(result.message || "Could not add task.");
      return;
    }

    setTitle("");
    setDescription("");
    setDueDate("");
    setRecurrence("none");
    setSubtaskDraft("");
    setSubtasks([]);
    setTagDraft("");
    setTags([]);
    setDependencyDraft("");
    setDependencies([]);
    setAssigneeId("unassigned");
    setWeekdaysOnly(false);
    setSkipHolidays(false);
    setMonthlyMode("same-date");
    setError("");
  };

  const applyTemplate = (templateId) => {
    const selected = templates.find((template) => template.id === templateId);
    if (!selected) return;

    setTitle(selected.title || "");
    setDescription(selected.description || "");
    setPriority(selected.priority || "medium");
    setRecurrence(selected.recurrence || "none");
    setWeekdaysOnly(Boolean(selected.recurrenceRule?.weekdaysOnly));
    setSkipHolidays(Boolean(selected.recurrenceRule?.skipHolidays));
    setMonthlyMode(selected.recurrenceRule?.monthlyMode || "same-date");
    setSubtasks(
      Array.isArray(selected.subtasks)
        ? selected.subtasks.map((item) => ({
            id: crypto.randomUUID(),
            text: String(item.text || "").trim(),
            done: false,
          }))
        : []
    );
    setDependencies([]);

    if (Number.isFinite(selected.dueInDays) && selected.dueInDays >= 0) {
      const due = new Date();
      due.setHours(0, 0, 0, 0);
      due.setDate(due.getDate() + Number(selected.dueInDays));
      setDueDate(due.toISOString().slice(0, 10));
    } else {
      setDueDate("");
    }
  };

  const saveCurrentAsTemplate = () => {
    const name = templateName.trim();
    if (!name) {
      setError("Template name is required.");
      return;
    }
    if (title.trim().length < 3) {
      setError("Add task title before saving template.");
      return;
    }

    let dueInDays = null;
    if (dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(`${dueDate}T00:00:00`);
      const diff = Math.floor((selected - today) / (1000 * 60 * 60 * 24));
      dueInDays = diff >= 0 ? diff : null;
    }

    const nextTemplate = {
      id: crypto.randomUUID(),
      name,
      title: title.trim(),
      description: description.trim(),
      priority,
      recurrence,
      recurrenceRule: {
        weekdaysOnly,
        skipHolidays,
        monthlyMode,
      },
      dueInDays,
      subtasks: subtasks.map((item) => ({ text: item.text })),
      createdAt: new Date().toISOString(),
    };

    const nextTemplates = [nextTemplate, ...templates].slice(0, 20);
    setTemplates(nextTemplates);
    saveTemplates(nextTemplates);
    setTemplateName("");
    setError("");
  };

  const removeTemplate = () => {
    if (!selectedTemplateId) return;
    const next = templates.filter((template) => template.id !== selectedTemplateId);
    setTemplates(next);
    saveTemplates(next);
    setSelectedTemplateId("");
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
      <div className="task-template-controls">
        <select
          value={selectedTemplateId}
          onChange={(e) => {
            setSelectedTemplateId(e.target.value);
            if (e.target.value) applyTemplate(e.target.value);
          }}
        >
          <option value="">Apply template</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Template name"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          maxLength={60}
        />
        <button type="button" className="filter-btn" onClick={saveCurrentAsTemplate}>
          Save Template
        </button>
        <button type="button" className="btn-outline" onClick={removeTemplate} disabled={!selectedTemplateId}>
          Delete Template
        </button>
      </div>

      <input
        placeholder="Task Title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (error) setError("");
        }}
        maxLength={80}
      />

      <div className="task-assist-card">
        <div className="task-assist-head">
          <strong>Assist</strong>
          <span>Clarity {assist.clarityScore}/100</span>
        </div>
        <p className="task-assist-priority">
          Suggested priority: <strong>{assist.suggestedPriority}</strong>
        </p>
        <button
          type="button"
          className="filter-btn"
          onClick={() => setPriority(assist.suggestedPriority)}
          disabled={priority === assist.suggestedPriority}
        >
          Apply Suggested Priority
        </button>
        <ul className="task-assist-list">
          {assist.hints.slice(0, 3).map((hint, index) => (
            <li key={`${hint}-${index}`}>{hint}</li>
          ))}
          {assist.hints.length === 0 && <li>Looks clear and execution-ready.</li>}
        </ul>
      </div>

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

      <select
        value={recurrence}
        onChange={(e) => setRecurrence(e.target.value)}
      >
        {RECURRENCE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {recurrence !== "none" && (
        <div className="task-recurrence-advanced">
          {recurrence === "daily" && (
            <label>
              <input
                type="checkbox"
                checked={weekdaysOnly}
                onChange={(e) => setWeekdaysOnly(e.target.checked)}
              />
              Weekdays only
            </label>
          )}

          {recurrence === "monthly" && (
            <label>
              Monthly mode
              <select value={monthlyMode} onChange={(e) => setMonthlyMode(e.target.value)}>
                <option value="same-date">Same date each month</option>
                <option value="nth-weekday">Nth weekday each month</option>
              </select>
            </label>
          )}

          <label>
            <input
              type="checkbox"
              checked={skipHolidays}
              onChange={(e) => setSkipHolidays(e.target.checked)}
            />
            Skip holiday dates
          </label>
          {skipHolidays && defaultHolidayDates.length === 0 && (
            <p className="task-form-note">No holiday dates set in Settings. Add them under Task Defaults.</p>
          )}
        </div>
      )}

      <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
        <option value="unassigned">Unassigned</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name} ({member.role})
          </option>
        ))}
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

      <div className="task-subtasks-input">
        <input
          type="text"
          placeholder="Add subtask"
          value={subtaskDraft}
          onChange={(e) => setSubtaskDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              pushSubtask();
            }
          }}
          maxLength={80}
        />
        <button type="button" className="filter-btn" onClick={pushSubtask}>
          Add Subtask
        </button>
      </div>

      <div className="task-subtasks-input">
        <input
          type="text"
          placeholder="Add tag (e.g. frontend)"
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          maxLength={30}
        />
        <button type="button" className="filter-btn" onClick={addTag}>
          Add Tag
        </button>
      </div>

      {tags.length > 0 && (
        <ul className="task-subtasks-list">
          {tags.map((tag) => (
            <li key={tag}>
              <span>#{tag}</span>
              <button type="button" className="close-btn" onClick={() => removeTag(tag)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="task-subtasks-input">
        <select value={dependencyDraft} onChange={(e) => setDependencyDraft(e.target.value)}>
          <option value="">Add dependency</option>
          {dependencyCandidates.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
        <button type="button" className="filter-btn" onClick={addDependency}>
          Add Dependency
        </button>
      </div>

      {dependencies.length > 0 && (
        <ul className="task-subtasks-list">
          {dependencies.map((depId) => {
            const depTask = tasks.find((task) => task.id === depId);
            return (
              <li key={depId}>
                <span>{depTask?.title || "Unknown task"}</span>
                <button type="button" className="close-btn" onClick={() => removeDependency(depId)}>
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {subtasks.length > 0 && (
        <ul className="task-subtasks-list">
          {subtasks.map((item) => (
            <li key={item.id}>
              <span>{item.text}</span>
              <button type="button" className="close-btn" onClick={() => removeSubtask(item.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <button className="btn">Add Task</button>
      {error && <p className="error">{error}</p>}
    </motion.form>
  );
}

export default TaskForm;
