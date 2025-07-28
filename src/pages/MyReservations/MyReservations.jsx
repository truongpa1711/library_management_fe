import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '../../utils/auth';
import './MyReservations.css';

const MyReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter and pagination state
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    bookTitle: '',
    author: '',
    fromDate: '',
    toDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  });

  // Modal state for cancel confirmation
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchMyReservations = useCallback(async (page = 0, appliedFilters = filters) => {
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

      const response = await fetch(`/api/reservations/user?${queryParams}`, {
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
        setFilteredReservations(reservationsData);
        
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
    fetchMyReservations();
  }, [fetchMyReservations]);

  // Apply client-side filtering for bookTitle and author (since API might not support these)
  useEffect(() => {
    let filtered = reservations;

    if (filters.bookTitle) {
      filtered = filtered.filter(reservation => 
        reservation.bookTitle?.toLowerCase().includes(filters.bookTitle.toLowerCase())
      );
    }

    if (filters.author) {
      filtered = filtered.filter(reservation => 
        reservation.bookAuthor?.toLowerCase().includes(filters.author.toLowerCase())
      );
    }

    setFilteredReservations(filtered);
  }, [reservations, filters.bookTitle, filters.author]);

  const handleFilterChange = (filterKey, value) => {
    const newFilters = {
      ...filters,
      [filterKey]: value
    };
    setFilters(newFilters);
    
    // Reset pagination to first page and fetch with new filters
    setPagination(prev => ({ ...prev, page: 0 }));
    fetchMyReservations(0, newFilters);
  };

  const handleCancelReservation = (reservation) => {
    setSelectedReservation(reservation);
    setShowCancelModal(true);
  };

  const confirmCancelReservation = async () => {
    if (!selectedReservation) return;

    setCancelling(true);

    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const response = await fetch(`/api/reservations/${selectedReservation.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert('Reservation cancelled successfully!');
        setShowCancelModal(false);
        setSelectedReservation(null);
        fetchMyReservations();
      } else {
        alert(data.message || 'Failed to cancel reservation');
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      alert('Network error. Please try again.');
    } finally {
      setCancelling(false);
    }
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
        return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return '⏳';
      case 'APPROVED':
        return '✔️';
      case 'FULFILLED':
        return '✅';
      case 'CANCELLED':
        return '❌';
      case 'REJECTED':
        return '🚫';
      default:
        return '❓';
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

  if (loading) {
    return (
      <div className="my-reservations-page">
        <div className="loading-container">
          <div className="loading-spinner">Đang tải đặt trước...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-reservations-page">
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button className="btn btn-primary" onClick={fetchMyReservations}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-reservations-page">
      {/* Header */}
      <div className="page-header">
        <h1>📋 Sách Đã Đặt Trước</h1>
        <p>Quản lý các sách bạn đã đặt trước</p>
      </div>

      {/* Stats Summary */}
      <div className="reservations-stats">
        <div className="stat-card total">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{reservations.length}</h3>
            <p>Tổng số đặt trước</p>
          </div>
        </div>
        
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{reservations.filter(r => r.status === 'PENDING' || r.status === 'APPROVED').length}</h3>
            <p>Đang chờ</p>
          </div>
        </div>
        
        <div className="stat-card fulfilled">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{reservations.filter(r => r.status === 'FULFILLED').length}</h3>
            <p>Đã hoàn thành</p>
          </div>
        </div>
        
        <div className="stat-card cancelled">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>{reservations.filter(r => r.status === 'CANCELLED' || r.status === 'REJECTED').length}</h3>
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
            <label>Tên sách:</label>
            <input
              type="text"
              placeholder="Tìm theo tên sách..."
              value={filters.bookTitle}
              onChange={(e) => handleFilterChange('bookTitle', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Tác giả:</label>
            <input
              type="text"
              placeholder="Tìm theo tác giả..."
              value={filters.author}
              onChange={(e) => handleFilterChange('author', e.target.value)}
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
          Hiển thị <strong>{filteredReservations.length}</strong> trên <strong>{pagination.totalElements || reservations.length}</strong> đặt trước
          {(filters.status || filters.bookTitle || filters.author || filters.fromDate || filters.toDate) && ' (đã lọc)'}
        </p>
      </div>

      {/* Reservations List */}
      {filteredReservations.length > 0 ? (
        <div className="reservations-list">
          {filteredReservations.map((reservation) => (
            <div key={reservation.id} className={`reservation-card status-${reservation.status.toLowerCase()}`}>
              <div className="reservation-header">
                <div className="book-info">
                  <h3 className="book-title">📚 {reservation.bookTitle}</h3>
                  <p className="book-author">Tác giả: {reservation.bookAuthor || 'N/A'}</p>
                </div>
                
                <div className="reservation-status">
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(reservation.status) }}
                  >
                    {getStatusIcon(reservation.status)} {getStatusText(reservation.status)}
                  </span>
                </div>
              </div>

              <div className="reservation-details">
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">📅 Ngày đặt:</span>
                    <span className="detail-value">
                      {new Date(reservation.reservationDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  
                  {reservation.expiryDate && (
                    <div className="detail-item">
                      <span className="detail-label">⏰ Hết hạn:</span>
                      <span className="detail-value">
                        {new Date(reservation.expiryDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}
                  
                  {reservation.fulfilledDate && (
                    <div className="detail-item">
                      <span className="detail-label">✅ Hoàn thành:</span>
                      <span className="detail-value">
                        {new Date(reservation.fulfilledDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}
                  
                  <div className="detail-item">
                    <span className="detail-label">🔢 Vị trí:</span>
                    <span className="detail-value">#{reservation.queuePosition || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {reservation.notes && (
                <div className="reservation-notes">
                  <p><strong>Ghi chú:</strong> {reservation.notes}</p>
                </div>
              )}

              <div className="reservation-actions">
                {(reservation.status === 'PENDING' || reservation.status === 'APPROVED') && (
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleCancelReservation(reservation)}
                  >
                    ❌ Hủy đặt trước
                  </button>
                )}
                
                {reservation.status === 'FULFILLED' && (
                  <div className="fulfillment-notice">
                    <span className="notice-text">
                      📖 Sách đã sẵn sàng! Vui lòng đến thư viện để mượn.
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-reservations">
          <div className="no-reservations-icon">📋</div>
          <h3>Không có đặt trước nào</h3>
          <p>
            {filters.status || filters.bookTitle 
              ? 'Không tìm thấy đặt trước nào với bộ lọc hiện tại.'
              : 'Bạn chưa đặt trước sách nào. Hãy tìm và đặt trước những cuốn sách yêu thích!'
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
                fetchMyReservations(pagination.page - 1);
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
                      fetchMyReservations(pageNum);
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
                fetchMyReservations(pagination.page + 1);
              }}
              disabled={pagination.page >= pagination.totalPages - 1}
            >
              Trang tiếp →
            </button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedReservation && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>❌ Xác nhận hủy đặt trước</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowCancelModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn hủy đặt trước cuốn sách:</p>
              <div className="book-info-modal">
                <h4>📚 {selectedReservation.bookTitle}</h4>
                <p>Ngày đặt: {new Date(selectedReservation.reservationDate).toLocaleDateString('vi-VN')}</p>
              </div>
              <p className="warning-text">
                ⚠️ Hành động này không thể hoàn tác!
              </p>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCancelModal(false)}
              >
                Hủy bỏ
              </button>
              <button 
                className="btn btn-danger"
                onClick={confirmCancelReservation}
                disabled={cancelling}
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReservations;
