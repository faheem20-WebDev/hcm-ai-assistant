import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import FloatingRobotAssistant from './FloatingRobotAssistant';
import './Layout.css';

// Inline Icons for crisp SVG rendering without external libraries
const NavIcons = {
  dashboard: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  organization: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  hrUsers: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  employees: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
    </svg>
  ),
  attendance: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  leave: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  payroll: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  payslips: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  profile: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  announcements: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  audit: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  ai: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
};

const TinyRobotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="8" width="16" height="12" rx="4" fill="#0F1224" stroke="#14B8A6" strokeWidth="1.5" />
    <circle cx="8.5" cy="13" r="1.5" fill="#2DD4BF" />
    <circle cx="15.5" cy="13" r="1.5" fill="#2DD4BF" />
    <path d="M10.5 16.5C11 17 13 17 13.5 16.5" stroke="#14B8A6" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="12" y1="8" x2="12" y2="4" stroke="#5B5BD6" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="3.5" r="1.5" fill="#14B8A6" />
    <rect x="2" y="11" width="2" height="4" rx="1" fill="#14B8A6" />
    <rect x="20" y="11" width="2" height="4" rx="1" fill="#14B8A6" />
  </svg>
);

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Dark Mode Theme State (defaults to prefers-color-scheme, persists in localStorage)
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('hcm_theme');
      if (saved) return saved;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('hcm_theme', theme);
    } catch {
      // storage unavailable
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/me');
      const list = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead && !n.read).length);
    } catch {
      // Quiet fail if not yet available
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
      // Fallback
    }
  };

  const navConfigs = {
    admin: [
      { path: '/dashboard', label: 'Dashboard', icon: NavIcons.dashboard },
      { path: '/organization', label: 'Organization', icon: NavIcons.organization },
      { path: '/hr-users', label: 'HR Users', icon: NavIcons.hrUsers },
      { path: '/employees', label: 'Employees', icon: NavIcons.employees },
      { path: '/attendance', label: 'Attendance', icon: NavIcons.attendance },
      { path: '/leave', label: 'Leave', icon: NavIcons.leave },
      { path: '/payroll', label: 'Payroll', icon: NavIcons.payroll },
      { path: '/announcements', label: 'Announcements', icon: NavIcons.announcements },
      { path: '/audit', label: 'Audit Trail', icon: NavIcons.audit }
    ],
    hr: [
      { path: '/dashboard', label: 'Dashboard', icon: NavIcons.dashboard },
      { path: '/employees', label: 'Employees', icon: NavIcons.employees },
      { path: '/attendance', label: 'Attendance', icon: NavIcons.attendance },
      { path: '/leave', label: 'Leave', icon: NavIcons.leave },
      { path: '/payroll', label: 'Payroll', icon: NavIcons.payroll },
      { path: '/announcements', label: 'Announcements', icon: NavIcons.announcements }
    ],
    employee: [
      { path: '/dashboard', label: 'Dashboard', icon: NavIcons.dashboard },
      { path: '/attendance', label: 'Attendance', icon: NavIcons.attendance },
      { path: '/leave', label: 'Leave', icon: NavIcons.leave },
      { path: '/payslips', label: 'Payslips', icon: NavIcons.payslips },
      { path: '/profile', label: 'Profile', icon: NavIcons.profile }
    ]
  };

  const navItems = navConfigs[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Derive current page title for breadcrumb
  const currentNavItem = navItems.find((item) => item.path === location.pathname);
  const pageTitle = currentNavItem ? currentNavItem.label : 'Dashboard';

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="hcm-layout">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="hcm-sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      {/* Modern Sidebar with Indigo-Violet Gradient */}
      <aside className={`hcm-sidebar ${mobileOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        {/* Brand Header */}
        <div className="hcm-brand">
          <div className="hcm-brand-left">
            <div className="hcm-brand-icon">
              <TinyRobotIcon />
            </div>
            {!collapsed && (
              <>
                <span className="hcm-brand-text">HCM Lite</span>
                <span className="hcm-brand-badge">{user?.role}</span>
              </>
            )}
          </div>

          <button
            className="hcm-sidebar-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar collapse"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="hcm-nav">
          {!collapsed && <div className="hcm-nav-group-label">WORKSPACE MENU</div>}
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `hcm-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
            >
              <span className="hcm-nav-icon">{item.icon}</span>
              <span className="hcm-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Mini-Card at Bottom */}
        <div className="hcm-user-card">
          <NavLink
            to={user?.role === 'employee' ? '/profile' : '/dashboard'}
            className="hcm-user-profile-btn"
            title={user?.name || 'User Profile'}
          >
            <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
              {userInitials}
            </div>
            {!collapsed && (
              <div className="hcm-user-info">
                <span className="hcm-user-name">{user?.name || 'User'}</span>
                <span className="hcm-user-role-badge">{user?.role}</span>
              </div>
            )}
          </NavLink>

          <button
            className="hcm-logout-icon-btn"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Logout"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content & Top Bar */}
      <div className="hcm-main">
        <header className="hcm-header">
          <div className="hcm-header-left">
            <button
              className="hcm-mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation drawer"
            >
              ☰
            </button>

            <div className="hcm-breadcrumb">
              <span>Portal</span>
              <span>/</span>
              <span className="hcm-breadcrumb-active">{pageTitle}</span>
            </div>
          </div>

          <div className="hcm-header-right">
            {/* Animated Dark Mode Sun/Moon Toggle */}
            <button
              className="hcm-theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle dark mode theme"
            >
              {theme === 'dark' ? (
                /* Sun Icon */
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                /* Moon Icon */
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Notifications Button */}
            <button
              className="hcm-notif-btn"
              onClick={() => setNotifOpen(!notifOpen)}
              title="Notifications"
              aria-label="Notifications"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && <span className="hcm-notif-badge">{unreadCount}</span>}
            </button>

            {/* Notifications Dropdown */}
            {notifOpen && (
              <div className="hcm-notif-dropdown">
                <div className="hcm-notif-header">
                  <span>Notifications</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {unreadCount} unread
                  </span>
                </div>
                <ul className="hcm-notif-list">
                  {notifications.length === 0 ? (
                    <li style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
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
          </div>
        </header>

        {/* Page Content with smooth transition */}
        <main className="hcm-content">
          <div key={location.pathname} className="page-transition-wrapper">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Animated Robot Assistant & Popup Chat on Every Screen */}
      <FloatingRobotAssistant user={user} />
    </div>
  );
};

export default Layout;
