import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
} from '../api/notificationsApi';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  async function loadNotifications() {
    const [items, count] = await Promise.all([
      fetchNotifications(),
      fetchUnreadNotificationCount(),
    ]);

    setNotifications(items);
    setUnreadCount(count);
  }

  useEffect(() => {
    void loadNotifications();

    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, []);

  async function handleOpen() {
    setIsOpen((prev) => !prev);
    await loadNotifications();
  }

  async function handleNotificationClick(notification: AppNotification) {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
      await loadNotifications();
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsAsRead();
    await loadNotifications();
  }

  return (
    <div className="notification-bell">
      <button type="button" className="app-nav__link notification-bell__button" onClick={handleOpen}>
        🔔
        {unreadCount > 0 && <span className="notification-bell__badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown__header">
            <strong>Notifications</strong>

            <button type="button" className="button--ghost" onClick={handleMarkAllRead}>
              Mark all read
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="forum-card__status">No notifications yet.</p>
          ) : (
            <div className="notification-dropdown__list">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={notification.link ?? '/'}
                  className={`notification-item ${
                    notification.isRead ? 'notification-item--read' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <small>{new Date(notification.createdAt).toLocaleString()}</small>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
