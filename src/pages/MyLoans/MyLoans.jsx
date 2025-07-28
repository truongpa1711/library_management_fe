import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../utils/auth';
import './MyLoans.css';

const MyLoans = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [filteredLoans, setFilteredLoans] = useState([]);

  // Return book modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [bookCondition, setBookCondition] = useState('GOOD');

  useEffect(() => {
    const fetchMyLoans = async () => {
      setLoading(true);
      setError('');

      try {
        const token = auth.getAccessToken();
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/book-loans/my-loans', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
          console.log('My Loans API Response:', data.data); // Debug log
          console.log('First loan structure:', data.data[0]); // Check loan structure
          setLoans(data.data || []);
        } else {
          setError(data.message || 'Failed to fetch borrowed books');
        }
      } catch (error) {
        console.error('Error fetching borrowed books:', error);
        setError('Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyLoans();
  }, []);

  // Filter loans based on status
  useEffect(() => {
    console.log('Filtering loans with status:', statusFilter);
    console.log('All loans:', loans);
    
    if (statusFilter === 'ALL') {
      setFilteredLoans(loans);
    } else if (statusFilter === 'ACTIVE') {
      // Filter for both ACTIVE and BORROWED status (currently borrowed books)
      const filtered = loans.filter(loan => 
        loan.status === 'ACTIVE' || loan.status === 'BORROWED'
      );
      console.log('Filtered ACTIVE loans:', filtered);
      setFilteredLoans(filtered);
    } else if (statusFilter === 'OVERDUE') {
      // Filter for overdue books (active/borrowed books past due date)
      const filtered = loans.filter(loan => {
        const isActiveBorrowed = loan.status === 'ACTIVE' || loan.status === 'BORROWED';
        const daysUntilDue = getDaysUntilDue(loan.dueDate);
        return isActiveBorrowed && daysUntilDue < 0;
      });
      console.log('Filtered OVERDUE loans:', filtered);
      setFilteredLoans(filtered);
    } else {
      const filtered = loans.filter(loan => loan.status === statusFilter);
      console.log(`Filtered ${statusFilter} loans:`, filtered);
      setFilteredLoans(filtered);
    }
  }, [loans, statusFilter]);

  const handleViewBook = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  const handleReturnBook = async (loanId, loan) => {
    console.log('handleReturnBook called with:', { loanId }); // Debug log
    
    if (!loanId || loanId === 'undefined') {
      alert('Lỗi: Không tìm thấy ID của loan. Vui lòng thử lại.');
      return;
    }

    // Set selected loan and show modal
    setSelectedLoan(loan);
    setShowReturnModal(true);
  };

  const confirmReturnBook = async () => {
    const loanId = selectedLoan?.id || selectedLoan?.loanId || selectedLoan?.bookLoanId;
    
    if (!loanId) {
      alert('Lỗi: Không tìm thấy ID của loan. Vui lòng thử lại.');
      return;
    }

    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      console.log('Returning book with ID:', loanId, 'condition:', bookCondition); // Debug log

      const response = await fetch(`/api/book-loans/${loanId}/return`, {
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
        alert('Trả sách thành công!');
        
        // Close modal and reset
        setShowReturnModal(false);
        setSelectedLoan(null);
        setBookCondition('GOOD');
        
        // Refresh the loans list
        window.location.reload();
      } else {
        alert(data.message || 'Trả sách thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error returning book:', error);
      alert('Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.');
    }
  };

  const handleExtendLoan = async (loanId, currentDueDate) => {
    console.log('handleExtendLoan called with:', { loanId, currentDueDate }); // Debug log
    
    if (!loanId || loanId === 'undefined') {
      alert('Lỗi: Không tìm thấy ID của loan. Vui lòng thử lại.');
      return;
    }

    if (window.confirm('Bạn có muốn gia hạn thêm 7 ngày cho sách này không?')) {
      try {
        const token = auth.getAccessToken();
        if (!token) {
          alert('Authentication required. Please login again.');
          return;
        }

        // Calculate new due date (7 days from current due date)
        const newDueDate = new Date(currentDueDate);
        newDueDate.setDate(newDueDate.getDate() + 7);
        const newDueDateString = newDueDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD

        console.log('Extending loan with ID:', loanId, 'to new date:', newDueDateString); // Debug log

        const response = await fetch(`/api/book-loans/${loanId}/extend`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            newDueDate: newDueDateString
          })
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
          alert(`Gia hạn thành công! Hạn trả mới: ${newDueDateString}`);
          
          // Refresh the loans list
          window.location.reload();
        } else {
          alert(data.message || 'Gia hạn thất bại. Vui lòng thử lại.');
        }
      } catch (error) {
        console.error('Error extending loan:', error);
        alert('Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
      case 'BORROWED':
        return 'status-active';
      case 'RETURNED':
        return 'status-returned';
      case 'OVERDUE':
        return 'status-overdue';
      default:
        return 'status-default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDateString) => {
    const today = new Date();
    const dueDate = new Date(dueDateString);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="my-loans">
        <div className="loading-container">
          <div className="loading-spinner">Loading your borrowed books...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-loans">
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-loans">
      {/* Header */}
      <div className="my-loans-header">
        <h1>📖 Sách đã mượn</h1>
        <p>Quản lý các sách bạn đã mượn từ thư viện</p>
      </div>

      {/* Stats Summary */}
      <div className="loans-stats">
        <div className="stat-card total">
          <div className="stat-number">{loans.length}</div>
          <div className="stat-label">Tổng số sách đã mượn</div>
        </div>
        <div className="stat-card active">
          <div className="stat-number">
            {loans.filter(loan => loan.status === 'ACTIVE' || loan.status === 'BORROWED').length}
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
              return (loan.status === 'ACTIVE' || loan.status === 'BORROWED') && daysUntilDue < 0;
            }).length}
          </div>
          <div className="stat-label">Quá hạn</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="filter-controls">
        <div className="filter-group">
          <label>Lọc theo trạng thái:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="ALL">Tất cả</option>
            <option value="ACTIVE">Đang mượn</option>
            <option value="RETURNED">Đã trả</option>
            <option value="OVERDUE">Quá hạn</option>
          </select>
        </div>
      </div>

      {/* Loans List */}
      <div className="loans-content">
        {filteredLoans.length > 0 ? (
          <div className="loans-grid">
            {filteredLoans.map((loan) => {
              const daysUntilDue = getDaysUntilDue(loan.dueDate);
              const isOverdue = (loan.status === 'ACTIVE' || loan.status === 'BORROWED') && daysUntilDue < 0;
              
              console.log('Rendering loan:', { id: loan.id, bookTitle: loan.bookTitle, status: loan.status }); // Debug log
              
              return (
                <div key={loan.id || loan.loanId || loan.bookLoanId || `loan-${loan.bookId}-${loan.borrowDate}`} className={`loan-card ${isOverdue ? 'overdue' : ''}`}>
                  <div className="loan-book-info">
                    <div className="book-cover">📖</div>
                    <div className="book-details">
                      <h3 className="book-title">{loan.bookTitle || 'Book Title'}</h3>
                      <p className="book-author">by {loan.bookAuthor || 'Unknown Author'}</p>
                      <div className="book-meta">
                        <span className="book-genre">📚 {loan.bookGenre || 'Genre'}</span>
                        <span className="book-isbn">🔢 {loan.bookIsbn || loan.bookId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="loan-details">
                    <div className="loan-info">
                      <div className="info-row">
                        <span className="info-label">Ngày mượn:</span>
                        <span className="info-value">{formatDate(loan.borrowDate)}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Hạn trả:</span>
                        <span className={`info-value ${isOverdue ? 'overdue-text' : ''}`}>
                          {formatDate(loan.dueDate)}
                        </span>
                      </div>
                      {loan.returnDate && (
                        <div className="info-row">
                          <span className="info-label">Ngày trả:</span>
                          <span className="info-value">{formatDate(loan.returnDate)}</span>
                        </div>
                      )}
                      <div className="info-row">
                        <span className="info-label">Trạng thái:</span>
                        <span className={`status-badge ${getStatusColor(loan.status)}`}>
                          {loan.status === 'ACTIVE' || loan.status === 'BORROWED' 
                            ? 'Đang mượn' 
                            : loan.status === 'RETURNED' 
                            ? 'Đã trả' 
                            : loan.status}
                        </span>
                      </div>
                    </div>

                    {/* Due Date Warning */}
                    {(loan.status === 'ACTIVE' || loan.status === 'BORROWED') && (
                      <div className="due-warning">
                        {isOverdue ? (
                          <div className="warning overdue-warning">
                            ⚠️ Quá hạn {Math.abs(daysUntilDue)} ngày
                          </div>
                        ) : daysUntilDue <= 3 ? (
                          <div className="warning due-soon">
                            ⏰ Sắp đến hạn ({daysUntilDue} ngày)
                          </div>
                        ) : (
                          <div className="due-info">
                            📅 Còn {daysUntilDue} ngày
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="loan-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleViewBook(loan.bookId)}
                    >
                      👁️ Xem chi tiết
                    </button>
                    {(loan.status === 'ACTIVE' || loan.status === 'BORROWED') && (
                      <>
                        <button 
                          className="btn btn-warning"
                          onClick={() => {
                            console.log('Extend button clicked for loan:', loan); // Debug full loan object
                            handleExtendLoan(loan.id || loan.loanId || loan.bookLoanId, loan.dueDate);
                          }}
                        >
                          📅 Gia hạn
                        </button>
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            console.log('Return button clicked for loan:', loan); // Debug full loan object
                            handleReturnBook(loan.id || loan.loanId || loan.bookLoanId, loan);
                          }}
                        >
                          📤 Trả sách
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-loans">
            <div className="no-loans-icon">📚</div>
            <h3>
              {statusFilter === 'ALL' 
                ? 'Bạn chưa mượn sách nào' 
                : `Không có sách nào với trạng thái "${statusFilter}"`}
            </h3>
            <p>
              {statusFilter === 'ALL' 
                ? 'Hãy duyệt thư viện và mượn sách yêu thích của bạn!' 
                : 'Thử thay đổi bộ lọc để xem các sách khác.'}
            </p>
            {statusFilter === 'ALL' && (
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/books')}
              >
                🔍 Duyệt sách
              </button>
            )}
          </div>
        )}
      </div>

      {/* Return Book Modal */}
      {showReturnModal && selectedLoan && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>📤 Trả sách</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowReturnModal(false);
                  setSelectedLoan(null);
                  setBookCondition('GOOD');
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="book-info">
                <h4>📖 {selectedLoan.bookTitle}</h4>
                <p>👤 {selectedLoan.bookAuthor}</p>
                <p>📅 Ngày mượn: {formatDate(selectedLoan.borrowDate)}</p>
                <p>⏰ Hạn trả: {formatDate(selectedLoan.dueDate)}</p>
              </div>
              
              <div className="condition-selection">
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
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowReturnModal(false);
                  setSelectedLoan(null);
                  setBookCondition('GOOD');
                }}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary"
                onClick={confirmReturnBook}
              >
                Xác nhận trả sách
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLoans;
