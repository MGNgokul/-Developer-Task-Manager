import { useContext } from "react";
import { NotificationContext } from "../context/NotificationContext";

export default function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      notifications: [],
      unreadNotifications: [],
      unreadCount: 0,
      readIds: [],
      markAsRead: () => {},
      markAllAsRead: () => {},
      toasts: [],
      dismissToast: () => {},
    };
  }
  return context;
}
