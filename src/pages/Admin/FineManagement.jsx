import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '../../utils/auth';
import './FineManagement.css';

const FineManagement = () => {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);
  
  // Search and filter state
  const [searchFilters, setSearchFilters] = useState({
    email: '',
    status: '',
    fromDate: '',
    toDate: ''
  });

  // Mark as paid modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFine, setSelectedFine] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDeleteFine, setSelectedDeleteFine] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch all fines for admin
  const fetchFines = useCallback(async (pageNum = 0, filters = {}) => {
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
        page: pageNum.toString(),
        size: pageSize.toString()
      });

      // Add search filters
      if (filters.email) params.append('email', filters.email);
      if (filters.status) params.append('status', filters.status);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);

      const response = await fetch(`/api/fines?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const finesData = data.data?.content || data.data || [];
        setFines(finesData);
        setPage(data.data?.number || 0);
        setTotalPages(data.data?.totalPages || 1);
        setTotalElements(data.data?.totalElements || finesData.length);
      } else {
        setError(data.message || 'Failed to fetch fines');
      }
    } catch (error) {
      console.error('Error fetching fines:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
      fetchFines(newPage, searchFilters);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchFines(0, searchFilters);
  };

  const handleClearFilters = () => {
    setSearchFilters({
      email: '',
      status: '',
      fromDate: '',
      toDate: ''
    });
    setPage(0);
    fetchFines(0, {});
  };

  // Handle mark as paid
  const handleMarkAsPaid = (fine) => {
    setSelectedFine(fine);
    setShowPaymentModal(true);
  };

  // Handle delete fine
  const handleDeleteFine = (fine) => {
    setSelectedDeleteFine(fine);
    setShowDeleteModal(true);
  };

  const confirmMarkAsPaid = async () => {
    if (!selectedFine) {
      alert('Vui lòng chọn phiếu phạt để xử lý');
      return;
    }

    setProcessing(true);
    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const response = await fetch(`/api/fines/${selectedFine.id}/status?status=PAID`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert(`Đã đánh dấu phiếu phạt đã thanh toán!\nSố tiền: ${formatCurrency(selectedFine.amount)}\nNgười dùng: ${selectedFine.userFullName}`);
        
        // Close modal and refresh
        setShowPaymentModal(false);
        setSelectedFine(null);
        fetchFines(page, searchFilters);
      } else {
        alert(data.message || 'Thao tác thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert('Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  const confirmDeleteFine = async () => {
    if (!selectedDeleteFine) {
      alert('Vui lòng chọn phiếu phạt để xóa');
      return;
    }

    setDeleting(true);
    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const response = await fetch(`/api/fines/${selectedDeleteFine.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert(`Đã xóa phiếu phạt thành công!\nID: #${selectedDeleteFine.id}\nNgười dùng: ${selectedDeleteFine.userFullName}`);
        
        // Close modal and refresh
        setShowDeleteModal(false);
        setSelectedDeleteFine(null);
        fetchFines(page, searchFilters);
      } else {
        alert(data.message || 'Thao tác thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error deleting fine:', error);
      alert('Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#f39c12';
      case 'PAID': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Chưa thanh toán';
      case 'PAID': return 'Đã thanh toán';
      default: return status;
    }
  };

  const getReasonText = (reason) => {
    switch (reason) {
      case 'OVERDUE': return 'Quá hạn';
      case 'DAMAGED': return 'Sách bị hư hỏng';
      case 'LOST': return 'Sách bị mất';
      default: return reason;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const closeModal = () => {
    setShowPaymentModal(false);
    setSelectedFine(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedDeleteFine(null);
  };

  // Calculate statistics
  const totalPendingAmount = fines
    .filter(fine => fine.status === 'PENDING')
    .reduce((sum, fine) => sum + fine.amount, 0);

  if (loading && page === 0) {
    return (
      <div className="fine-management">
        <div className="loading-container">
          <div className="loading-spinner">Đang tải danh sách phiếu phạt...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fine-management">
      {/* Header */}
      <div className="fine-header">
        <div className="header-left">
          <h2>💰 Quản lý Phiếu Phạt</h2>
          <p>Quản lý tất cả các phiếu phạt trong hệ thống</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="fine-stats">
        <div className="stat-card total">
          <div className="stat-number">{totalElements}</div>
          <div className="stat-label">Tổng phiếu phạt</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-number">
            {fines.filter(fine => fine.status === 'PENDING').length}
          </div>
          <div className="stat-label">Chưa thanh toán</div>
        </div>
        <div className="stat-card paid">
          <div className="stat-number">
            {fines.filter(fine => fine.status === 'PAID').length}
          </div>
          <div className="stat-label">Đã thanh toán</div>
        </div>
        <div className="stat-card amount">
          <div className="stat-number">{formatCurrency(totalPendingAmount)}</div>
          <div className="stat-label">Tổng tiền chưa thu</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="fine-filters">
        <div className="search-grid">
          <div className="search-field">
            <label>Email người dùng</label>
            <input
              type="email"
              placeholder="Tìm theo email..."
              value={searchFilters.email}
              onChange={(e) => setSearchFilters({...searchFilters, email: e.target.value})}
              className="search-input"
            />
          </div>
          
          <div className="search-field">
            <label>Trạng thái</label>
            <select
              value={searchFilters.status}
              onChange={(e) => setSearchFilters({...searchFilters, status: e.target.value})}
              className="search-select"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chưa thanh toán</option>
              <option value="PAID">Đã thanh toán</option>
            </select>
          </div>
          
          <div className="search-field">
            <label>Từ ngày</label>
            <input
              type="date"
              value={searchFilters.fromDate}
              onChange={(e) => setSearchFilters({...searchFilters, fromDate: e.target.value})}
              className="search-input"
            />
          </div>
          
          <div className="search-field">
            <label>Đến ngày</label>
            <input
              type="date"
              value={searchFilters.toDate}
              onChange={(e) => setSearchFilters({...searchFilters, toDate: e.target.value})}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="filter-actions">
          <button className="btn btn-primary" onClick={handleSearch}>
            🔍 Tìm kiếm
          </button>
          <button className="btn btn-secondary" onClick={handleClearFilters}>
            🔄 Xóa bộ lọc
          </button>
          <span className="total-count">
            Tổng cộng: {totalElements} phiếu phạt
          </span>
        </div>
      </div>

      {/* Fines Table */}
      {error ? (
        <div className="error-container">
          <div className="error-message">
            <span className="error-icon">❌</span>
            {error}
          </div>
        </div>
      ) : fines.length > 0 ? (
        <div className="fines-content">
          <div className="fines-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Người dùng</th>
                  <th>Số tiền</th>
                  <th>Lý do</th>
                  <th>Ngày tạo</th>
                  <th>Ngày thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {fines.map((fine) => (
                  <tr key={fine.id}>
                    <td>#{fine.id}</td>
                    <td>
                      <div className="user-info">
                        <div className="user-name">{fine.userFullName}</div>
                        <div className="user-email">📧 {fine.userEmail}</div>
                        {fine.bookLoanId && (
                          <div className="user-email">📋 Loan ID: {fine.bookLoanId}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="fine-details">
                        <div className="fine-amount">{formatCurrency(fine.amount)}</div>
                      </div>
                    </td>
                    <td>
                      <div className="fine-reason">
                        {getReasonText(fine.reason)}
                      </div>
                    </td>
                    <td>{formatDate(fine.issuedDate)}</td>
                    <td>
                      {fine.paidDate ? (
                        <span className="paid-date">{formatDate(fine.paidDate)}</span>
                      ) : (
                        <span className="no-payment">Chưa thanh toán</span>
                      )}
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(fine.status) }}
                      >
                        {getStatusText(fine.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {fine.status === 'PENDING' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleMarkAsPaid(fine)}
                            title="Đánh dấu đã thanh toán"
                          >
                            💰
                          </button>
                        )}
                        {fine.status === 'PAID' && (
                          <span className="completed-badge">✅ Đã thanh toán</span>
                        )}
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteFine(fine)}
                          title="Xóa phiếu phạt"
                          style={{ marginLeft: '0.5rem' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className={`pagination-btn ${page === 0 ? 'disabled' : ''}`}
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
              >
                ◀️ Trước
              </button>
              
              <div className="pagination-info">
                <span>Trang {page + 1} / {totalPages}</span>
                <span>({totalElements} phiếu phạt)</span>
              </div>
              
              <button 
                className={`pagination-btn ${page === totalPages - 1 ? 'disabled' : ''}`}
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages - 1}
              >
                Sau ▶️
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="no-fines">
          <div className="no-fines-icon">💰</div>
          <h3>Không tìm thấy phiếu phạt nào</h3>
          <p>
            {Object.values(searchFilters).some(v => v) ? 
              'Không có phiếu phạt nào phù hợp với tiêu chí tìm kiếm.' :
              'Chưa có phiếu phạt nào trong hệ thống.'
            }
          </p>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showPaymentModal && selectedFine && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>💰 Xác nhận thanh toán</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="fine-info-section">
                <h4>Thông tin phiếu phạt</h4>
                <div className="fine-details-modal">
                  <p><strong>ID:</strong> <span>#{selectedFine.id}</span></p>
                  <p><strong>Người dùng:</strong> <span>{selectedFine.userFullName}</span></p>
                  <p><strong>Email:</strong> <span>{selectedFine.userEmail}</span></p>
                  <p><strong>Số tiền:</strong> <span>{formatCurrency(selectedFine.amount)}</span></p>
                  <p><strong>Lý do:</strong> <span>{getReasonText(selectedFine.reason)}</span></p>
                  <p><strong>Ngày tạo:</strong> <span>{formatDate(selectedFine.issuedDate)}</span></p>
                  {selectedFine.bookLoanId && (
                    <p><strong>Loan ID:</strong> <span>#{selectedFine.bookLoanId}</span></p>
                  )}
                </div>
              </div>

              <div className="payment-confirmation">
                <div className="warning-icon">💰</div>
                <p>Bạn có chắc chắn muốn đánh dấu phiếu phạt này đã được thanh toán?</p>
                <p className="warning-text">
                  ⚠️ Hành động này không thể hoàn tác!
                </p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>
                Hủy
              </button>
              <button 
                className="btn btn-success"
                onClick={confirmMarkAsPaid}
                disabled={processing}
              >
                {processing ? '⏳ Đang xử lý...' : '✅ Xác nhận thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDeleteFine && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>🗑️ Xác nhận xóa phiếu phạt</h3>
              <button className="modal-close" onClick={closeDeleteModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="fine-info-section">
                <h4>Thông tin phiếu phạt sẽ bị xóa</h4>
                <div className="fine-details-modal">
                  <p><strong>ID:</strong> <span>#{selectedDeleteFine.id}</span></p>
                  <p><strong>Người dùng:</strong> <span>{selectedDeleteFine.userFullName}</span></p>
                  <p><strong>Email:</strong> <span>{selectedDeleteFine.userEmail}</span></p>
                  <p><strong>Số tiền:</strong> <span>{formatCurrency(selectedDeleteFine.amount)}</span></p>
                  <p><strong>Lý do:</strong> <span>{getReasonText(selectedDeleteFine.reason)}</span></p>
                  <p><strong>Trạng thái:</strong> <span>{getStatusText(selectedDeleteFine.status)}</span></p>
                  <p><strong>Ngày tạo:</strong> <span>{formatDate(selectedDeleteFine.issuedDate)}</span></p>
                  {selectedDeleteFine.bookLoanId && (
                    <p><strong>Loan ID:</strong> <span>#{selectedDeleteFine.bookLoanId}</span></p>
                  )}
                </div>
              </div>

              <div className="payment-confirmation">
                <div className="warning-icon">⚠️</div>
                <p>Bạn có chắc chắn muốn xóa phiếu phạt này?</p>
                <p className="warning-text">
                  ⚠️ Hành động này không thể hoàn tác! Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
                </p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDeleteModal}>
                Hủy
              </button>
              <button 
                className="btn btn-danger"
                onClick={confirmDeleteFine}
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

export default FineManagement;
