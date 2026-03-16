import { useContext } from "react";
import { NotificationContext } from "../context/NotificationContext";

export default function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      notifications: [],
      unreadNotifications: [],
      activeNotifications: [],
      unreadCount: 0,
      readIds: [],
      snoozedMap: {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      snoozeNotification: () => {},
      clearSnooze: () => {},
      requestBrowserPermission: async () => "unsupported",
      toasts: [],
      dismissToast: () => {},
      notificationsPaused: false,
    };
  }
  return context;
}
