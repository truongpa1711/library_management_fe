import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, apiCall } from '../utils/auth';
import './UserLayout.css';

const UserLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname);
  const userEmail = auth.getUserEmail();
  const userRole = auth.getUserRole();

  const userTabs = [
    { id: '/', label: 'Dashboard', icon: '🏠' },
    { id: '/books', label: 'Browse Books', icon: '📚' },
    { id: '/all-books', label: 'All Books', icon: '🔍' },
    { id: '/my-loans', label: 'Sách đã mượn', icon: '📖' },
    { id: '/my-fines', label: 'Phiếu phạt', icon: '💰' },
    { id: '/my-reservations', label: 'Đặt trước', icon: '📅' },
    { id: '/history', label: 'Borrow History', icon: '📋' },
    { id: '/profile', label: 'Profile', icon: '👤' },
    { id: '/role-demo', label: 'Role Demo', icon: '🔐' }
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

  return (
    <div className="user-layout">
      {/* Header */}
      <header className="user-header">
        <div className="header-left">
          <h1 className="app-title">📚 Library System</h1>
          <span className="user-badge">User Portal</span>
        </div>
        <div className="header-right">
          {auth.isAdmin() && (
            <button onClick={() => navigate('/admin')} className="admin-panel-btn">
              🔧 Admin Panel
            </button>
          )}
          <div className="user-info">
            <span className="user-email">👤 {userEmail}</span>
            <span className="user-role">({userRole})</span>
            <button onClick={handleLogout} className="logout-btn">
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="user-nav">
        <div className="nav-tabs">
          {userTabs.map((tab) => (
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
      <main className="user-main">
        <div className="content-wrapper">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="user-footer">
        <p>&copy; 2025 Library Management System - User Portal</p>
      </footer>
    </div>
  );
};

export default UserLayout;
