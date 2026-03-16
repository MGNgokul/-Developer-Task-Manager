import { useEffect, useMemo, useState } from "react";
import { loadWorkspaceMembers } from "../utils/workspace";

const VALID_STATUS = ["todo", "inprogress", "done"];
const VALID_PRIORITY = ["low", "medium", "high"];
const VALID_RECURRENCE = ["none", "daily", "weekly", "monthly"];
const VALID_MONTHLY_MODES = ["same-date", "nth-weekday"];
const AUTO_BACKUP_LIST_KEY = "taskAutoBackups";
const AUTO_BACKUP_LAST_KEY = "taskAutoBackupLastAt";
const AUDIT_LOG_KEY = "taskAuditLog";
const SAVED_VIEWS_KEY = "taskSavedViews";

function normalizeSlaConfig(config) {
  const hours = config?.hoursByPriority || {};
  return {
    enabled: config?.enabled ?? false,
    hoursByPriority: {
      low: Number.isFinite(hours.low) ? Math.max(1, Number(hours.low)) : 72,
      medium: Number.isFinite(hours.medium) ? Math.max(1, Number(hours.medium)) : 48,
      high: Number.isFinite(hours.high) ? Math.max(1, Number(hours.high)) : 24,
    },
  };
}

function normalizeWorkloadConfig(config) {
  const capacities = config?.capacitiesByMemberId || {};
  return {
    defaultCapacityHours: Number.isFinite(config?.defaultCapacityHours)
      ? Math.max(1, Number(config.defaultCapacityHours))
      : 40,
    capacitiesByMemberId:
      capacities && typeof capacities === "object" ? capacities : {},
  };
}

function normalizeHolidayDates(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) => String(item || "").trim())
        .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item))
    )
  );
}

function normalizeRecurrenceRule(rule) {
  return {
    weekdaysOnly: Boolean(rule?.weekdaysOnly),
    skipHolidays: Boolean(rule?.skipHolidays),
    monthlyMode: VALID_MONTHLY_MODES.includes(rule?.monthlyMode)
      ? rule.monthlyMode
      : "same-date",
    holidayDates: normalizeHolidayDates(rule?.holidayDates),
  };
}

function normalizeSubtask(subtask) {
  const text = String(subtask?.text || "").trim();
  if (!text) return null;

  return {
    id: subtask?.id || crypto.randomUUID(),
    text,
    done: Boolean(subtask?.done),
  };
}

function normalizeTimeEntry(entry) {
  const startedAt = entry?.startedAt || null;
  const stoppedAt = entry?.stoppedAt || null;
  const seconds = Number(entry?.seconds);
  if (!startedAt || !Number.isFinite(seconds) || seconds < 0) return null;
  return {
    startedAt,
    stoppedAt,
    seconds,
    day: String(entry?.day || startedAt.slice(0, 10)),
  };
}

function normalizeDependencies(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  );
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) => String(item || "").trim().toLowerCase())
        .filter(Boolean)
    )
  ).slice(0, 8);
}

function normalizeComment(comment) {
  const text = String(comment?.text || "").trim();
  if (!text) return null;
  return {
    id: comment?.id || crypto.randomUUID(),
    text,
    author: String(comment?.author || "User").trim() || "User",
    createdAt: comment?.createdAt || new Date().toISOString(),
    editedAt: comment?.editedAt || null,
    history: Array.isArray(comment?.history) ? comment.history : [],
  };
}

function normalizeTask(task) {
  const title = String(task?.title || "").trim();
  if (!title) return null;

  const subtasks = Array.isArray(task?.subtasks)
    ? task.subtasks.map(normalizeSubtask).filter(Boolean)
    : [];
  const comments = Array.isArray(task?.comments)
    ? task.comments.map(normalizeComment).filter(Boolean)
    : [];
  const timeEntries = Array.isArray(task?.timeEntries)
    ? task.timeEntries.map(normalizeTimeEntry).filter(Boolean)
    : [];
  const trackedSeconds = Number.isFinite(task?.trackedSeconds)
    ? Math.max(0, Number(task.trackedSeconds))
    : 0;

  return {
    id: task?.id || crypto.randomUUID(),
    title,
    assigneeId: task?.assigneeId || null,
    tags: normalizeTags(task?.tags),
    dependencies: normalizeDependencies(task?.dependencies),
    order: Number.isFinite(task?.order) ? Number(task.order) : Date.now(),
    priority: VALID_PRIORITY.includes(task?.priority) ? task.priority : "medium",
    status: VALID_STATUS.includes(task?.status) ? task.status : "todo",
    recurrence: VALID_RECURRENCE.includes(task?.recurrence) ? task.recurrence : "none",
    recurrenceRule: normalizeRecurrenceRule(task?.recurrenceRule),
    recurrenceSourceId: task?.recurrenceSourceId || null,
    description: String(task?.description || "").trim(),
    dueDate: task?.dueDate || "",
    subtasks,
    createdAt: task?.createdAt || new Date().toISOString(),
    completedAt: task?.completedAt || null,
    deletedAt: task?.deletedAt || null,
    trackedSeconds,
    timerStartedAt: task?.timerStartedAt || null,
    timeEntries,
    comments,
  };
}

function isWeekend(date) {
  const weekday = date.getDay();
  return weekday === 0 || weekday === 6;
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function getNthWeekdayInfo(date) {
  return {
    weekday: date.getDay(),
    nth: Math.floor((date.getDate() - 1) / 7) + 1,
  };
}

function getDateForNthWeekday(year, month, weekday, nth) {
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekdayOffset = (7 + weekday - firstOfMonth.getDay()) % 7;
  let day = 1 + firstWeekdayOffset + (nth - 1) * 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  while (day > daysInMonth) day -= 7;
  return new Date(year, month, day);
}

function alignForRules(date, recurrenceRule) {
  const next = new Date(date);
  const holidaySet = new Set(recurrenceRule?.holidayDates || []);
  const shouldSkipWeekends = Boolean(recurrenceRule?.weekdaysOnly);
  const shouldSkipHolidays = Boolean(recurrenceRule?.skipHolidays);

  let guard = 0;
  while (guard < 90) {
    const iso = toIsoDate(next);
    const blockedByWeekend = shouldSkipWeekends && isWeekend(next);
    const blockedByHoliday = shouldSkipHolidays && holidaySet.has(iso);
    if (!blockedByWeekend && !blockedByHoliday) break;
    next.setDate(next.getDate() + 1);
    guard += 1;
  }

  return next;
}

function getNextDueDate(dueDate, recurrence, recurrenceRule = normalizeRecurrenceRule()) {
  if (!dueDate || recurrence === "none") return "";

  const next = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(next.getTime())) return "";

  if (recurrence === "daily") {
    next.setDate(next.getDate() + 1);
  }

  if (recurrence === "weekly") {
    next.setDate(next.getDate() + 7);
  }

  if (recurrence === "monthly") {
    if (recurrenceRule.monthlyMode === "nth-weekday") {
      const source = new Date(`${dueDate}T00:00:00`);
      const { weekday, nth } = getNthWeekdayInfo(source);
      const targetMonth = source.getMonth() + 1;
      const targetYear = source.getFullYear() + Math.floor(targetMonth / 12);
      const month = targetMonth % 12;
      const monthlyDate = getDateForNthWeekday(targetYear, month, weekday, nth);
      next.setTime(monthlyDate.getTime());
    } else {
      const source = new Date(`${dueDate}T00:00:00`);
      const targetMonth = source.getMonth() + 1;
      const targetYear = source.getFullYear() + Math.floor(targetMonth / 12);
      const month = targetMonth % 12;
      const daysInMonth = new Date(targetYear, month + 1, 0).getDate();
      const day = Math.min(source.getDate(), daysInMonth);
      next.setFullYear(targetYear, month, day);
    }
  }

  const aligned = alignForRules(next, recurrenceRule);
  return toIsoDate(aligned);
}

function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [savedViews, setSavedViews] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_VIEWS_KEY)) || [];
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("appSettings")) || {};
      const target = Number(saved?.goals?.weeklyCompletedTarget);
      return Number.isFinite(target) && target > 0 ? target : 8;
    } catch {
      return 8;
    }
  });
  const [slaConfig, setSlaConfig] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("appSettings")) || {};
      return normalizeSlaConfig(saved?.sla);
    } catch {
      return normalizeSlaConfig();
    }
  });
  const [workloadConfig, setWorkloadConfig] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("appSettings")) || {};
      return normalizeWorkloadConfig(saved?.workload);
    } catch {
      return normalizeWorkloadConfig();
    }
  });
  const [auditLog, setAuditLog] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(AUDIT_LOG_KEY)) || [];
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [clockTick, setClockTick] = useState(Date.now());

  const appendAudit = (type, message, meta = {}) => {
    const entry = {
      id: crypto.randomUUID(),
      type,
      message,
      createdAt: new Date().toISOString(),
      ...meta,
    };
    setAuditLog((prev) => {
      const next = [entry, ...prev].slice(0, 200);
      localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(next));
      return next;
    });
  };

  const persistViews = (nextViews) => {
    setSavedViews(nextViews);
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(nextViews));
  };

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

  useEffect(() => {
    const runAutoBackup = () => {
      let settings;
      try {
        settings = JSON.parse(localStorage.getItem("appSettings")) || {};
      } catch {
        settings = {};
      }

      const backupEnabled = settings?.backup?.enabled ?? false;
      const frequencyHours = Number(settings?.backup?.frequencyHours || 24);
      const intervalMs = Math.max(1, frequencyHours) * 60 * 60 * 1000;
      if (!backupEnabled) return;

      const lastAt = Number(localStorage.getItem(AUTO_BACKUP_LAST_KEY) || 0);
      const now = Date.now();
      if (lastAt && now - lastAt < intervalMs) return;

      const snapshot = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        total: tasks.length,
        tasks,
      };

      try {
        const existing = JSON.parse(localStorage.getItem(AUTO_BACKUP_LIST_KEY)) || [];
        const list = Array.isArray(existing) ? existing : [];
        const next = [snapshot, ...list].slice(0, 20);
        localStorage.setItem(AUTO_BACKUP_LIST_KEY, JSON.stringify(next));
        localStorage.setItem(AUTO_BACKUP_LAST_KEY, String(now));
      } catch {
        localStorage.setItem(AUTO_BACKUP_LIST_KEY, JSON.stringify([snapshot]));
        localStorage.setItem(AUTO_BACKUP_LAST_KEY, String(now));
      }
    };

    runAutoBackup();
    const timer = setInterval(runAutoBackup, 60_000);
    return () => clearInterval(timer);
  }, [tasks]);

  useEffect(() => {
    const syncSettings = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("appSettings")) || {};
        const target = Number(saved?.goals?.weeklyCompletedTarget);
        setWeeklyGoal(Number.isFinite(target) && target > 0 ? target : 8);
        setSlaConfig(normalizeSlaConfig(saved?.sla));
        setWorkloadConfig(normalizeWorkloadConfig(saved?.workload));
      } catch {
        setWeeklyGoal(8);
        setSlaConfig(normalizeSlaConfig());
        setWorkloadConfig(normalizeWorkloadConfig());
      }
    };

    window.addEventListener("storage", syncSettings);
    window.addEventListener("app-settings-updated", syncSettings);
    return () => {
      window.removeEventListener("storage", syncSettings);
      window.removeEventListener("app-settings-updated", syncSettings);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setClockTick(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const addTask = (task) => {
    const normalized = normalizeTask(task);
    if (!normalized) {
      return { ok: false, message: "Invalid task payload." };
    }

    setTasks((prev) => {
      const maxOrderInTodo = prev
        .filter((item) => item.status === "todo")
        .reduce((max, item) => Math.max(max, Number(item.order) || 0), 0);
      return [{ ...normalized, order: maxOrderInTodo + 1 }, ...prev];
    });
    appendAudit("task.created", `Task created: ${normalized.title}`, { taskId: normalized.id });
    return { ok: true };
  };

  const moveTask = (id, status) => {
    if (!VALID_STATUS.includes(status)) {
      return { ok: false, message: "Invalid status selected." };
    }

    let result = { ok: true };

    setTasks((prev) => {
      const task = prev.find((item) => item.id === id);
      if (!task) {
        result = { ok: false, message: "Task not found." };
        return prev;
      }

      if (status !== "todo") {
        const unresolved = (task.dependencies || []).filter((depId) => {
          const depTask = prev.find((item) => item.id === depId);
          return !depTask || depTask.status !== "done";
        });
        if (unresolved.length > 0) {
          result = {
            ok: false,
            message: `Blocked by ${unresolved.length} dependency task(s). Complete prerequisites first.`,
          };
          return prev;
        }
      }

      const updated = prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              order:
                status !== item.status
                  ? prev
                      .filter((entry) => entry.status === status)
                      .reduce((max, entry) => Math.max(max, Number(entry.order) || 0), 0) + 1
                  : item.order,
              completedAt: status === "done" ? new Date().toISOString() : null,
              timerStartedAt: status === "done" ? null : item.timerStartedAt,
              trackedSeconds:
                status === "done" && item.timerStartedAt
                  ? item.trackedSeconds +
                    Math.max(
                      0,
                      Math.floor((Date.now() - new Date(item.timerStartedAt).getTime()) / 1000)
                    )
                  : item.trackedSeconds,
              timeEntries:
                status === "done" && item.timerStartedAt
                  ? [
                      ...(item.timeEntries || []),
                      {
                        startedAt: item.timerStartedAt,
                        stoppedAt: new Date().toISOString(),
                        seconds: Math.max(
                          0,
                          Math.floor((Date.now() - new Date(item.timerStartedAt).getTime()) / 1000)
                        ),
                        day: new Date(item.timerStartedAt).toISOString().slice(0, 10),
                      },
                    ]
                  : item.timeEntries,
            }
          : item
      );

      const shouldCreateRecurring =
        task.status !== "done" &&
        status === "done" &&
        task.recurrence !== "none" &&
        Boolean(task.dueDate);

      if (!shouldCreateRecurring) {
        appendAudit("task.status_changed", `Task moved to ${status}: ${task.title}`, { taskId: task.id });
        return updated;
      }

      const nextDueDate = getNextDueDate(task.dueDate, task.recurrence, task.recurrenceRule);
      if (!nextDueDate) {
        return updated;
      }

      const sourceId = task.recurrenceSourceId || task.id;
      const duplicate = updated.some(
        (item) =>
          (item.recurrenceSourceId || item.id) === sourceId &&
          item.dueDate === nextDueDate
      );

      if (duplicate) {
        return updated;
      }

      const nextTask = {
        ...task,
        id: crypto.randomUUID(),
        status: "todo",
        completedAt: null,
        dueDate: nextDueDate,
        recurrenceSourceId: sourceId,
        timerStartedAt: null,
        trackedSeconds: 0,
        timeEntries: [],
        subtasks: (task.subtasks || []).map((subtask) => ({ ...subtask, done: false })),
        createdAt: new Date().toISOString(),
      };

      appendAudit("task.status_changed", `Task moved to ${status}: ${task.title}`, { taskId: task.id });
      appendAudit("task.recurring_created", `Recurring task generated: ${nextTask.title}`, {
        taskId: nextTask.id,
      });

      return [nextTask, ...updated];
    });

    return result;
  };

  const reorderTask = (taskId, targetStatus, beforeTaskId = null) => {
    let result = { ok: true };

    setTasks((prev) => {
      const dragged = prev.find((task) => task.id === taskId);
      if (!dragged) {
        result = { ok: false, message: "Dragged task not found." };
        return prev;
      }

      const remaining = prev.filter((task) => task.id !== taskId);
      const targetList = remaining
        .filter((task) => task.status === targetStatus)
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

      const insertIndex = beforeTaskId
        ? targetList.findIndex((task) => task.id === beforeTaskId)
        : targetList.length;
      const safeInsertIndex =
        insertIndex < 0 ? targetList.length : Math.min(Math.max(insertIndex, 0), targetList.length);

      const moved = { ...dragged, status: targetStatus };
      const nextTarget = [
        ...targetList.slice(0, safeInsertIndex),
        moved,
        ...targetList.slice(safeInsertIndex),
      ].map((task, index) => ({ ...task, order: index + 1 }));

      const sourceStatus = dragged.status;
      const nextSource =
        sourceStatus === targetStatus
          ? []
          : remaining
              .filter((task) => task.status === sourceStatus)
              .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
              .map((task, index) => ({ ...task, order: index + 1 }));

      const unaffected = remaining.filter(
        (task) => task.status !== targetStatus && task.status !== sourceStatus
      );

      return [...nextTarget, ...nextSource, ...unaffected];
    });

    return result;
  };

  const deleteTask = (id) => {
    let deletedTitle = "";
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        deletedTitle = task.title;
        return { ...task, deletedAt: new Date().toISOString(), timerStartedAt: null };
      })
    );
    if (deletedTitle) {
      appendAudit("task.deleted", `Task moved to recycle bin: ${deletedTitle}`, { taskId: id });
    }
  };

  const clearCompleted = () => {
    const nowIso = new Date().toISOString();
    const clearedIds = [];
    setTasks((prev) =>
      prev.map((task) => {
        if (task.status !== "done" || task.deletedAt) return task;
        clearedIds.push(task.id);
        return { ...task, deletedAt: nowIso, timerStartedAt: null };
      })
    );
    if (clearedIds.length > 0) {
      appendAudit("task.bulk_deleted", `Moved ${clearedIds.length} completed task(s) to recycle bin.`);
    }
  };

  const restoreTask = (id) => {
    let restoredTitle = "";
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        restoredTitle = task.title;
        return { ...task, deletedAt: null };
      })
    );
    if (restoredTitle) {
      appendAudit("task.restored", `Task restored from recycle bin: ${restoredTitle}`, { taskId: id });
    }
  };

  const permanentlyDeleteTask = (id) => {
    let deletedTitle = "";
    setTasks((prev) =>
      prev.filter((task) => {
        if (task.id !== id) return true;
        deletedTitle = task.title;
        return false;
      })
    );
    if (deletedTitle) {
      appendAudit("task.permanent_deleted", `Task permanently deleted: ${deletedTitle}`, { taskId: id });
    }
  };

  const clearRecycleBin = () => {
    let removedCount = 0;
    setTasks((prev) =>
      prev.filter((task) => {
        const keep = !task.deletedAt;
        if (!keep) removedCount += 1;
        return keep;
      })
    );
    if (removedCount > 0) {
      appendAudit("task.recycle_cleared", `Recycle bin cleared (${removedCount} task(s)).`);
    }
  };

  const saveCurrentView = (name) => {
    const viewName = String(name || "").trim();
    if (!viewName) return { ok: false, message: "View name is required." };

    const payload = {
      id: crypto.randomUUID(),
      name: viewName,
      filter,
      search,
      tagFilter,
      sortBy,
      createdAt: new Date().toISOString(),
    };
    const next = [payload, ...savedViews].slice(0, 20);
    persistViews(next);
    appendAudit("view.saved", `Saved view created: ${viewName}`);
    return { ok: true };
  };

  const applySavedView = (viewId) => {
    const view = savedViews.find((item) => item.id === viewId);
    if (!view) return { ok: false, message: "Saved view not found." };
    setFilter(view.filter || "all");
    setSearch(view.search || "");
    setTagFilter(view.tagFilter || "all");
    setSortBy(view.sortBy || "newest");
    appendAudit("view.applied", `Saved view applied: ${view.name}`);
    return { ok: true };
  };

  const deleteSavedView = (viewId) => {
    const target = savedViews.find((item) => item.id === viewId);
    const next = savedViews.filter((item) => item.id !== viewId);
    persistViews(next);
    if (target) appendAudit("view.deleted", `Saved view removed: ${target.name}`);
    return { ok: true };
  };

  const startTaskTimer = (taskId) => {
    let result = { ok: true };
    const nowIso = new Date().toISOString();

    setTasks((prev) => {
      const hasTask = prev.some((task) => task.id === taskId);
      if (!hasTask) {
        result = { ok: false, message: "Task not found." };
        return prev;
      }

      return prev.map((task) => {
        if (task.id === taskId) {
          if (task.timerStartedAt) return task;
          return { ...task, timerStartedAt: nowIso };
        }

        if (!task.timerStartedAt) return task;

        const seconds = Math.max(
          0,
          Math.floor((Date.now() - new Date(task.timerStartedAt).getTime()) / 1000)
        );

        return {
          ...task,
          trackedSeconds: task.trackedSeconds + seconds,
          timerStartedAt: null,
          timeEntries: [
            ...(task.timeEntries || []),
            {
              startedAt: task.timerStartedAt,
              stoppedAt: nowIso,
              seconds,
              day: new Date(task.timerStartedAt).toISOString().slice(0, 10),
            },
          ],
        };
      });
    });

    return result;
  };

  const stopTaskTimer = (taskId) => {
    let result = { ok: true };
    const nowIso = new Date().toISOString();

    setTasks((prev) => {
      const target = prev.find((task) => task.id === taskId);
      if (!target) {
        result = { ok: false, message: "Task not found." };
        return prev;
      }

      if (!target.timerStartedAt) return prev;

      const seconds = Math.max(
        0,
        Math.floor((Date.now() - new Date(target.timerStartedAt).getTime()) / 1000)
      );

      return prev.map((task) =>
        task.id !== taskId
          ? task
          : {
              ...task,
              trackedSeconds: task.trackedSeconds + seconds,
              timerStartedAt: null,
              timeEntries: [
                ...(task.timeEntries || []),
                {
                  startedAt: task.timerStartedAt,
                  stoppedAt: nowIso,
                  seconds,
                  day: new Date(task.timerStartedAt).toISOString().slice(0, 10),
                },
              ],
            }
      );
    });

    return result;
  };

  const exportTasks = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      total: tasks.length,
      tasks,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importTasks = (raw, options = {}) => {
    const mode = options.mode === "merge" ? "merge" : "replace";
    if (!raw || typeof raw !== "string") {
      return { ok: false, message: "Invalid import file." };
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, message: "Invalid JSON format." };
    }

    const incoming = Array.isArray(parsed) ? parsed : parsed?.tasks;
    if (!Array.isArray(incoming)) {
      return { ok: false, message: "No tasks found in file." };
    }

    const normalizedIncoming = incoming.map(normalizeTask).filter(Boolean);
    if (normalizedIncoming.length === 0) {
      return { ok: false, message: "No valid tasks to import." };
    }

    setTasks((prev) => {
      if (mode === "replace") return normalizedIncoming;

      const existingById = new Map(prev.map((task) => [task.id, task]));
      normalizedIncoming.forEach((task) => {
        const candidateId = existingById.has(task.id) ? crypto.randomUUID() : task.id;
        existingById.set(candidateId, { ...task, id: candidateId });
      });
      return Array.from(existingById.values());
    });

    return { ok: true, imported: normalizedIncoming.length, mode };
  };

  const addSubtask = (taskId, text) => {
    const normalizedText = String(text || "").trim();
    if (!normalizedText) {
      return { ok: false, message: "Subtask text is required." };
    }

    let result = { ok: true };

    setTasks((prev) => {
      const hasTask = prev.some((task) => task.id === taskId);
      if (!hasTask) {
        result = { ok: false, message: "Task not found." };
        return prev;
      }

      return prev.map((task) => {
        if (task.id !== taskId) return task;

        const exists = (task.subtasks || []).some(
          (subtask) => subtask.text.toLowerCase() === normalizedText.toLowerCase()
        );

        if (exists) {
          result = { ok: false, message: "Subtask already exists." };
          return task;
        }

        return {
          ...task,
          subtasks: [
            ...(task.subtasks || []),
            { id: crypto.randomUUID(), text: normalizedText, done: false },
          ],
        };
      });
    });

    return result;
  };

  const addComment = (taskId, text, author = "User") => {
    const normalizedText = String(text || "").trim();
    if (!normalizedText) return { ok: false, message: "Comment cannot be empty." };

    let result = { ok: true };
    setTasks((prev) => {
      const hasTask = prev.some((task) => task.id === taskId);
      if (!hasTask) {
        result = { ok: false, message: "Task not found." };
        return prev;
      }

      return prev.map((task) => {
        if (task.id !== taskId) return task;
        const comment = normalizeComment({
          text: normalizedText,
          author,
          createdAt: new Date().toISOString(),
        });
        return {
          ...task,
          comments: [...(task.comments || []), comment],
        };
      });
    });
    if (result.ok) {
      appendAudit("task.comment_added", "Comment added to task.", { taskId });
    }
    return result;
  };

  const editComment = (taskId, commentId, nextText) => {
    const normalizedText = String(nextText || "").trim();
    if (!normalizedText) return { ok: false, message: "Comment cannot be empty." };

    let result = { ok: true };
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          comments: (task.comments || []).map((comment) => {
            if (comment.id !== commentId) return comment;
            if (comment.text === normalizedText) return comment;
            return {
              ...comment,
              text: normalizedText,
              editedAt: new Date().toISOString(),
              history: [
                ...(comment.history || []),
                {
                  text: comment.text,
                  editedAt: new Date().toISOString(),
                },
              ],
            };
          }),
        };
      })
    );
    appendAudit("task.comment_edited", "Comment edited on task.", { taskId });
    return result;
  };

  const deleteComment = (taskId, commentId) => {
    let result = { ok: true };
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          comments: (task.comments || []).filter((comment) => comment.id !== commentId),
        };
      })
    );
    appendAudit("task.comment_deleted", "Comment removed from task.", { taskId });
    return result;
  };

  const toggleSubtask = (taskId, subtaskId) => {
    let result = { ok: true };

    setTasks((prev) => {
      const hasTask = prev.some((task) => task.id === taskId);
      if (!hasTask) {
        result = { ok: false, message: "Task not found." };
        return prev;
      }

      return prev.map((task) => {
        if (task.id !== taskId) return task;

        const hasSubtask = (task.subtasks || []).some((subtask) => subtask.id === subtaskId);
        if (!hasSubtask) {
          result = { ok: false, message: "Subtask not found." };
          return task;
        }

        return {
          ...task,
          subtasks: (task.subtasks || []).map((subtask) =>
            subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask
          ),
        };
      });
    });

    return result;
  };

  const activeTasks = useMemo(() => tasks.filter((task) => !task.deletedAt), [tasks]);
  const recycleBin = useMemo(
    () => tasks.filter((task) => task.deletedAt).sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt)),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    const byPriority =
      filter === "all" ? activeTasks : activeTasks.filter((task) => task.priority === filter);
    const byTag =
      tagFilter === "all" ? byPriority : byPriority.filter((task) => (task.tags || []).includes(tagFilter));
    const query = search.trim().toLowerCase();
    const bySearch = query
      ? byTag.filter(
          (task) =>
            task.title.toLowerCase().includes(query) ||
            task.description.toLowerCase().includes(query) ||
            (task.subtasks || []).some((subtask) => subtask.text.toLowerCase().includes(query)) ||
            (task.tags || []).some((tag) => tag.includes(query))
        )
      : byTag;

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
  }, [activeTasks, filter, tagFilter, search, sortBy]);

  const kanbanTasks = useMemo(() => {
    const byPriority =
      filter === "all" ? activeTasks : activeTasks.filter((task) => task.priority === filter);
    const byTag =
      tagFilter === "all" ? byPriority : byPriority.filter((task) => (task.tags || []).includes(tagFilter));
    const query = search.trim().toLowerCase();
    const bySearch = query
      ? byTag.filter(
          (task) =>
            task.title.toLowerCase().includes(query) ||
            task.description.toLowerCase().includes(query) ||
            (task.subtasks || []).some((subtask) => subtask.text.toLowerCase().includes(query)) ||
            (task.tags || []).some((tag) => tag.includes(query))
        )
      : byTag;

    return [...bySearch].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  }, [activeTasks, filter, tagFilter, search]);

  const stats = useMemo(() => {
    const nowTs = clockTick;
    const total = activeTasks.length;
    const completed = activeTasks.filter((t) => t.status === "done").length;
    const pending = total - completed;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    const recurring = activeTasks.filter((t) => t.recurrence && t.recurrence !== "none").length;
    const subtaskTotal = activeTasks.reduce((count, task) => count + (task.subtasks || []).length, 0);
    const subtaskDone = activeTasks.reduce(
      (count, task) => count + (task.subtasks || []).filter((subtask) => subtask.done).length,
      0
    );

    const doneTasks = activeTasks.filter((task) => task.status === "done");
    const dueAndDone = doneTasks.filter((task) => task.dueDate);
    const completedOnTime = dueAndDone.filter(
      (task) => new Date(task.completedAt || task.createdAt) <= new Date(`${task.dueDate}T23:59:59`)
    ).length;
    const onTimeRate = dueAndDone.length
      ? Math.round((completedOnTime / dueAndDone.length) * 100)
      : 0;

    const highPending = activeTasks.filter(
      (task) => task.status !== "done" && task.priority === "high"
    ).length;
    const overdue = activeTasks.filter((task) => {
      if (!task.dueDate || task.status === "done") return false;
      const now = new Date(nowTs);
      now.setHours(0, 0, 0, 0);
      return new Date(`${task.dueDate}T00:00:00`) < now;
    }).length;
    const todayDate = new Date(nowTs);
    todayDate.setHours(0, 0, 0, 0);
    const todayDateIso = todayDate.toISOString().slice(0, 10);
    const dueTodayTasks = activeTasks.filter(
      (task) => task.status !== "done" && task.dueDate === todayDateIso
    );
    const focusScore = Math.max(
      0,
      Math.min(100, Math.round(progress * 0.6 + onTimeRate * 0.4 - highPending * 2 - overdue * 3))
    );

    const now = new Date();
    const weekStart = new Date(now);
    const day = weekStart.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    weekStart.setDate(weekStart.getDate() - diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weeklyCompleted = activeTasks.filter((task) => {
      if (task.status !== "done") return false;
      if (!task.completedAt) return false;
      const completedAt = new Date(task.completedAt);
      return completedAt >= weekStart && completedAt < weekEnd;
    }).length;

    const weeklyGoalProgress = Math.min(
      100,
      Math.round((weeklyCompleted / Math.max(weeklyGoal, 1)) * 100)
    );

    const completedDays = Array.from(
      new Set(
        activeTasks
          .filter((task) => task.status === "done" && task.completedAt)
          .map((task) => new Date(task.completedAt).toISOString().slice(0, 10))
      )
    ).sort();

    let completionStreakDays = 0;
    if (completedDays.length > 0) {
      const daySet = new Set(completedDays);
      const cursor = new Date();
      cursor.setHours(0, 0, 0, 0);

      while (daySet.has(cursor.toISOString().slice(0, 10))) {
        completionStreakDays += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
    }

    const todayIso = new Date(nowTs).toISOString().slice(0, 10);
    const weekStartIso = weekStart.toISOString().slice(0, 10);
    const trackedTodaySeconds = activeTasks.reduce(
      (sum, task) =>
        sum +
        (task.timeEntries || [])
          .filter((entry) => entry.day === todayIso)
          .reduce((entrySum, entry) => entrySum + entry.seconds, 0),
      0
    );
    const trackedWeekSeconds = activeTasks.reduce(
      (sum, task) =>
        sum +
        (task.timeEntries || [])
          .filter((entry) => entry.day >= weekStartIso && entry.day <= todayIso)
          .reduce((entrySum, entry) => entrySum + entry.seconds, 0),
      0
    );
    const activeTimerTaskId = activeTasks.find((task) => Boolean(task.timerStartedAt))?.id || null;
    const blocked = activeTasks.filter((task) => {
      if (task.status === "done") return false;
      if (!task.dependencies || task.dependencies.length === 0) return false;
      return task.dependencies.some((depId) => {
        const depTask = tasks.find((item) => item.id === depId);
        return !depTask || depTask.status !== "done";
      });
    }).length;
    const slaWatchlist = slaConfig.enabled
      ? activeTasks
          .filter((task) => task.status !== "done")
          .map((task) => {
            const thresholdHours = slaConfig.hoursByPriority[task.priority] || 48;
            const createdAt = new Date(task.createdAt || new Date(nowTs).toISOString());
            const ageHours = (nowTs - createdAt.getTime()) / (1000 * 60 * 60);
            const hoursLeft = thresholdHours - ageHours;
            const status =
              hoursLeft <= 0 ? "breached" : hoursLeft <= 6 ? "warning" : "healthy";
            return {
              taskId: task.id,
              title: task.title,
              priority: task.priority,
              thresholdHours,
              ageHours: Math.round(ageHours * 10) / 10,
              hoursLeft: Math.round(hoursLeft * 10) / 10,
              status,
            };
          })
          .sort((a, b) => a.hoursLeft - b.hoursLeft)
      : [];
    const slaBreached = slaWatchlist.filter((item) => item.status === "breached").length;
    const slaAtRisk = slaWatchlist.filter((item) => item.status === "warning").length;
    const nextSlaBreachHours =
      slaWatchlist.find((item) => item.hoursLeft > 0)?.hoursLeft ?? null;
    const members = loadWorkspaceMembers();
    const memberWorkload = members.map((member) => {
      const assigned = activeTasks.filter(
        (task) => task.assigneeId === member.id && task.status !== "done"
      );
      const priorityEstimate = assigned.reduce((sum, task) => {
        if (task.priority === "high") return sum + 8;
        if (task.priority === "medium") return sum + 4;
        return sum + 2;
      }, 0);
      const trackedWeekHours =
        activeTasks
          .filter((task) => task.assigneeId === member.id)
          .reduce(
            (sum, task) =>
              sum +
              (task.timeEntries || [])
                .filter((entry) => entry.day >= weekStartIso && entry.day <= todayIso)
                .reduce((entrySum, entry) => entrySum + entry.seconds, 0),
            0
          ) /
        3600;
      const estimatedHours = Math.round((priorityEstimate + trackedWeekHours) * 10) / 10;
      const capacity =
        Number(workloadConfig.capacitiesByMemberId?.[member.id]) || workloadConfig.defaultCapacityHours;
      const utilization = Math.round((estimatedHours / Math.max(1, capacity)) * 100);
      return {
        memberId: member.id,
        name: member.name,
        capacity,
        estimatedHours,
        utilization,
        overloaded: estimatedHours > capacity,
      };
    });
    const overloadedMembers = memberWorkload.filter((member) => member.overloaded).length;
    const trackedWeekHours = Math.round((trackedWeekSeconds / 3600) * 10) / 10;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const last7Start = new Date(todayStart);
    last7Start.setDate(last7Start.getDate() - 6);
    const prev7Start = new Date(last7Start);
    prev7Start.setDate(prev7Start.getDate() - 7);

    const last7Completed = activeTasks.filter((task) => {
      if (task.status !== "done" || !task.completedAt) return false;
      const completedAt = new Date(task.completedAt);
      return completedAt >= last7Start && completedAt <= todayStart;
    }).length;

    const prev7Completed = activeTasks.filter((task) => {
      if (task.status !== "done" || !task.completedAt) return false;
      const completedAt = new Date(task.completedAt);
      return completedAt >= prev7Start && completedAt < last7Start;
    }).length;

    const momentumDelta = last7Completed - prev7Completed;
    const momentumTrend =
      momentumDelta > 0 ? "up" : momentumDelta < 0 ? "down" : "flat";

    const workloadUtilizations = memberWorkload
      .map((member) => member.utilization)
      .filter((value) => Number.isFinite(value));
    const avgUtilization = workloadUtilizations.length
      ? workloadUtilizations.reduce((sum, value) => sum + value, 0) / workloadUtilizations.length
      : 0;
    const utilizationVariance = workloadUtilizations.length
      ? workloadUtilizations.reduce((sum, value) => sum + (value - avgUtilization) ** 2, 0) /
        workloadUtilizations.length
      : 0;
    const workloadBalanceScore = Math.max(
      0,
      Math.min(100, Math.round(100 - Math.sqrt(utilizationVariance)))
    );

    const burnoutRiskScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          Math.min(50, trackedWeekHours * 1.2) +
            Math.min(25, overdue * 5) +
            Math.min(25, highPending * 4)
        )
      )
    );
    const burnoutRiskLevel =
      burnoutRiskScore >= 70 ? "high" : burnoutRiskScore >= 40 ? "medium" : "low";

    const focusCandidates = activeTasks
      .filter((task) => task.status !== "done")
      .sort((a, b) => {
        const priorityWeight = { high: 0, medium: 1, low: 2 };
        const dueA = a.dueDate ? new Date(`${a.dueDate}T00:00:00`).getTime() : Number.POSITIVE_INFINITY;
        const dueB = b.dueDate ? new Date(`${b.dueDate}T00:00:00`).getTime() : Number.POSITIVE_INFINITY;
        if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
          return priorityWeight[a.priority] - priorityWeight[b.priority];
        }
        return dueA - dueB;
      })
      .slice(0, 3)
      .map((task) => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        dueDate: task.dueDate || null,
      }));

    const dailyBriefing = {
      generatedAt: new Date(nowTs).toISOString(),
      overdueCount: overdue,
      dueTodayCount: dueTodayTasks.length,
      blockedCount: blocked,
      highPriorityOpenCount: highPending,
      focusCandidates,
      summaryLine:
        overdue > 0
          ? `${overdue} overdue task(s) need immediate action.`
          : dueTodayTasks.length > 0
            ? `${dueTodayTasks.length} task(s) are due today.`
            : "No urgent deadlines right now. Focus on high-impact tasks.",
      recommendation:
        blocked > 0
          ? "Resolve blocked dependencies first, then start highest-priority due item."
          : highPending > 0
            ? "Start with highest-priority open task and complete one milestone before context switching."
            : "Maintain momentum by closing one medium-priority task before noon.",
    };

    return {
      total,
      completed,
      pending,
      progress,
      recurring,
      subtaskTotal,
      subtaskDone,
      onTimeRate,
      focusScore,
      overdue,
      highPending,
      weeklyGoal,
      weeklyCompleted,
      weeklyGoalProgress,
      completionStreakDays,
      trackedTodaySeconds,
      trackedWeekSeconds,
      activeTimerTaskId,
      blocked,
      slaBreached,
      slaAtRisk,
      nextSlaBreachHours,
      slaWatchlist,
      deleted: recycleBin.length,
      memberWorkload,
      overloadedMembers,
      trackedWeekHours,
      momentumTrend,
      momentumDelta,
      last7Completed,
      prev7Completed,
      workloadBalanceScore,
      burnoutRiskScore,
      burnoutRiskLevel,
      dailyBriefing,
    };
  }, [activeTasks, recycleBin.length, weeklyGoal, slaConfig, workloadConfig, clockTick]);

  return {
    tasks: activeTasks,
    allTasks: tasks,
    recycleBin,
    auditLog,
    filteredTasks,
    filter,
    setFilter,
    search,
    setSearch,
    tagFilter,
    setTagFilter,
    sortBy,
    setSortBy,
    savedViews,
    saveCurrentView,
    applySavedView,
    deleteSavedView,
    kanbanTasks,
    addTask,
    moveTask,
    reorderTask,
    deleteTask,
    clearCompleted,
    restoreTask,
    permanentlyDeleteTask,
    clearRecycleBin,
    addSubtask,
    toggleSubtask,
    addComment,
    editComment,
    deleteComment,
    startTaskTimer,
    stopTaskTimer,
    exportTasks,
    importTasks,
    stats,
  };
}

export default useTasks;
