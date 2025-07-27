import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, apiCall } from '../utils/auth';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname);
  const userEmail = auth.getUserEmail();
  const userRole = auth.getUserRole();

  // Double check if user is admin (should be handled by AdminProtectedRoute, but just in case)
  if (!auth.isAdmin()) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        background: '#fff3cd', 
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        margin: '2rem'
      }}>
        <h2>⚠️ Access Denied</h2>
        <p>You need admin privileges to access this area.</p>
        <button 
          onClick={() => navigate('/')}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Go to User Dashboard
        </button>
      </div>
    );
  }

  const adminTabs = [
    { id: '/admin', label: 'Dashboard', icon: '📊' },
    { id: '/admin/books', label: 'Manage Books', icon: '📚' },
    { id: '/admin/users', label: 'Manage Users', icon: '👥' },
    { id: '/admin/borrows', label: 'Borrow Requests', icon: '📝' },
    { id: '/admin/reservations', label: 'Manage Reservations', icon: '📋' },
    { id: '/admin/feedbacks', label: 'Manage Feedbacks', icon: '💬' },
    { id: '/admin/reports', label: 'Reports', icon: '📈' },
    { id: '/admin/settings', label: 'Settings', icon: '⚙️' }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(tabId);
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        // Call logout API
        await apiCall('/api/user/logout', {
          method: 'POST'
        });
        console.log('Logout API called successfully');
      } catch (error) {
        console.log('Logout API error:', error);
        // Continue with logout even if API fails
      } finally {
        // Clear tokens and redirect
        auth.clearTokens();
        navigate('/login');
      }
    }
  };

  const switchToUserView = () => {
    navigate('/');
  };

  return (
    <div className="admin-layout">
      {/* Header */}
      <header className="admin-header">
        <div className="header-left">
          <h1 className="app-title">🔧 Library Admin</h1>
          <span className="admin-badge">Admin Portal</span>
        </div>
        <div className="header-right">
          <button onClick={switchToUserView} className="switch-view-btn">
            👤 Switch to User View
          </button>
          <div className="user-info">
            <span className="user-email">👨‍💼 {userEmail}</span>
            <span className="user-role">({userRole})</span>
            <button onClick={handleLogout} className="logout-btn">
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="admin-nav">
        <div className="nav-tabs">
          {adminTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-main">
        <div className="content-wrapper">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="admin-footer">
        <p>&copy; 2025 Library Management System - Admin Portal</p>
      </footer>
    </div>
  );
};

export default AdminLayout;
