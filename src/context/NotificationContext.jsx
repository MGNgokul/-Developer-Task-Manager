import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { TaskContext } from "./TaskContext";

export const NotificationContext = createContext(null);

const STORAGE_KEY = "notificationReadIds";
const SNOOZE_KEY = "notificationSnoozeMap";
const SETTINGS_KEY = "appSettings";

function dayStart(date) {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function isQuietHoursActive(settings, now = new Date()) {
  const hour = now.getHours();
  const weekday = now.getDay();

  if (settings.muteWeekends && (weekday === 0 || weekday === 6)) {
    return true;
  }

  if (!settings.quietHoursEnabled) return false;
  const start = Number(settings.quietStartHour);
  const end = Number(settings.quietEndHour);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  if (start === end) return false;

  if (start < end) {
    return hour >= start && hour < end;
  }
  return hour >= start || hour < end;
}

function getNotificationSettings() {
  try {
    const appSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    const sla = appSettings?.sla || {};
    const escalation = appSettings?.escalation || {};
    const hours = sla?.hoursByPriority || {};
    return {
      overdue: appSettings?.notifications?.overdue ?? true,
      dueSoon:
        appSettings?.notifications?.dueSoon ??
        appSettings?.notifications?.dueTomorrow ??
        true,
      slaBreach: appSettings?.notifications?.slaBreach ?? true,
      escalation: appSettings?.notifications?.escalation ?? true,
      toast: appSettings?.notifications?.toast ?? true,
      browser: appSettings?.notifications?.browser ?? false,
      leadDays: Number.isFinite(appSettings?.notifications?.leadDays)
        ? Math.max(0, Math.min(14, Number(appSettings.notifications.leadDays)))
        : 1,
      quietHoursEnabled: appSettings?.notifications?.quietHoursEnabled ?? false,
      quietStartHour: Number.isFinite(appSettings?.notifications?.quietStartHour)
        ? Math.max(0, Math.min(23, Number(appSettings.notifications.quietStartHour)))
        : 22,
      quietEndHour: Number.isFinite(appSettings?.notifications?.quietEndHour)
        ? Math.max(0, Math.min(23, Number(appSettings.notifications.quietEndHour)))
        : 8,
      muteWeekends: appSettings?.notifications?.muteWeekends ?? false,
      webhookUrl: String(appSettings?.notifications?.webhookUrl || "").trim(),
      webhookEnabled: appSettings?.notifications?.webhookEnabled ?? false,
      escalationRules: {
        enabled: escalation?.enabled ?? false,
        blockedHours: Number.isFinite(escalation?.blockedHours)
          ? Math.max(1, Math.min(240, Number(escalation.blockedHours)))
          : 24,
        overdueHours: Number.isFinite(escalation?.overdueHours)
          ? Math.max(1, Math.min(240, Number(escalation.overdueHours)))
          : 24,
      },
      sla: {
        enabled: sla?.enabled ?? false,
        hoursByPriority: {
          low: Number.isFinite(hours.low) ? Math.max(1, Number(hours.low)) : 72,
          medium: Number.isFinite(hours.medium) ? Math.max(1, Number(hours.medium)) : 48,
          high: Number.isFinite(hours.high) ? Math.max(1, Number(hours.high)) : 24,
        },
      },
    };
  } catch {
    return {
      overdue: true,
      dueSoon: true,
      slaBreach: true,
      escalation: true,
      toast: true,
      browser: false,
      leadDays: 1,
      quietHoursEnabled: false,
      quietStartHour: 22,
      quietEndHour: 8,
      muteWeekends: false,
      webhookUrl: "",
      webhookEnabled: false,
      escalationRules: {
        enabled: false,
        blockedHours: 24,
        overdueHours: 24,
      },
      sla: {
        enabled: false,
        hoursByPriority: { low: 72, medium: 48, high: 24 },
      },
    };
  }
}

function buildNotifications(tasks = [], settings = getNotificationSettings()) {
  if (!Array.isArray(tasks)) return [];
  const notifyOverdue = settings.overdue;
  const notifyDueSoon = settings.dueSoon;
  const notifySlaBreach = settings.slaBreach;
  const notifyEscalation = settings.escalation;
  const leadDays = settings.leadDays;

  const now = new Date();
  const today = dayStart(now);
  const byId = new Map(tasks.map((item) => [item.id, item]));
  const list = [];

  tasks.forEach((task) => {
    if (!task || task.status === "done") return;
    const hasDueDate = Boolean(task.dueDate);
    const due = hasDueDate ? new Date(`${task.dueDate}T00:00:00`) : null;
    const diffDays = due ? Math.floor((due - today) / (1000 * 60 * 60 * 24)) : null;

    if (hasDueDate && diffDays < 0 && notifyOverdue) {
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
    }

    if (hasDueDate && diffDays >= 0 && diffDays <= leadDays && notifyDueSoon) {
      const title =
        diffDays === 0 ? "Due Today" : diffDays === 1 ? "Due Tomorrow" : "Upcoming Deadline";
      const message =
        diffDays === 0
          ? `"${task.title}" is due today.`
          : diffDays === 1
            ? `"${task.title}" is due tomorrow.`
            : `"${task.title}" is due in ${diffDays} days.`;

      list.push({
        id: `due-soon-${task.id}`,
        taskId: task.id,
        type: "due-soon",
        title,
        message,
        daysUntil: diffDays,
        dueDate: task.dueDate,
        priority: task.priority,
        createdAt: task.createdAt || new Date().toISOString(),
      });
    }

    if (settings.sla.enabled && notifySlaBreach) {
      const threshold = settings.sla.hoursByPriority[task.priority] || 48;
      const ageHours =
        (Date.now() - new Date(task.createdAt || new Date().toISOString()).getTime()) /
        (1000 * 60 * 60);
      if (ageHours > threshold) {
        list.push({
          id: `sla-breach-${task.id}`,
          taskId: task.id,
          type: "sla-breach",
          title: "SLA Breach",
          message: `"${task.title}" exceeded ${threshold}h SLA for ${task.priority} priority.`,
          dueDate: task.dueDate,
          priority: task.priority,
          createdAt: task.createdAt || new Date().toISOString(),
        });
      }
    }

    if (settings.escalationRules.enabled && notifyEscalation) {
      const created = new Date(task.createdAt || now.toISOString());
      const ageHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

      const blocked = (task.dependencies || []).some((depId) => {
        const depTask = byId.get(depId);
        return !depTask || depTask.status !== "done";
      });
      if (blocked && ageHours >= settings.escalationRules.blockedHours) {
        list.push({
          id: `escalation-blocked-${task.id}`,
          taskId: task.id,
          type: "escalation",
          title: "Escalation: Blocked Task",
          message: `"${task.title}" is blocked beyond ${settings.escalationRules.blockedHours}h.`,
          dueDate: task.dueDate || "",
          priority: task.priority,
          createdAt: task.createdAt || now.toISOString(),
        });
      }

      if (hasDueDate && diffDays < 0) {
        const dueEnd = new Date(`${task.dueDate}T23:59:59`);
        const overdueHours = (now.getTime() - dueEnd.getTime()) / (1000 * 60 * 60);
        if (overdueHours >= settings.escalationRules.overdueHours) {
          list.push({
            id: `escalation-overdue-${task.id}`,
            taskId: task.id,
            type: "escalation",
            title: "Escalation: Overdue Task",
            message: `"${task.title}" is overdue beyond ${settings.escalationRules.overdueHours}h.`,
            dueDate: task.dueDate,
            priority: task.priority,
            createdAt: task.createdAt || now.toISOString(),
          });
        }
      }
    }
  });

  return list.sort((a, b) => {
    const da = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
    const db = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
    return da - db;
  });
}

export function NotificationProvider({ children }) {
  const taskContext = useContext(TaskContext);
  const tasks = taskContext?.tasks || [];
  const [settings, setSettings] = useState(() => getNotificationSettings());
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [snoozedMap, setSnoozedMap] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SNOOZE_KEY)) || {};
      return saved && typeof saved === "object" ? saved : {};
    } catch {
      return {};
    }
  });
  const [toasts, setToasts] = useState([]);
  const [clockTick, setClockTick] = useState(Date.now());
  const seenUnreadIdsRef = useRef(new Set());
  const browserSeenIdsRef = useRef(new Set());
  const initializedRef = useRef(false);

  const notifications = useMemo(() => buildNotifications(tasks, settings), [tasks, settings]);
  const activeNotifications = useMemo(() => {
    const now = Date.now();
    return notifications.filter((item) => {
      const snoozedUntil = snoozedMap[item.id];
      return !(snoozedUntil && new Date(snoozedUntil).getTime() > now);
    });
  }, [notifications, snoozedMap]);
  const unreadNotifications = useMemo(
    () => activeNotifications.filter((item) => !readIds.includes(item.id)),
    [activeNotifications, readIds]
  );
  const unreadCount = unreadNotifications.length;
  const toastEnabled = settings.toast;
  const notificationsPaused = useMemo(
    () => isQuietHoursActive(settings, new Date(clockTick)),
    [settings, clockTick]
  );

  useEffect(() => {
    const syncSettings = () => setSettings(getNotificationSettings());
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readIds));
  }, [readIds]);

  useEffect(() => {
    localStorage.setItem(SNOOZE_KEY, JSON.stringify(snoozedMap));
  }, [snoozedMap]);

  useEffect(() => {
    const now = Date.now();
    const cleaned = Object.fromEntries(
      Object.entries(snoozedMap).filter(([, until]) => new Date(until).getTime() > now)
    );
    if (Object.keys(cleaned).length !== Object.keys(snoozedMap).length) {
      setSnoozedMap(cleaned);
    }
  }, [snoozedMap]);

  useEffect(() => {
    if (notificationsPaused) return;
    unreadNotifications.forEach((item) => {
      if (browserSeenIdsRef.current.has(item.id)) return;

      if (settings.browser && typeof window !== "undefined" && "Notification" in window) {
        if (window.Notification.permission === "granted") {
          new window.Notification(item.title, {
            body: item.message,
            tag: item.id,
          });
        }
      }

      if (settings.webhookEnabled && settings.webhookUrl) {
        try {
          const payload = JSON.stringify({
            id: item.id,
            type: item.type,
            title: item.title,
            message: item.message,
            dueDate: item.dueDate,
            priority: item.priority,
          });
          if (navigator.sendBeacon) {
            const blob = new Blob([payload], { type: "application/json" });
            navigator.sendBeacon(settings.webhookUrl, blob);
          }
        } catch {
          // no-op: webhook hook should never block notification flow
        }
      }

      browserSeenIdsRef.current.add(item.id);
    });
  }, [
    unreadNotifications,
    settings.browser,
    settings.webhookEnabled,
    settings.webhookUrl,
    notificationsPaused,
  ]);

  useEffect(() => {
    const currentUnreadIds = unreadNotifications.map((item) => item.id);
    const nextSeen = new Set(currentUnreadIds);

    if (!toastEnabled || notificationsPaused) {
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
  }, [unreadNotifications, toastEnabled, notificationsPaused]);

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
    const allIds = activeNotifications.map((item) => item.id);
    setReadIds((prev) => Array.from(new Set([...prev, ...allIds])));
  };

  const snoozeNotification = (id, hours = 24) => {
    const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    setSnoozedMap((prev) => ({ ...prev, [id]: until }));
  };

  const clearSnooze = (id) => {
    setSnoozedMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const requestBrowserPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    if (window.Notification.permission === "granted") return "granted";
    const permission = await window.Notification.requestPermission();
    return permission;
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
        snoozedMap,
        activeNotifications,
        markAsRead,
        markAllAsRead,
        snoozeNotification,
        clearSnooze,
        requestBrowserPermission,
        toasts,
        dismissToast,
        notificationsPaused,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
