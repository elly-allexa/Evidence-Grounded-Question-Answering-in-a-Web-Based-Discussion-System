import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchNotifications,
  markNotificationRead,
  type AppNotification,
} from '../api/notificationsApi';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  async function loadNotifications() {
    const data = await fetchNotifications();
    setNotifications(data);
  }

  useEffect(() => {
    void loadNotifications();

    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, []);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  async function handleOpen() {
    setIsOpen((prev) => !prev);
    await loadNotifications();
  }

  async function handleRead(id: string) {
    const updated = await markNotificationRead(id);

    setNotifications((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  }

  return (
    <div className="notification-bell">
      <button type="button" className="app-nav__link" onClick={handleOpen}>
        Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
      </button>

      {isOpen && (
        <div className="notification-popover">
          <h3>Notifications</h3>

          {notifications.length === 0 ? (
            <p className="forum-card__status">No notifications yet.</p>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`notification-item ${notification.isRead ? '' : 'notification-item--unread'}`}
                >
                  <strong>{notification.title}</strong>
                  <p>{notification.message}</p>
                  <small>{new Date(notification.createdAt).toLocaleString()}</small>

                  <div className="action-row">
                    {notification.link && (
                      <Link
                        className="app-nav__link"
                        to={notification.link}
                        onClick={() => setIsOpen(false)}
                      >
                        Open
                      </Link>
                    )}

                    {!notification.isRead && (
                      <button type="button" onClick={() => handleRead(notification.id)}>
                        Mark read
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
