import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '../../utils/auth';
import './MyFines.css';

const MyFines = () => {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchMyFines = useCallback(async (page = 0, status = '', fromDateParam = '', toDateParam = '') => {
    setLoading(true);
    setError('');

    try {
      const token = auth.getAccessToken();
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        size: pageSize.toString()
      });
      
      if (status) params.append('status', status);
      if (fromDateParam) params.append('fromDate', fromDateParam);
      if (toDateParam) params.append('toDate', toDateParam);

      const response = await fetch(`/api/fines/my-fines?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        console.log('My Fines API Response:', data.data); // Debug log
        setFines(data.data.content || []);
        setCurrentPage(data.data.number || 0);
        setTotalPages(data.data.totalPages || 0);
        setTotalElements(data.data.totalElements || 0);
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
    fetchMyFines(currentPage, statusFilter, fromDate, toDate);
  }, [currentPage, statusFilter, fromDate, toDate, fetchMyFines]);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFilterChange = () => {
    setCurrentPage(0); // Reset to first page when filtering
    fetchMyFines(0, statusFilter, fromDate, toDate);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setFromDate('');
    setToDate('');
    setCurrentPage(0);
  };

  const getReasonText = (reason) => {
    switch (reason) {
      case 'OVERDUE':
        return 'Trả trễ';
      case 'DAMAGED':
        return 'Sách bị hư hỏng';
      case 'LOST':
        return 'Sách bị mất';
      default:
        return reason;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Chưa thanh toán';
      case 'PAID':
        return 'Đã thanh toán';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'PAID':
        return 'status-paid';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  };

  const getReasonColor = (reason) => {
    switch (reason) {
      case 'OVERDUE':
        return 'reason-overdue';
      case 'DAMAGED':
        return 'reason-damaged';
      case 'LOST':
        return 'reason-lost';
      default:
        return 'reason-default';
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

  if (loading) {
    return (
      <div className="my-fines">
        <div className="loading-container">
          <div className="loading-spinner">Loading your fines...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-fines">
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button className="btn-primary" onClick={() => fetchMyFines(currentPage, statusFilter, fromDate, toDate)}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalPendingAmount = fines
    .filter(fine => fine.status === 'PENDING')
    .reduce((sum, fine) => sum + fine.amount, 0);

  const totalPaidAmount = fines
    .filter(fine => fine.status === 'PAID')
    .reduce((sum, fine) => sum + fine.amount, 0);

  return (
    <div className="my-fines">
      {/* Header */}
      <div className="my-fines-header">
        <h1>💰 Phiếu phạt của tôi</h1>
        <p>Quản lý các khoản phạt từ việc mượn sách</p>
      </div>

      {/* Stats Summary */}
      <div className="fines-stats">
        <div className="stat-card pending">
          <div className="stat-number">{fines.filter(f => f.status === 'PENDING').length}</div>
          <div className="stat-label">Chưa thanh toán</div>
          <div className="stat-amount">{formatCurrency(totalPendingAmount)}</div>
        </div>
        <div className="stat-card paid">
          <div className="stat-number">{fines.filter(f => f.status === 'PAID').length}</div>
          <div className="stat-label">Đã thanh toán</div>
          <div className="stat-amount">{formatCurrency(totalPaidAmount)}</div>
        </div>
        <div className="stat-card total">
          <div className="stat-number">{totalElements}</div>
          <div className="stat-label">Tổng phiếu phạt</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="filter-controls">
        <div className="filter-row">
          <div className="filter-group">
            <label>Trạng thái:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="">Tất cả</option>
              <option value="PENDING">Chưa thanh toán</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Từ ngày:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="date-filter"
            />
          </div>

          <div className="filter-group">
            <label>Đến ngày:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="date-filter"
            />
          </div>

          <div className="filter-actions">
            <button 
              className="btn btn-primary"
              onClick={handleFilterChange}
            >
              🔍 Lọc
            </button>
            <button 
              className="btn btn-secondary"
              onClick={clearFilters}
            >
              🗑️ Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Fines List */}
      <div className="fines-content">
        {fines.length > 0 ? (
          <>
            <div className="fines-grid">
              {fines.map((fine) => (
                <div key={fine.id} className={`fine-card ${fine.status.toLowerCase()}`}>
                  <div className="fine-header">
                    <div className="fine-id">Phiếu phạt #{fine.id}</div>
                    <div className={`fine-status ${getStatusColor(fine.status)}`}>
                      {getStatusText(fine.status)}
                    </div>
                  </div>

                  <div className="fine-details">
                    <div className="fine-amount">
                      <span className="amount-label">Số tiền phạt:</span>
                      <span className="amount-value">{formatCurrency(fine.amount)}</span>
                    </div>

                    <div className="fine-reason">
                      <span className="reason-label">Lý do:</span>
                      <span className={`reason-value ${getReasonColor(fine.reason)}`}>
                        {getReasonText(fine.reason)}
                      </span>
                    </div>

                    <div className="fine-dates">
                      <div className="date-row">
                        <span className="date-label">📅 Ngày phát hành:</span>
                        <span className="date-value">{formatDate(fine.issuedDate)}</span>
                      </div>
                      {fine.paidDate && (
                        <div className="date-row">
                          <span className="date-label">💳 Ngày thanh toán:</span>
                          <span className="date-value">{formatDate(fine.paidDate)}</span>
                        </div>
                      )}
                    </div>

                    <div className="fine-loan">
                      <span className="loan-label">📖 Loan ID:</span>
                      <span className="loan-value">#{fine.bookLoanId}</span>
                    </div>
                  </div>

                  <div className="fine-actions">
                    {fine.status === 'PENDING' && (
                      <button 
                        className="btn btn-warning"
                        onClick={() => alert('Chức năng thanh toán sẽ được triển khai sau')}
                      >
                        💳 Thanh toán
                      </button>
                    )}
                    <button 
                      className="btn btn-secondary"
                      onClick={() => alert(`Chi tiết phiếu phạt #${fine.id}`)}
                    >
                      👁️ Chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} của {totalElements} phiếu phạt
                </div>
                <div className="pagination">
                  <button 
                    className={`pagination-btn ${currentPage === 0 ? 'disabled' : ''}`}
                    onClick={() => handlePageChange(0)}
                    disabled={currentPage === 0}
                  >
                    ⏮️ Đầu
                  </button>
                  <button 
                    className={`pagination-btn ${currentPage === 0 ? 'disabled' : ''}`}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                  >
                    ◀️ Trước
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const startPage = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
                    const pageNum = startPage + i;
                    if (pageNum >= totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  
                  <button 
                    className={`pagination-btn ${currentPage === totalPages - 1 ? 'disabled' : ''}`}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                  >
                    ▶️ Sau
                  </button>
                  <button 
                    className={`pagination-btn ${currentPage === totalPages - 1 ? 'disabled' : ''}`}
                    onClick={() => handlePageChange(totalPages - 1)}
                    disabled={currentPage === totalPages - 1}
                  >
                    ⏭️ Cuối
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="no-fines">
            <div className="no-fines-icon">🎉</div>
            <h3>Không có phiếu phạt nào</h3>
            <p>
              {statusFilter || fromDate || toDate 
                ? 'Không có phiếu phạt nào phù hợp với bộ lọc đã chọn.' 
                : 'Bạn không có phiếu phạt nào. Hãy tiếp tục giữ thói quen đọc sách tốt!'}
            </p>
            {(statusFilter || fromDate || toDate) && (
              <button 
                className="btn btn-primary"
                onClick={clearFilters}
              >
                🗑️ Xóa bộ lọc
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyFines;
