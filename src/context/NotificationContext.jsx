import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { TaskContext } from "./TaskContext";

export const NotificationContext = createContext(null);

const STORAGE_KEY = "notificationReadIds";
const SETTINGS_KEY = "appSettings";

function dayStart(date) {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function buildNotifications(tasks = []) {
  if (!Array.isArray(tasks)) return [];
  let appSettings = null;
  try {
    appSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    appSettings = {};
  }
  const notifyOverdue = appSettings?.notifications?.overdue ?? true;
  const notifyDueTomorrow = appSettings?.notifications?.dueTomorrow ?? true;

  const today = dayStart(new Date());
  const list = [];

  tasks.forEach((task) => {
    if (!task?.dueDate || task?.status === "done") return;
    const due = new Date(`${task.dueDate}T00:00:00`);
    const diffDays = Math.floor((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0 && notifyOverdue) {
      list.push({
        id: `overdue-${task.id}`,
        taskId: task.id,
        type: "overdue",
        title: "Overdue Task",
        message: `"${task.title}" is overdue.`,
        dueDate: task.dueDate,
        priority: task.priority,
        createdAt: task.createdAt || new Date().toISOString(),
      });
    } else if (diffDays === 1 && notifyDueTomorrow) {
      list.push({
        id: `due-tomorrow-${task.id}`,
        taskId: task.id,
        type: "due-tomorrow",
        title: "Due Tomorrow",
        message: `"${task.title}" is due tomorrow.`,
        dueDate: task.dueDate,
        priority: task.priority,
        createdAt: task.createdAt || new Date().toISOString(),
      });
    }
  });

  return list.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

export function NotificationProvider({ children }) {
  const taskContext = useContext(TaskContext);
  const tasks = taskContext?.tasks || [];
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [toasts, setToasts] = useState([]);
  const seenUnreadIdsRef = useRef(new Set());
  const initializedRef = useRef(false);

  const notifications = useMemo(() => buildNotifications(tasks), [tasks]);
  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !readIds.includes(item.id)),
    [notifications, readIds]
  );
  const unreadCount = unreadNotifications.length;
  const toastEnabled = useMemo(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
      return saved?.notifications?.toast ?? true;
    } catch {
      return true;
    }
  }, [notifications.length]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readIds));
  }, [readIds]);

  useEffect(() => {
    const currentUnreadIds = unreadNotifications.map((item) => item.id);
    const nextSeen = new Set(currentUnreadIds);

    if (!toastEnabled) {
      seenUnreadIdsRef.current = nextSeen;
      return;
    }

    if (!initializedRef.current) {
      unreadNotifications.slice(0, 2).forEach((item) => {
        setToasts((prev) => [
          ...prev,
          { toastId: `${item.id}-${Date.now()}-${Math.random()}`, notification: item },
        ]);
      });
      initializedRef.current = true;
      seenUnreadIdsRef.current = nextSeen;
      return;
    }

    unreadNotifications.forEach((item) => {
      if (!seenUnreadIdsRef.current.has(item.id)) {
        setToasts((prev) => [
          ...prev,
          { toastId: `${item.id}-${Date.now()}-${Math.random()}`, notification: item },
        ]);
      }
    });

    seenUnreadIdsRef.current = nextSeen;
  }, [unreadNotifications, toastEnabled]);

  useEffect(() => {
    if (toasts.length === 0) return undefined;
    const timers = toasts.map((toast) =>
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.toastId !== toast.toastId));
      }, 4500)
    );
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [toasts]);

  const markAsRead = (id) => {
    setReadIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((item) => item.id);
    setReadIds((prev) => Array.from(new Set([...prev, ...allIds])));
  };

  const dismissToast = (toastId) => {
    setToasts((prev) => prev.filter((item) => item.toastId !== toastId));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadNotifications,
        unreadCount,
        readIds,
        markAsRead,
        markAllAsRead,
        toasts,
        dismissToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
