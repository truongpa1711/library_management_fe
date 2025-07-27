import React from 'react';
import { auth } from '../../utils/auth';
import './RoleDemo.css';

const RoleDemo = () => {
  const userEmail = auth.getUserEmail();
  const userRole = auth.getUserRole();
  const isAdmin = auth.isAdmin();
  const isUser = auth.isUser();

  return (
    <div className="role-demo">
      <div className="role-info-card">
        <h2>🔐 Role-Based Access Demo</h2>
        
        <div className="current-user-info">
          <h3>Current User Information:</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{userEmail}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Role:</span>
              <span className={`info-value role-badge ${userRole?.toLowerCase()}`}>
                {userRole}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Is Admin:</span>
              <span className={`info-value ${isAdmin ? 'yes' : 'no'}`}>
                {isAdmin ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Is User:</span>
              <span className={`info-value ${isUser ? 'yes' : 'no'}`}>
                {isUser ? '✅ Yes' : '❌ No'}
              </span>
            </div>
          </div>
        </div>

        <div className="access-demo">
          <h3>Access Control Demo:</h3>
          
          {isAdmin ? (
            <div className="access-section admin-access">
              <h4>🔧 Admin Access Granted</h4>
              <ul>
                <li>✅ Can access admin dashboard</li>
                <li>✅ Can manage books</li>
                <li>✅ Can manage users</li>
                <li>✅ Can view reports</li>
                <li>✅ Can access settings</li>
                <li>✅ Can switch to user view</li>
              </ul>
            </div>
          ) : (
            <div className="access-section user-access">
              <h4>👤 User Access</h4>
              <ul>
                <li>✅ Can browse books</li>
                <li>✅ Can manage personal books</li>
                <li>✅ Can view borrow history</li>
                <li>✅ Can edit profile</li>
                <li>❌ Cannot access admin dashboard</li>
                <li>❌ Cannot manage other users</li>
              </ul>
            </div>
          )}
        </div>

        <div className="test-instructions">
          <h3>🧪 Testing Instructions:</h3>
          <div className="instructions-list">
            <div className="instruction-item">
              <strong>For USER role:</strong>
              <p>Try accessing <code>/admin</code> - you should be redirected to user dashboard</p>
            </div>
            <div className="instruction-item">
              <strong>For ADMIN role:</strong>
              <p>You can access both <code>/</code> (user view) and <code>/admin</code> (admin view)</p>
            </div>
            <div className="instruction-item">
              <strong>Login Response:</strong>
              <p>The login API now returns role in the response data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleDemo;
