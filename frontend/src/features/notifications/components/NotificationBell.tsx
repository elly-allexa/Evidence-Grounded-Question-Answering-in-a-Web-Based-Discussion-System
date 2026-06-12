import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '../api/notificationsApi';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (popoverRef.current && !popoverRef.current.contains(target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  async function handleOpen() {
    setIsOpen((prev) => !prev);
    await loadNotifications();
  }

  async function handleRead(id: string) {
    const updated = await markNotificationRead(id);

    setNotifications((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function handleReadAll() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  }

  return (
    <div className="notification-bell" ref={popoverRef}>
      <button type="button" className="app-nav__link" onClick={handleOpen}>
        Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
      </button>

      {isOpen && (
        <div className="notification-popover">
          <div className="notification-popover__header">
            <h3>Notifications</h3>

            <button
              type="button"
              className="notification-popover__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
            >
              x
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              className="button--ghost notification-popover__read-all"
              onClick={handleReadAll}
            >
              Mark all read
            </button>
          )}

          {notifications.length === 0 ? (
            <p className="forum-card__status">No notifications yet.</p>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`notification-item ${
                    notification.isRead ? '' : 'notification-item--unread'
                  }`}
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
