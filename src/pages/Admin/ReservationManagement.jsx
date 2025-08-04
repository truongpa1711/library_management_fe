import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '../../utils/auth';
import './ReservationManagement.css';

const ReservationManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter and pagination state
  const [filters, setFilters] = useState({
    status: '',
    userEmail: '',
    bookTitle: '',
    fromDate: '',
    toDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  });

  // Modal state for status update
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDeleteReservation, setSelectedDeleteReservation] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchReservations = useCallback(async (page = 0, appliedFilters = filters) => {
    setLoading(true);
    setError('');

    try {
      const token = auth.getAccessToken();
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: pagination.size.toString()
      });

      // Add filters to query params
      if (appliedFilters.status) {
        queryParams.append('status', appliedFilters.status);
      }
      if (appliedFilters.fromDate) {
        queryParams.append('fromDate', appliedFilters.fromDate);
      }
      if (appliedFilters.toDate) {
        queryParams.append('toDate', appliedFilters.toDate);
      }

      const response = await fetch(`/api/reservations/admin?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const reservationsData = data.data?.content || data.data || [];
        setReservations(reservationsData);
        
        // Update pagination info if available
        if (data.data?.pageable) {
          setPagination(prev => ({
            ...prev,
            page: data.data.pageable.pageNumber || 0,
            totalElements: data.data.totalElements || 0,
            totalPages: data.data.totalPages || 0
          }));
        }
      } else {
        setError(data.message || 'Failed to fetch reservations');
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [pagination.size, filters]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Apply client-side filtering for userEmail and bookTitle (since API might not support these)
  useEffect(() => {
    let filtered = reservations;

    if (filters.userEmail) {
      filtered = filtered.filter(reservation => 
        reservation.userEmail?.toLowerCase().includes(filters.userEmail.toLowerCase())
      );
    }

    if (filters.bookTitle) {
      filtered = filtered.filter(reservation => 
        reservation.bookTitle?.toLowerCase().includes(filters.bookTitle.toLowerCase())
      );
    }

    setFilteredReservations(filtered);
  }, [reservations, filters.userEmail, filters.bookTitle]);

  const handleFilterChange = (filterKey, value) => {
    const newFilters = {
      ...filters,
      [filterKey]: value
    };
    setFilters(newFilters);
    
    // Reset pagination to first page and fetch with new filters
    setPagination(prev => ({ ...prev, page: 0 }));
    fetchReservations(0, newFilters);
  };

  const handleUpdateStatus = (reservation) => {
    setSelectedReservation(reservation);
    setNewStatus(reservation.status);
    setShowUpdateModal(true);
  };

  const handleDeleteReservation = (reservation) => {
    setSelectedDeleteReservation(reservation);
    setShowDeleteModal(true);
  };

  const confirmUpdateStatus = async () => {
    if (!selectedReservation || !newStatus) return;

    setUpdating(true);

    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const response = await fetch(`/api/reservations/admin/update-status/${selectedReservation.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert('Reservation status updated successfully!');
        setShowUpdateModal(false);
        setSelectedReservation(null);
        setNewStatus('');
        fetchReservations(pagination.page);
      } else {
        alert(data.message || 'Failed to update reservation status');
      }
    } catch (error) {
      console.error('Error updating reservation status:', error);
      alert('Network error. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const confirmDeleteReservation = async () => {
    if (!selectedDeleteReservation) return;

    setDeleting(true);

    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const response = await fetch(`/api/reservations/admin/${selectedDeleteReservation.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert(`Đã xóa đặt trước thành công!\nID: #${selectedDeleteReservation.id}\nSách: ${selectedDeleteReservation.bookTitle}`);
        setShowDeleteModal(false);
        setSelectedDeleteReservation(null);
        fetchReservations(pagination.page);
      } else {
        alert(data.message || 'Failed to delete reservation');
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      alert('Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedDeleteReservation(null);
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return '#ffc107';
      case 'APPROVED':
        return '#17a2b8';
      case 'FULFILLED':
        return '#28a745';
      case 'CANCELLED':
        return '#dc3545';
      case 'REJECTED':
        return '#6c757d';
      default:
        return '#007bff';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'Chờ xử lý';
      case 'APPROVED':
        return 'Đã duyệt';
      case 'FULFILLED':
        return 'Đã hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'REJECTED':
        return 'Bị từ chối';
      default:
        return status;
    }
  };

  // Statistics calculation
  const stats = {
    total: filteredReservations.length,
    pending: filteredReservations.filter(r => r.status === 'PENDING').length,
    approved: filteredReservations.filter(r => r.status === 'APPROVED').length,
    fulfilled: filteredReservations.filter(r => r.status === 'FULFILLED').length,
    cancelled: filteredReservations.filter(r => r.status === 'CANCELLED' || r.status === 'REJECTED').length
  };

  if (loading && reservations.length === 0) {
    return (
      <div className="reservation-management-page">
        <div className="loading-container">
          <div className="loading-spinner">Đang tải danh sách đặt trước...</div>
        </div>
      </div>
    );
  }

  if (error && reservations.length === 0) {
    return (
      <div className="reservation-management-page">
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button className="btn btn-primary" onClick={() => fetchReservations()}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reservation-management-page">
      {/* Page Header */}
      <div className="page-header">
        <h1>📋 Quản lý Đặt trước</h1>
        <p>Quản lý tất cả yêu cầu đặt trước sách từ người dùng</p>
      </div>

      {/* Statistics Summary */}
      <div className="reservations-stats">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{pagination.totalElements || stats.total}</h3>
            <p>Tổng đặt trước</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Chờ xử lý</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✔️</div>
          <div className="stat-content">
            <h3>{stats.approved}</h3>
            <p>Đã duyệt</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.fulfilled}</h3>
            <p>Đã hoàn thành</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>{stats.cancelled}</h3>
            <p>Đã hủy/Từ chối</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Trạng thái:</label>
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="FULFILLED">Đã hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="REJECTED">Bị từ chối</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Email người dùng:</label>
            <input
              type="text"
              placeholder="Tìm theo email..."
              value={filters.userEmail}
              onChange={(e) => handleFilterChange('userEmail', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Tên sách:</label>
            <input
              type="text"
              placeholder="Tìm theo tên sách..."
              value={filters.bookTitle}
              onChange={(e) => handleFilterChange('bookTitle', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Từ ngày:</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => handleFilterChange('fromDate', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Đến ngày:</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => handleFilterChange('toDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <p>
          Hiển thị <strong>{filteredReservations.length}</strong> trên <strong>{pagination.totalElements || stats.total}</strong> đặt trước
          {(filters.status || filters.userEmail || filters.bookTitle || filters.fromDate || filters.toDate) && ' (đã lọc)'}
        </p>
      </div>

      {/* Reservations List */}
      {filteredReservations.length > 0 ? (
        <div className="reservations-grid">
          {filteredReservations.map((reservation) => (
            <div key={reservation.id} className={`reservation-card status-${reservation.status.toLowerCase()}`}>
              <div className="reservation-header">
                <div className="reservation-info">
                  <h3 className="reservation-id">Đặt trước #{reservation.id}</h3>
                  <div className="user-info">
                    <span className="user-email">👤 {reservation.userEmail}</span>
                  </div>
                </div>
                
                <div className="reservation-status">
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(reservation.status) }}
                  >
                    {getStatusText(reservation.status)}
                  </span>
                </div>
              </div>

              <div className="reservation-details">
                <div className="book-info">
                  <h4 className="book-title">📚 {reservation.bookTitle}</h4>
                  <p className="book-author">Tác giả: {reservation.bookAuthor || 'N/A'}</p>
                </div>

                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Ngày đặt:</span>
                    <span className="detail-value">
                      {new Date(reservation.reservationDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  {reservation.fulfillmentDate && (
                    <div className="detail-item">
                      <span className="detail-label">Ngày hoàn thành:</span>
                      <span className="detail-value">
                        {new Date(reservation.fulfillmentDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}
                  {reservation.cancellationDate && (
                    <div className="detail-item">
                      <span className="detail-label">Ngày hủy:</span>
                      <span className="detail-value">
                        {new Date(reservation.cancellationDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Book ID:</span>
                    <span className="detail-value">{reservation.bookId}</span>
                  </div>
                </div>
              </div>

              <div className="reservation-actions">
                <div className="action-buttons">
                  {reservation.status === 'PENDING' || reservation.status === 'APPROVED' ? (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleUpdateStatus(reservation)}
                    >
                      🔄 Cập nhật trạng thái
                    </button>
                  ) : (
                    <div className="status-info">
                      <span className={`status-final ${
                        reservation.status === 'FULFILLED' ? 'status-fulfilled' : 
                        reservation.status === 'CANCELLED' ? 'status-cancelled' :
                        reservation.status === 'REJECTED' ? 'status-rejected' : 
                        'status-default'
                      }`}>
                        {reservation.status === 'FULFILLED' ? '✅ Đã hoàn thành' : 
                         reservation.status === 'CANCELLED' ? '❌ Đã hủy' :
                         reservation.status === 'REJECTED' ? '🚫 Bị từ chối' : 
                         reservation.status}
                      </span>
                    </div>
                  )}
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteReservation(reservation)}
                    title="Xóa đặt trước"
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-reservations">
          <div className="no-reservations-icon">📋</div>
          <h3>Không có đặt trước nào</h3>
          <p>
            {Object.values(filters).some(f => f) 
              ? 'Không tìm thấy đặt trước nào với bộ lọc hiện tại.'
              : 'Chưa có yêu cầu đặt trước nào từ người dùng.'
            }
          </p>
        </div>
      )}

      {/* Pagination */}
      {filteredReservations.length > 0 && pagination.totalPages > 1 && (
        <div className="pagination-section">
          <div className="pagination-info">
            <p>
              Trang {pagination.page + 1} / {pagination.totalPages} 
              ({pagination.totalElements} đặt trước)
            </p>
          </div>
          <div className="pagination-controls">
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                fetchReservations(pagination.page - 1);
              }}
              disabled={pagination.page === 0}
            >
              ← Trang trước
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const startPage = Math.max(0, pagination.page - 2);
                const pageNum = startPage + i;
                if (pageNum >= pagination.totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    className={`btn ${pageNum === pagination.page ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      setPagination(prev => ({ ...prev, page: pageNum }));
                      fetchReservations(pageNum);
                    }}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>
            
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                fetchReservations(pagination.page + 1);
              }}
              disabled={pagination.page >= pagination.totalPages - 1}
            >
              Trang tiếp →
            </button>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showUpdateModal && selectedReservation && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔄 Cập nhật trạng thái đặt trước</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowUpdateModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="reservation-info-modal">
                <h4>📚 {selectedReservation.bookTitle}</h4>
                <p>👤 User: {selectedReservation.userEmail}</p>
                <p>📅 Ngày đặt: {new Date(selectedReservation.reservationDate).toLocaleDateString('vi-VN')}</p>
              </div>
              
              <div className="status-selection">
                <label>Chọn trạng thái mới:</label>
                <select 
                  value={newStatus} 
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="status-select"
                >
                  <option value="PENDING">Chờ xử lý</option>
                  <option value="APPROVED">Đã duyệt</option>
                  <option value="FULFILLED">Đã hoàn thành</option>
                  <option value="CANCELLED">Đã hủy</option>
                  <option value="REJECTED">Bị từ chối</option>
                </select>
              </div>

              {newStatus !== selectedReservation.status && (
                <div className="warning-text">
                  Bạn có chắc chắn muốn thay đổi trạng thái từ "{getStatusText(selectedReservation.status)}" 
                  thành "{getStatusText(newStatus)}"?
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowUpdateModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary"
                onClick={confirmUpdateStatus}
                disabled={updating || newStatus === selectedReservation.status}
              >
                {updating ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDeleteReservation && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗑️ Xác nhận xóa đặt trước</h3>
              <button 
                className="close-btn" 
                onClick={closeDeleteModal}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="reservation-info-modal">
                <h4>📚 {selectedDeleteReservation.bookTitle}</h4>
                <p>👤 User: {selectedDeleteReservation.userEmail}</p>
                <p>📅 Ngày đặt: {new Date(selectedDeleteReservation.reservationDate).toLocaleDateString('vi-VN')}</p>
                <p>📊 Trạng thái: {getStatusText(selectedDeleteReservation.status)}</p>
              </div>
              
              <div className="warning-section">
                <div className="warning-icon">⚠️</div>
                <p>Bạn có chắc chắn muốn xóa đặt trước này?</p>
                <p className="warning-text">
                  ⚠️ Hành động này không thể hoàn tác! Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
                </p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={closeDeleteModal}
              >
                Hủy
              </button>
              <button 
                className="btn btn-danger"
                onClick={confirmDeleteReservation}
                disabled={deleting}
              >
                {deleting ? '⏳ Đang xóa...' : '🗑️ Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationManagement;
