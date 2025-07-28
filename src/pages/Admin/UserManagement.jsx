import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '../../utils/auth';
import './UserManagement.css';

const UserManagement = () => {
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    name: '',
    email: '',
    role: ''
  });
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalPages: 0,
    totalElements: 0,
    orderBy: 'id',
    direction: 'asc'
  });

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    dateOfBirth: '',
    phoneNumber: '',
    address: '',
    role: 'USER',
    isActive: true,
    isVerified: false
  });
  const [updating, setUpdating] = useState(false);

  // Fetch users with filters and pagination
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const token = auth.getAccessToken();
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        size: pagination.size.toString(),
        orderBy: pagination.orderBy,
        direction: pagination.direction
      });

      // Add search filters if they exist
      if (searchFilters.name.trim()) {
        params.append('name', searchFilters.name.trim());
      }
      if (searchFilters.email.trim()) {
        params.append('email', searchFilters.email.trim());
      }
      if (searchFilters.role.trim()) {
        params.append('role', searchFilters.role.trim());
      }

      const response = await fetch(`/api/user/get-all-users?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setUsers(data.data.content || []);
        setPagination(prev => ({
          ...prev,
          totalPages: data.data.totalPages || 0,
          totalElements: data.data.totalElements || 0
        }));
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.size, pagination.orderBy, pagination.direction, searchFilters]);

  // Initial fetch and when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle search input changes
  const handleSearchChange = (field, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle search submit
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 0 }));
    fetchUsers();
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchFilters({
      name: '',
      email: '',
      role: ''
    });
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle sorting
  const handleSort = (field) => {
    setPagination(prev => ({
      ...prev,
      orderBy: field,
      direction: prev.orderBy === field && prev.direction === 'asc' ? 'desc' : 'asc',
      page: 0
    }));
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Get role badge class
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'role-badge admin';
      case 'USER':
        return 'role-badge user';
      default:
        return 'role-badge';
    }
  };

  // Get role display name
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'Quản trị viên';
      case 'USER':
        return 'Người dùng';
      default:
        return role;
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (active, _verified) => {
    if (active && _verified) return 'status-badge active-verified';
    if (active && !_verified) return 'status-badge active-unverified';
    if (!active) return 'status-badge inactive';
    return 'status-badge';
  };

  // Get status display name
  const getStatusDisplayName = (active, _verified) => {
    if (active && _verified) return 'Hoạt động';
    if (active && !_verified) return 'Chưa xác thực';
    if (!active) return 'Vô hiệu hóa';
    return 'Không xác định';
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName || '',
      email: user.email || '',
      dateOfBirth: user.dateOfBirth || '',
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      role: user.role || 'USER',
      isActive: user.active !== undefined ? user.active : true,
      isVerified: user._verified !== undefined ? user._verified : false
    });
    setShowEditModal(true);
  };

  // Handle edit form changes
  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update user API call
  const updateUser = async (userId, userData) => {
    try {
      const token = auth.getAccessToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`/api/user/${userId}/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        return data;
      } else {
        throw new Error(data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  // Handle update user submit
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    setUpdating(true);
    try {
      await updateUser(editingUser.id, editForm);
      
      // Refresh user list
      await fetchUsers();
      
      // Close modal
      setShowEditModal(false);
      setEditingUser(null);
      
      // Show success message (you can implement a toast notification here)
      alert('Cập nhật thông tin người dùng thành công!');
    } catch (error) {
      alert(`Lỗi khi cập nhật: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setEditForm({
      fullName: '',
      email: '',
      dateOfBirth: '',
      phoneNumber: '',
      address: '',
      role: 'USER',
      isActive: true,
      isVerified: false
    });
  };

  return (
    <div className="user-management">
      {/* Header */}
      <section className="user-header">
        <div className="header-left">
          <h2>👥 Quản Lý Người Dùng</h2>
          <p>Quản lý thông tin và quyền hạn người dùng trong hệ thống</p>
        </div>
        <div className="header-right">
          <button className="btn btn-primary" onClick={fetchUsers}>
            🔄 Làm mới
          </button>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="user-filters">
        <div className="search-grid">
          <div className="search-field">
            <label>Tìm theo tên:</label>
            <input
              type="text"
              className="search-input"
              placeholder="Nhập tên người dùng..."
              value={searchFilters.name}
              onChange={(e) => handleSearchChange('name', e.target.value)}
            />
          </div>
          <div className="search-field">
            <label>Tìm theo email:</label>
            <input
              type="email"
              className="search-input"
              placeholder="Nhập email..."
              value={searchFilters.email}
              onChange={(e) => handleSearchChange('email', e.target.value)}
            />
          </div>
          <div className="search-field">
            <label>Vai trò:</label>
            <select
              className="search-select"
              value={searchFilters.role}
              onChange={(e) => handleSearchChange('role', e.target.value)}
            >
              <option value="">Tất cả vai trò</option>
              <option value="ADMIN">Quản trị viên</option>
              <option value="USER">Người dùng</option>
            </select>
          </div>
        </div>
        <div className="filter-actions">
          <button className="btn btn-primary" onClick={handleSearch}>
            🔍 Tìm kiếm
          </button>
          <button className="btn btn-secondary" onClick={clearFilters}>
            🗑️ Xóa bộ lọc
          </button>
          <div className="total-count">
            Tổng: {pagination.totalElements} người dùng
          </div>
        </div>
      </section>

      {/* Users Content */}
      <section className="users-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner">Đang tải danh sách người dùng...</div>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-message">
              <span className="error-icon">❌</span>
              {error}
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="no-users">
            <div className="no-users-icon">👥</div>
            <h3>Không tìm thấy người dùng</h3>
            <p>Không có người dùng nào phù hợp với tiêu chí tìm kiếm của bạn.</p>
            <button className="btn btn-primary" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <>
            {/* Users Table */}
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th onClick={() => handleSort('id')}>
                      ID
                      {pagination.orderBy === 'id' && (
                        <span>{pagination.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th onClick={() => handleSort('email')}>
                      Email 
                      {pagination.orderBy === 'email' && (
                        <span>{pagination.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th onClick={() => handleSort('fullName')}>
                      Họ và tên
                      {pagination.orderBy === 'fullName' && (
                        <span>{pagination.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th>Số điện thoại</th>
                    <th>Địa chỉ</th>
                    <th>Ngày sinh</th>
                    <th onClick={() => handleSort('role')}>
                      Vai trò
                      {pagination.orderBy === 'role' && (
                        <span>{pagination.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.id || user.email || index}>
                      <td className="user-id">#{user.id}</td>
                      <td className="user-email">{user.email}</td>
                      <td className="user-name">{user.fullName || 'N/A'}</td>
                      <td className="user-phone">{user.phoneNumber || 'N/A'}</td>
                      <td className="user-address">{user.address || 'N/A'}</td>
                      <td className="user-birth">{formatDate(user.dateOfBirth)}</td>
                      <td>
                        <span className={getRoleBadgeClass(user.role)}>
                          {getRoleDisplayName(user.role)}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(user.active, user._verified)}>
                          {getStatusDisplayName(user.active, user._verified)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-edit"
                            title="Chỉnh sửa người dùng"
                            onClick={() => handleEditUser(user)}
                          >
                            ✏️ Sửa
                          </button>
                          {user.active ? (
                            <button 
                              className="btn-disable"
                              title="Vô hiệu hóa người dùng"
                            >
                              🚫 Vô hiệu hóa
                            </button>
                          ) : (
                            <button 
                              className="btn-enable"
                              title="Kích hoạt người dùng"
                            >
                              ✅ Kích hoạt
                            </button>
                          )}
                          <button 
                            className="btn-delete"
                            title="Xóa người dùng"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button
                className={`pagination-btn ${pagination.page === 0 ? 'disabled' : ''}`}
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 0}
              >
                ← Trang trước
              </button>
              
              <div className="pagination-info">
                <span>Trang {pagination.page + 1} / {pagination.totalPages}</span>
                <span>Hiển thị {users.length} / {pagination.totalElements} người dùng</span>
              </div>
              
              <button
                className={`pagination-btn ${pagination.page >= pagination.totalPages - 1 ? 'disabled' : ''}`}
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages - 1}
              >
                Trang sau →
              </button>
            </div>
          </>
        )}
      </section>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h3>✏️ Chỉnh sửa thông tin người dùng</h3>
              <button className="close-btn" onClick={closeEditModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Họ và tên:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.fullName}
                    onChange={(e) => handleEditFormChange('fullName', e.target.value)}
                    placeholder="Nhập họ và tên..."
                  />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editForm.email}
                    onChange={(e) => handleEditFormChange('email', e.target.value)}
                    placeholder="Nhập email..."
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại:</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={editForm.phoneNumber}
                    onChange={(e) => handleEditFormChange('phoneNumber', e.target.value)}
                    placeholder="Nhập số điện thoại..."
                  />
                </div>
                <div className="form-group">
                  <label>Ngày sinh:</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editForm.dateOfBirth}
                    onChange={(e) => handleEditFormChange('dateOfBirth', e.target.value)}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Địa chỉ:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.address}
                    onChange={(e) => handleEditFormChange('address', e.target.value)}
                    placeholder="Nhập địa chỉ..."
                  />
                </div>
                <div className="form-group">
                  <label>Vai trò:</label>
                  <select
                    className="form-select"
                    value={editForm.role}
                    onChange={(e) => handleEditFormChange('role', e.target.value)}
                  >
                    <option value="USER">Người dùng</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Trạng thái tài khoản:</label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editForm.isActive}
                        onChange={(e) => handleEditFormChange('isActive', e.target.checked)}
                      />
                      Tài khoản hoạt động
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editForm.isVerified}
                        onChange={(e) => handleEditFormChange('isVerified', e.target.checked)}
                      />
                      Đã xác thực email
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={closeEditModal}
                disabled={updating}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleUpdateUser}
                disabled={updating}
              >
                {updating ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
