import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, apiCall } from '../utils/auth';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname);
  const userEmail = auth.getUserEmail();

  // Double check if user is admin
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
    { id: '/admin/categories', label: 'Manage Categories', icon: '🏷️' },
    { id: '/admin/users', label: 'Manage Users', icon: '👥' },
    { id: '/admin/loans', label: 'Loan Management', icon: '📋' },
    { id: '/admin/fines', label: 'Fine Management', icon: '💰' },
    { id: '/admin/reservations', label: 'Manage Reservations', icon: '📅' },
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
        await apiCall('/api/user/logout', {
          method: 'POST'
        });
        console.log('Logout API called successfully');
      } catch (error) {
        console.log('Logout API error:', error);
      } finally {
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
        <div className="header-content">
          <div className="header-left">
            <h1>📚 Library Admin Panel</h1>
            <p>Welcome back, {userEmail}</p>
          </div>
          <div className="header-right">
            <button 
              className="btn-switch"
              onClick={switchToUserView}
              title="Switch to User View"
            >
              👤 User View
            </button>
            <button 
              className="btn-logout"
              onClick={handleLogout}
              title="Logout"
            >
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
