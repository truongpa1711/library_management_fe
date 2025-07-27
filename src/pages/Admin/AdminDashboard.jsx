import React from 'react';
import { auth } from '../../utils/auth';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const userEmail = auth.getUserEmail();

  const adminStats = [
    { label: 'Total Books', value: '1,247', icon: '📚', color: '#4a90e2', change: '+12' },
    { label: 'Active Users', value: '156', icon: '👥', color: '#28a745', change: '+8' },
    { label: 'Books Borrowed', value: '89', icon: '📖', color: '#ffc107', change: '-3' },
    { label: 'Overdue Books', value: '7', icon: '⚠️', color: '#dc3545', change: '+2' }
  ];

  const recentActivities = [
    { user: 'john.doe@email.com', action: 'borrowed', book: 'JavaScript Guide', time: '2 hours ago' },
    { user: 'jane.smith@email.com', action: 'returned', book: 'Clean Code', time: '3 hours ago' },
    { user: 'admin', action: 'added', book: 'React Patterns', time: '5 hours ago' },
    { user: 'mike.jones@email.com', action: 'reserved', book: 'Node.js Design', time: '6 hours ago' }
  ];

  const systemAlerts = [
    { type: 'warning', message: '7 books are overdue and need attention', time: '1 hour ago' },
    { type: 'info', message: 'Database backup completed successfully', time: '2 hours ago' },
    { type: 'success', message: '12 new books added to the library', time: '4 hours ago' }
  ];

  return (
    <div className="admin-dashboard">
      {/* Welcome Section */}
      <section className="admin-welcome">
        <div className="welcome-content">
          <h1>Admin Dashboard 🔧</h1>
          <p>Welcome back, <strong>{userEmail}</strong>. Here's your library overview.</p>
        </div>
        <div className="admin-actions">
          <button className="action-btn primary">📝 Quick Add Book</button>
          <button className="action-btn secondary">📊 Generate Report</button>
        </div>
      </section>

      {/* Admin Stats */}
      <section className="admin-stats">
        <h2>System Overview</h2>
        <div className="stats-grid">
          {adminStats.map((stat, index) => (
            <div key={index} className="admin-stat-card" style={{ borderLeftColor: stat.color }}>
              <div className="stat-header">
                <div className="stat-icon" style={{ color: stat.color }}>
                  {stat.icon}
                </div>
                <div className={`stat-change ${stat.change.startsWith('+') ? 'positive' : 'negative'}`}>
                  {stat.change}
                </div>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="dashboard-grid">
        {/* Recent Activities */}
        <section className="recent-activities">
          <h2>Recent Activities</h2>
          <div className="activities-list">
            {recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {activity.action === 'borrowed' && '📖'}
                  {activity.action === 'returned' && '✅'}
                  {activity.action === 'added' && '➕'}
                  {activity.action === 'reserved' && '🔖'}
                </div>
                <div className="activity-details">
                  <div className="activity-text">
                    <strong>{activity.user}</strong> {activity.action} "{activity.book}"
                  </div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="view-all-btn">View All Activities</button>
        </section>

        {/* System Alerts */}
        <section className="system-alerts">
          <h2>System Alerts</h2>
          <div className="alerts-list">
            {systemAlerts.map((alert, index) => (
              <div key={index} className={`alert-item ${alert.type}`}>
                <div className="alert-icon">
                  {alert.type === 'warning' && '⚠️'}
                  {alert.type === 'info' && 'ℹ️'}
                  {alert.type === 'success' && '✅'}
                </div>
                <div className="alert-content">
                  <div className="alert-message">{alert.message}</div>
                  <div className="alert-time">{alert.time}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="view-all-btn">View All Alerts</button>
        </section>
      </div>

      {/* Quick Actions */}
      <section className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button className="quick-action-card">
            <div className="action-icon">📚</div>
            <div className="action-title">Add New Book</div>
            <div className="action-desc">Add books to the library</div>
          </button>
          <button className="quick-action-card">
            <div className="action-icon">👤</div>
            <div className="action-title">Manage Users</div>
            <div className="action-desc">View and edit user accounts</div>
          </button>
          <button className="quick-action-card">
            <div className="action-icon">📊</div>
            <div className="action-title">View Reports</div>
            <div className="action-desc">Generate system reports</div>
          </button>
          <button className="quick-action-card">
            <div className="action-icon">⚙️</div>
            <div className="action-title">System Settings</div>
            <div className="action-desc">Configure system preferences</div>
          </button>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
