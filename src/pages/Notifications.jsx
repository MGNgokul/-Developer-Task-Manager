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
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    readIds,
    snoozedMap,
    snoozeNotification,
    clearSnooze,
    notificationsPaused,
  } = useNotifications();
  const overdueCount = notifications.filter((item) => item.type === "overdue").length;
  const dueSoonCount = notifications.filter((item) => item.type === "due-soon").length;
  const slaBreachCount = notifications.filter((item) => item.type === "sla-breach").length;

  return (
    <div className="notifications-page">
      <motion.section
        className="notifications-header glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2>Notifications</h2>
          <p>Smart reminders for overdue and upcoming task deadlines.</p>
          {notificationsPaused && (
            <p className="notifications-meta">
              Quiet mode active: popups and push/webhook delivery are temporarily paused.
            </p>
          )}
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
          <h3>Due Soon</h3>
          <p>{dueSoonCount}</p>
        </div>
        <div className="stat-card glass-card">
          <h3>SLA Breach</h3>
          <p>{slaBreachCount}</p>
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
            const snoozedUntil = snoozedMap[item.id];
            const isSnoozed = Boolean(
              snoozedUntil && new Date(snoozedUntil).getTime() > Date.now()
            );
            const typeLabel =
              item.type === "overdue"
                ? "Overdue"
                : item.type === "sla-breach"
                  ? "SLA Breach"
                  : "Due Soon";

            return (
              <article
                key={item.id}
                className={`notifications-item ${isRead ? "notifications-item--read" : ""}`}
              >
                <div className="notifications-item-main">
                  <div className="notifications-item-top">
                    <span
                      className={`notifications-pill ${
                        item.type === "overdue" || item.type === "sla-breach"
                          ? "notifications-pill--danger"
                          : "notifications-pill--warning"
                      }`}
                    >
                      {typeLabel}
                    </span>
                    {!isRead && <span className="notifications-unread-dot"></span>}
                    {isSnoozed && <span className="notifications-pill notifications-pill--snoozed">Snoozed</span>}
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.message}</p>
                  <p className="notifications-meta">
                    Due: {formatDate(item.dueDate)} | Priority: {item.priority}
                  </p>
                  {isSnoozed && (
                    <p className="notifications-meta">
                      Muted until: {new Date(snoozedUntil).toLocaleString()}
                    </p>
                  )}
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
                  {!isSnoozed ? (
                    <button
                      type="button"
                      className="filter-btn"
                      onClick={() => snoozeNotification(item.id, 24)}
                    >
                      Snooze 24h
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="filter-btn"
                      onClick={() => clearSnooze(item.id)}
                    >
                      Unsnooze
                    </button>
                  )}
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
