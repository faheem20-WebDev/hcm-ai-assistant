import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/me');
      const list = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead && !n.read).length);
    } catch {
      // Quiet fail if notifications endpoint not yet seeded
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Fallback update
    }
  };

  const navConfigs = {
    admin: [
      { path: '/dashboard', label: 'Dashboard', icon: '📊' },
      { path: '/organization', label: 'Organization', icon: '🏢' },
      { path: '/hr-users', label: 'HR Users', icon: '👥' },
      { path: '/employees', label: 'Employees', icon: '💼' },
      { path: '/attendance', label: 'Attendance', icon: '🕒' },
      { path: '/leave', label: 'Leave', icon: '🌴' },
      { path: '/payroll', label: 'Payroll', icon: '💰' },
      { path: '/announcements', label: 'Announcements', icon: '📢' },
      { path: '/audit', label: 'Audit', icon: '📜' },
      { path: '/ai', label: 'AI Assistant', icon: '✨' }
    ],
    hr: [
      { path: '/dashboard', label: 'Dashboard', icon: '📊' },
      { path: '/employees', label: 'Employees', icon: '💼' },
      { path: '/attendance', label: 'Attendance', icon: '🕒' },
      { path: '/leave', label: 'Leave', icon: '🌴' },
      { path: '/payroll', label: 'Payroll', icon: '💰' },
      { path: '/announcements', label: 'Announcements', icon: '📢' },
      { path: '/ai', label: 'AI Assistant', icon: '✨' }
    ],
    employee: [
      { path: '/dashboard', label: 'Dashboard', icon: '📊' },
      { path: '/attendance', label: 'Attendance', icon: '🕒' },
      { path: '/leave', label: 'Leave', icon: '🌴' },
      { path: '/payslips', label: 'Payslips', icon: '📑' },
      { path: '/profile', label: 'Profile', icon: '👤' },
      { path: '/ai', label: 'AI Assistant', icon: '✨' }
    ]
  };

  const navItems = navConfigs[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="hcm-layout">
      {mobileOpen && (
        <div className="hcm-sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`hcm-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="hcm-brand">
          <span>HCM Lite</span>
          <span className="badge-role">{user?.role}</span>
        </div>

        <nav className="hcm-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `hcm-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="hcm-user-summary">
          <div className="user-name">{user?.name || 'User'}</div>
          <div className="user-email">{user?.email || ''}</div>
        </div>
      </aside>

      <div className="hcm-main">
        <header className="hcm-header">
          <div className="hcm-header-left">
            <button
              className="hcm-mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle Navigation"
            >
              ☰
            </button>
            <div className="hcm-header-title">HCM Lite Portal</div>
          </div>

          <div className="hcm-header-right">
            <button
              className="hcm-notif-btn"
              onClick={() => setNotifOpen(!notifOpen)}
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && <span className="hcm-notif-badge">{unreadCount}</span>}
            </button>

            {notifOpen && (
              <div className="hcm-notif-dropdown">
                <div className="hcm-notif-header">
                  <span>Notifications</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {unreadCount} unread
                  </span>
                </div>
                <ul className="hcm-notif-list">
                  {notifications.length === 0 ? (
                    <li style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                      No notifications
                    </li>
                  ) : (
                    notifications.map((n) => {
                      const id = n._id || n.id;
                      const isUnread = !n.isRead && !n.read;
                      return (
                        <li
                          key={id}
                          className={`hcm-notif-item ${isUnread ? 'unread' : ''}`}
                          onClick={() => isUnread && markAsRead(id)}
                        >
                          <div className="notif-title">{n.title || 'Notification'}</div>
                          <div className="notif-msg">{n.message || n.content}</div>
                          <div className="notif-time">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}</div>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            )}

            <button className="hcm-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="hcm-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
