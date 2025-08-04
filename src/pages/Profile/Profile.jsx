import React, { useState, useEffect } from 'react';
import { apiCall, auth } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  
  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiCall('/api/user', {
        method: 'GET'
      });

      console.log('API Response:', response);

      if (response && response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        if (data.status === 'success') {
          setProfileData(data.data);
          setEditData(data.data);
        } else {
          setError(data.message || 'Failed to load profile');
        }
      } else {
        console.log('Response status:', response?.status);
        console.log('Response statusText:', response?.statusText);
        setError(`Failed to fetch profile data. Status: ${response?.status || 'Unknown'}`);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiCall('/api/user', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: editData.fullName,
          phoneNumber: editData.phoneNumber,
          address: editData.address,
          dateOfBirth: editData.dateOfBirth
        })
      });

      if (response && response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setProfileData(data.data);
          setIsEditing(false);
          alert('Profile updated successfully!');
        } else {
          setError(data.message || 'Failed to update profile');
        }
      } else {
        setError('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData(profileData);
    setIsEditing(false);
    setError('');
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (passwordError) setPasswordError('');
  };

  const validatePasswordForm = () => {
    if (!passwordData.currentPassword) {
      setPasswordError('Current password is required');
      return false;
    }
    if (!passwordData.newPassword) {
      setPasswordError('New password is required');
      return false;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return false;
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from current password');
      return false;
    }
    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    setPasswordLoading(true);
    setPasswordError('');

    try {
      console.log('Sending password change request with:', {
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      const response = await apiCall('/api/user/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          oldPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      console.log('Password change response:', response);

      if (response && response.ok) {
        const data = await response.json();
        console.log('Password change success data:', data);
        if (data.status === 'success') {
          alert('Password changed successfully!');
          setShowPasswordForm(false);
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        } else {
          setPasswordError(data.message || 'Failed to change password');
        }
      } else {
        // Try to get error details from response
        let errorMessage = 'Failed to change password';
        try {
          const errorData = await response.json();
          console.log('Password change error data:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          console.log('Could not parse error response:', parseError);
        }
        setPasswordError(errorMessage);
      }
    } catch (error) {
      console.error('Change password error:', error);
      setPasswordError('Network error. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setShowPasswordForm(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordError('');
  };

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) {
      return;
    }

    try {
      // Call logout API
      await apiCall('/api/user/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.log('Logout API error:', error);
      // Continue with logout even if API fails
    } finally {
      // Clear tokens and redirect
      auth.clearTokens();
      navigate('/login');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  };

  const getRoleDisplay = (role) => {
    return role === 'ADMIN' ? '👨‍💼 Administrator' : '👤 User';
  };

  if (loading && !profileData) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>👤 User Profile</h1>
        <p>Manage your personal information</p>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}

      {profileData && (
        <div className="profile-content">
          <div className="profile-card">
            <div className="card-header">
              <h2>Personal Information</h2>
              <div className="header-actions">
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="edit-btn"
                    disabled={loading}
                  >
                    ✏️ Edit Profile
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button 
                      onClick={handleSave} 
                      className="save-btn"
                      disabled={loading}
                    >
                      {loading ? '💾 Saving...' : '💾 Save'}
                    </button>
                    <button 
                      onClick={handleCancel} 
                      className="cancel-btn"
                      disabled={loading}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="profile-fields">
              {/* Email - Read only */}
              <div className="field-group">
                <label className="field-label">
                  <span className="label-icon">📧</span>
                  Email Address
                </label>
                <div className="field-value readonly">
                  {profileData.email}
                  <span className="readonly-badge">Read Only</span>
                </div>
              </div>

              {/* Full Name */}
              <div className="field-group">
                <label className="field-label">
                  <span className="label-icon">👤</span>
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.fullName || ''}
                    onChange={(e) => handleEditChange('fullName', e.target.value)}
                    className="field-input"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="field-value">
                    {profileData.fullName || 'Not provided'}
                  </div>
                )}
              </div>

              {/* Phone Number */}
              <div className="field-group">
                <label className="field-label">
                  <span className="label-icon">📱</span>
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phoneNumber || ''}
                    onChange={(e) => handleEditChange('phoneNumber', e.target.value)}
                    className="field-input"
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <div className="field-value">
                    {profileData.phoneNumber || 'Not provided'}
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="field-group">
                <label className="field-label">
                  <span className="label-icon">🏠</span>
                  Address
                </label>
                {isEditing ? (
                  <textarea
                    value={editData.address || ''}
                    onChange={(e) => handleEditChange('address', e.target.value)}
                    className="field-textarea"
                    placeholder="Enter your address"
                    rows="3"
                  />
                ) : (
                  <div className="field-value">
                    {profileData.address || 'Not provided'}
                  </div>
                )}
              </div>

              {/* Date of Birth */}
              <div className="field-group">
                <label className="field-label">
                  <span className="label-icon">🎂</span>
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editData.dateOfBirth || ''}
                    onChange={(e) => handleEditChange('dateOfBirth', e.target.value)}
                    className="field-input"
                  />
                ) : (
                  <div className="field-value">
                    {profileData.dateOfBirth ? formatDate(profileData.dateOfBirth) : 'Not provided'}
                  </div>
                )}
              </div>

              {/* Role - Read only */}
              <div className="field-group">
                <label className="field-label">
                  <span className="label-icon">🔐</span>
                  Account Role
                </label>
                <div className="field-value readonly">
                  {getRoleDisplay(profileData.role)}
                  <span className="role-badge" data-role={profileData.role.toLowerCase()}>
                    {profileData.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Stats */}
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-label">Account Status</span>
                <span className="stat-value active">✅ Active</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Member Since</span>
                <span className="stat-value">📅 {new Date().getFullYear()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Last Updated</span>
                <span className="stat-value">🕒{new Date(profileData.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Additional Actions */}
          <div className="profile-actions">
            <button 
              onClick={fetchProfileData} 
              className="refresh-btn"
              disabled={loading}
            >
              🔄 Refresh Profile
            </button>
            <button 
              onClick={() => setShowPasswordForm(!showPasswordForm)} 
              className="change-password-btn"
              disabled={loading || isEditing}
            >
              🔐 Change Password
            </button>
            <button 
              onClick={handleLogout} 
              className="logout-btn"
              disabled={loading}
            >
              🚪 Logout
            </button>
          </div>

          {/* Password Change Form */}
          {showPasswordForm && (
            <div className="password-form-container">
              <div className="password-form-card">
                <div className="card-header">
                  <h3>🔐 Change Password</h3>
                  <button 
                    onClick={handleCancelPasswordChange}
                    className="close-form-btn"
                    disabled={passwordLoading}
                  >
                    ×
                  </button>
                </div>

                {passwordError && (
                  <div className="error-message">
                    <span>⚠️ {passwordError}</span>
                    <button onClick={() => setPasswordError('')} className="close-error">×</button>
                  </div>
                )}

                <div className="password-form-fields">
                  <div className="field-group">
                    <label className="field-label">
                      <span className="label-icon">🔒</span>
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      className="field-input"
                      placeholder="Enter your current password"
                      disabled={passwordLoading}
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label">
                      <span className="label-icon">🔑</span>
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      className="field-input"
                      placeholder="Enter your new password (min 8 characters)"
                      disabled={passwordLoading}
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label">
                      <span className="label-icon">🔐</span>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      className="field-input"
                      placeholder="Confirm your new password"
                      disabled={passwordLoading}
                    />
                  </div>

                  <div className="password-form-actions">
                    <button 
                      onClick={handleChangePassword}
                      className="save-password-btn"
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? '🔄 Changing...' : '💾 Change Password'}
                    </button>
                    <button 
                      onClick={handleCancelPasswordChange}
                      className="cancel-password-btn"
                      disabled={passwordLoading}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
