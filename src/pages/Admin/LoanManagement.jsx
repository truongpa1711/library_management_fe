import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '../../utils/auth';
import './LoanManagement.css';

const LoanManagement = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);
  
  // Search and filter state
  const [searchFilters, setSearchFilters] = useState({
    userEmail: '',
    bookTitle: '',
    status: '',
    fullName: ''
  });

  // Extend loan modal state
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [newDueDate, setNewDueDate] = useState('');
  const [extending, setExtending] = useState(false);

  // Return book modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedReturnLoan, setSelectedReturnLoan] = useState(null);
  const [bookCondition, setBookCondition] = useState('GOOD');
  const [returning, setReturning] = useState(false);

  // Fetch all loans for admin
  const fetchLoans = useCallback(async (pageNum = 0, filters = {}) => {
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
      if (filters.userEmail) params.append('userEmail', filters.userEmail);
      if (filters.bookTitle) params.append('bookTitle', filters.bookTitle);
      if (filters.status) params.append('status', filters.status);
      if (filters.fullName) params.append('fullName', filters.fullName);

      const response = await fetch(`/api/book-loans/loans?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const loansData = data.data?.content || data.data || [];
        setLoans(loansData);
        setPage(data.data?.number || 0);
        setTotalPages(data.data?.totalPages || 1);
        setTotalElements(data.data?.totalElements || loansData.length);
      } else {
        setError(data.message || 'Failed to fetch loans');
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
      fetchLoans(newPage, searchFilters);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchLoans(0, searchFilters);
  };

  const handleClearFilters = () => {
    setSearchFilters({
      userEmail: '',
      bookTitle: '',
      status: '',
      fullName: ''
    });
    setPage(0);
    fetchLoans(0, {});
  };

  // Handle extend loan
  const handleExtendLoan = (loan) => {
    setSelectedLoan(loan);
    // Set default extension date (7 days from current due date)
    const extendDate = new Date(loan.dueDate);
    extendDate.setDate(extendDate.getDate() + 7);
    setNewDueDate(extendDate.toISOString().split('T')[0]);
    setShowExtendModal(true);
  };

  const confirmExtendLoan = async () => {
    if (!selectedLoan || !newDueDate) {
      alert('Vui lòng chọn ngày gia hạn mới');
      return;
    }

    setExtending(true);
    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const response = await fetch(`/api/book-loans/${selectedLoan.loanId}/extend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          newDueDate: newDueDate
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert(`Gia hạn thành công cho ${selectedLoan.userFullName}!\nHạn trả mới: ${formatDate(newDueDate)}`);
        
        // Close modal and refresh
        setShowExtendModal(false);
        setSelectedLoan(null);
        setNewDueDate('');
        fetchLoans(page, searchFilters);
      } else {
        alert(data.message || 'Gia hạn thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error extending loan:', error);
      alert('Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setExtending(false);
    }
  };

  // Handle return book with modal
  const handleReturnBook = (loan) => {
    setSelectedReturnLoan(loan);
    setBookCondition('GOOD');
    setShowReturnModal(true);
  };

  const confirmReturnBook = async () => {
    if (!selectedReturnLoan) {
      alert('Vui lòng chọn sách để trả');
      return;
    }

    setReturning(true);
    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const response = await fetch(`/api/book-loans/${selectedReturnLoan.loanId}/return`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookCondition: bookCondition
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert(`Đã xử lý trả sách cho ${selectedReturnLoan.userFullName}!\nTình trạng: ${getConditionText(bookCondition)}`);
        
        // Close modal and refresh
        setShowReturnModal(false);
        setSelectedReturnLoan(null);
        setBookCondition('GOOD');
        fetchLoans(page, searchFilters);
      } else {
        alert(data.message || 'Thao tác thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error processing return:', error);
      alert('Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setReturning(false);
    }
  };

  const getConditionText = (condition) => {
    switch (condition) {
      case 'GOOD': return 'Tình trạng tốt';
      case 'DAMAGED': return 'Bị hư hỏng';
      case 'LOST': return 'Bị mất';
      default: return condition;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'BORROWED': return '#ffc107';
      case 'RETURNED': return '#28a745';
      case 'OVERDUE': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'BORROWED': return 'Đang mượn';
      case 'RETURNED': return 'Đã trả';
      case 'OVERDUE': return 'Quá hạn';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getDaysUntilDue = (dueDateString) => {
    const today = new Date();
    const dueDate = new Date(dueDateString);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const closeModal = () => {
    setShowExtendModal(false);
    setSelectedLoan(null);
    setNewDueDate('');
  };

  const closeReturnModal = () => {
    setShowReturnModal(false);
    setSelectedReturnLoan(null);
    setBookCondition('GOOD');
  };

  if (loading && page === 0) {
    return (
      <div className="loan-management">
        <div className="loading-container">
          <div className="loading-spinner">Đang tải danh sách mượn sách...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="loan-management">
      {/* Header */}
      <div className="loan-header">
        <div className="header-left">
          <h2>📋 Quản lý Mượn Sách</h2>
          <p>Quản lý tất cả các giao dịch mượn sách trong hệ thống</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="loan-stats">
        <div className="stat-card total">
          <div className="stat-number">{totalElements}</div>
          <div className="stat-label">Tổng giao dịch</div>
        </div>
        <div className="stat-card borrowed">
          <div className="stat-number">
            {loans.filter(loan => loan.status === 'BORROWED').length}
          </div>
          <div className="stat-label">Đang mượn</div>
        </div>
        <div className="stat-card returned">
          <div className="stat-number">
            {loans.filter(loan => loan.status === 'RETURNED').length}
          </div>
          <div className="stat-label">Đã trả</div>
        </div>
        <div className="stat-card overdue">
          <div className="stat-number">
            {loans.filter(loan => {
              const daysUntilDue = getDaysUntilDue(loan.dueDate);
              return loan.status === 'BORROWED' && daysUntilDue < 0;
            }).length}
          </div>
          <div className="stat-label">Quá hạn</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="loan-filters">
        <div className="search-grid">
          <div className="search-field">
            <label>Tên người dùng</label>
            <input
              type="text"
              placeholder="Tìm theo tên..."
              value={searchFilters.fullName}
              onChange={(e) => setSearchFilters({...searchFilters, fullName: e.target.value})}
              className="search-input"
            />
          </div>
          
          <div className="search-field">
            <label>Email</label>
            <input
              type="text"
              placeholder="Tìm theo email..."
              value={searchFilters.userEmail}
              onChange={(e) => setSearchFilters({...searchFilters, userEmail: e.target.value})}
              className="search-input"
            />
          </div>
          
          <div className="search-field">
            <label>Tên sách</label>
            <input
              type="text"
              placeholder="Tìm theo tên sách..."
              value={searchFilters.bookTitle}
              onChange={(e) => setSearchFilters({...searchFilters, bookTitle: e.target.value})}
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
              <option value="BORROWED">Đang mượn</option>
              <option value="RETURNED">Đã trả</option>
            </select>
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
            Tổng cộng: {totalElements} giao dịch
          </span>
        </div>
      </div>

      {/* Loans Table */}
      {error ? (
        <div className="error-container">
          <div className="error-message">
            <span className="error-icon">❌</span>
            {error}
          </div>
        </div>
      ) : loans.length > 0 ? (
        <div className="loans-content">
          <div className="loans-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Người mượn</th>
                  <th>Thông tin sách</th>
                  <th>Ngày mượn</th>
                  <th>Hạn trả</th>
                  <th>Ngày trả</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => {
                  const daysUntilDue = getDaysUntilDue(loan.dueDate);
                  const isOverdue = loan.status === 'BORROWED' && daysUntilDue < 0;
                  
                  return (
                    <tr key={loan.loanId} className={isOverdue ? 'overdue-row' : ''}>
                      <td>#{loan.loanId}</td>
                      <td>
                        <div className="user-info">
                          <div className="user-name">{loan.userFullName}</div>
                          <div className="user-email">📧 {loan.userEmail}</div>
                          <div className="user-id">👤 ID: {loan.userId}</div>
                        </div>
                      </td>
                      <td>
                        <div className="book-info">
                          <div className="book-title">{loan.bookTitle}</div>
                          <div className="book-details">
                            <span>👤 {loan.bookAuthor}</span>
                            <span>🏷️ {loan.bookGenre}</span>
                            <span>📖 ID: {loan.bookId}</span>
                          </div>
                        </div>
                      </td>
                      <td>{formatDate(loan.borrowDate)}</td>
                      <td>
                        <div className={`due-date ${isOverdue ? 'overdue' : ''}`}>
                          {formatDate(loan.dueDate)}
                          {loan.status === 'BORROWED' && (
                            <div className="days-info">
                              {isOverdue ? (
                                <span className="overdue-text">
                                  ⚠️ Quá {Math.abs(daysUntilDue)} ngày
                                </span>
                              ) : (
                                <span className="days-left">
                                  📅 Còn {daysUntilDue} ngày
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {loan.returnDate ? (
                          <span className="return-date">{formatDate(loan.returnDate)}</span>
                        ) : (
                          <span className="no-return">Chưa trả</span>
                        )}
                      </td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(loan.status) }}
                        >
                          {getStatusText(loan.status)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {loan.status === 'BORROWED' && (
                            <>
                              <button
                                className="btn btn-warning btn-sm"
                                onClick={() => handleExtendLoan(loan)}
                                title="Gia hạn"
                              >
                                📅
                              </button>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleReturnBook(loan)}
                                title="Xử lý trả sách"
                              >
                                📤
                              </button>
                            </>
                          )}
                          {loan.status === 'RETURNED' && (
                            <span className="completed-badge">✅ Hoàn thành</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                <span>({totalElements} giao dịch)</span>
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
        <div className="no-loans">
          <div className="no-loans-icon">📋</div>
          <h3>Không tìm thấy giao dịch nào</h3>
          <p>
            {Object.values(searchFilters).some(v => v) ? 
              'Không có giao dịch nào phù hợp với tiêu chí tìm kiếm.' :
              'Chưa có giao dịch mượn sách nào trong hệ thống.'
            }
          </p>
        </div>
      )}

      {/* Extend Loan Modal */}
      {showExtendModal && selectedLoan && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>📅 Gia hạn sách</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="loan-info-section">
                <h4>Thông tin mượn sách</h4>
                <div className="loan-details">
                  <p><strong>Người mượn:</strong> {selectedLoan.userFullName}</p>
                  <p><strong>Email:</strong> {selectedLoan.userEmail}</p>
                  <p><strong>Sách:</strong> {selectedLoan.bookTitle}</p>
                  <p><strong>Tác giả:</strong> {selectedLoan.bookAuthor}</p>
                  <p><strong>Hạn trả hiện tại:</strong> {formatDate(selectedLoan.dueDate)}</p>
                </div>
              </div>

              <div className="new-due-date-section">
                <h4>Hạn trả mới</h4>
                <label>Chọn ngày hạn trả mới:</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>
                Hủy
              </button>
              <button 
                className="btn btn-primary"
                onClick={confirmExtendLoan}
                disabled={extending || !newDueDate}
              >
                {extending ? '⏳ Đang gia hạn...' : '✅ Xác nhận gia hạn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Book Modal */}
      {showReturnModal && selectedReturnLoan && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>📤 Xử lý trả sách</h3>
              <button className="modal-close" onClick={closeReturnModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="loan-info-section">
                <h4>Thông tin mượn sách</h4>
                <div className="loan-details">
                  <p><strong>Người mượn:</strong> {selectedReturnLoan.userFullName}</p>
                  <p><strong>Email:</strong> {selectedReturnLoan.userEmail}</p>
                  <p><strong>ID người dùng:</strong> {selectedReturnLoan.userId}</p>
                  <p><strong>Sách:</strong> {selectedReturnLoan.bookTitle}</p>
                  <p><strong>Tác giả:</strong> {selectedReturnLoan.bookAuthor}</p>
                  <p><strong>Ngày mượn:</strong> {formatDate(selectedReturnLoan.borrowDate)}</p>
                  <p><strong>Hạn trả:</strong> {formatDate(selectedReturnLoan.dueDate)}</p>
                  {(() => {
                    const daysUntilDue = getDaysUntilDue(selectedReturnLoan.dueDate);
                    const isOverdue = daysUntilDue < 0;
                    return (
                      <p><strong>Tình trạng:</strong> 
                        <span className={isOverdue ? 'overdue-text' : 'normal-text'}>
                          {isOverdue ? ` Quá hạn ${Math.abs(daysUntilDue)} ngày` : ` Còn ${daysUntilDue} ngày`}
                        </span>
                      </p>
                    );
                  })()}
                </div>
              </div>

              <div className="return-form-section">
                <h4>Thông tin trả sách</h4>
                
                <div className="form-group">
                  <label>Tình trạng sách khi trả:</label>
                  <div className="condition-options">
                    <label className="condition-option">
                      <input
                        type="radio"
                        name="bookCondition"
                        value="GOOD"
                        checked={bookCondition === 'GOOD'}
                        onChange={(e) => setBookCondition(e.target.value)}
                      />
                      <span className="condition-label good">✅ Tình trạng tốt</span>
                    </label>
                    
                    <label className="condition-option">
                      <input
                        type="radio"
                        name="bookCondition"
                        value="DAMAGED"
                        checked={bookCondition === 'DAMAGED'}
                        onChange={(e) => setBookCondition(e.target.value)}
                      />
                      <span className="condition-label damaged">⚠️ Bị hư hỏng</span>
                    </label>
                    
                    <label className="condition-option">
                      <input
                        type="radio"
                        name="bookCondition"
                        value="LOST"
                        checked={bookCondition === 'LOST'}
                        onChange={(e) => setBookCondition(e.target.value)}
                      />
                      <span className="condition-label lost">❌ Bị mất</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeReturnModal}>
                Hủy
              </button>
              <button 
                className="btn btn-primary"
                onClick={confirmReturnBook}
                disabled={returning}
              >
                {returning ? '⏳ Đang xử lý...' : '✅ Xác nhận trả sách'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanManagement;
