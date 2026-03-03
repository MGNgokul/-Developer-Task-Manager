import { motion } from "framer-motion";
import useNotifications from "../hooks/useNotifications";

function formatDate(dateInput) {
  if (!dateInput) return "-";
  const date = new Date(`${dateInput}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, readIds } = useNotifications();
  const overdueCount = notifications.filter((item) => item.type === "overdue").length;
  const dueTomorrowCount = notifications.filter((item) => item.type === "due-tomorrow").length;

  return (
    <div className="notifications-page">
      <motion.section
        className="notifications-header glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2>Notifications</h2>
          <p>Task alerts for overdue and due tomorrow deadlines.</p>
        </div>
        <button
          type="button"
          className="btn-outline"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
        >
          Mark All As Read
        </button>
      </motion.section>

      <section className="dashboard-stats notifications-stats">
        <div className="stat-card glass-card">
          <h3>Total Alerts</h3>
          <p>{notifications.length}</p>
        </div>
        <div className="stat-card glass-card">
          <h3>Unread</h3>
          <p>{unreadCount}</p>
        </div>
        <div className="stat-card glass-card">
          <h3>Overdue</h3>
          <p>{overdueCount}</p>
        </div>
        <div className="stat-card glass-card">
          <h3>Due Tomorrow</h3>
          <p>{dueTomorrowCount}</p>
        </div>
      </section>

      <section className="glass-card notifications-list-wrap">
        <h3>Alert Feed</h3>
        {notifications.length === 0 && (
          <p className="kanban-empty">No alerts right now. You are on track.</p>
        )}

        <div className="notifications-list">
          {notifications.map((item) => {
            const isRead = readIds.includes(item.id);
            return (
              <article
                key={item.id}
                className={`notifications-item ${isRead ? "notifications-item--read" : ""}`}
              >
                <div className="notifications-item-main">
                  <div className="notifications-item-top">
                    <span
                      className={`notifications-pill ${
                        item.type === "overdue" ? "notifications-pill--danger" : "notifications-pill--warning"
                      }`}
                    >
                      {item.type === "overdue" ? "Overdue" : "Due Tomorrow"}
                    </span>
                    {!isRead && <span className="notifications-unread-dot"></span>}
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.message}</p>
                  <p className="notifications-meta">
                    Due: {formatDate(item.dueDate)} • Priority: {item.priority}
                  </p>
                </div>

                <div className="notifications-item-actions">
                  <button
                    type="button"
                    className="filter-btn"
                    onClick={() => markAsRead(item.id)}
                    disabled={isRead}
                  >
                    {isRead ? "Read" : "Mark Read"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Notifications;
