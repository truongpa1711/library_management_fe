import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '../../utils/auth';
import './FeedbackManagement.css';

const FeedbackManagement = () => {
  // State for feedbacks
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    bookTitle: '',
    userEmail: ''
  });

  // Modal states
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Fetch feedbacks with filters and pagination
  const fetchFeedbacks = useCallback(async (page = 0, size = 10, filterParams = {}) => {
    setLoading(true);
    setError('');

    try {
      const token = auth.getAccessToken();
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (page !== null && page !== undefined) params.append('page', page);
      if (size !== null && size !== undefined) params.append('size', size);
      if (filterParams.status) params.append('status', filterParams.status);
      if (filterParams.bookTitle) params.append('bookTitle', filterParams.bookTitle);
      if (filterParams.userEmail) params.append('userEmail', filterParams.userEmail);

      const response = await fetch(`/api/feedbacks?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setFeedbacks(data.data.content || []);
        setCurrentPage(data.data.number || 0);
        setTotalPages(data.data.totalPages || 0);
        setTotalElements(data.data.totalElements || 0);
      } else {
        setError(data.message || 'Failed to fetch feedbacks');
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchFeedbacks(0, pageSize, filters);
  }, [fetchFeedbacks, pageSize, filters]);

  // Handle filter change
  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);
    setCurrentPage(0);
    fetchFeedbacks(0, pageSize, newFilters);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      fetchFeedbacks(newPage, pageSize, filters);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(0);
    fetchFeedbacks(0, newSize, filters);
  };

  // Handle approve feedback
  const handleApproveFeedback = async (feedbackId) => {
    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required');
        return;
      }

      const response = await fetch(`/api/feedbacks/${feedbackId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'APPROVED'
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert('Feedback approved successfully!');
        fetchFeedbacks(currentPage, pageSize, filters);
      } else {
        alert(data.message || 'Failed to approve feedback');
      }
    } catch (error) {
      console.error('Error approving feedback:', error);
      alert('Network error. Please try again.');
    }
  };

  // Handle reject feedback
  const handleRejectFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to reject this feedback?')) {
      return;
    }

    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required');
        return;
      }

      const response = await fetch(`/api/feedbacks/${feedbackId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'REJECTED'
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert('Feedback rejected successfully!');
        fetchFeedbacks(currentPage, pageSize, filters);
      } else {
        alert(data.message || 'Failed to reject feedback');
      }
    } catch (error) {
      console.error('Error rejecting feedback:', error);
      alert('Network error. Please try again.');
    }
  };

  // Handle reply to feedback
  const handleReplyFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setReplyContent(feedback.reply || '');
    setShowReplyModal(true);
  };

  // Submit reply
  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      alert('Please enter a reply');
      return;
    }

    setSubmittingReply(true);

    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required');
        return;
      }

      // Encode the reply content for URL parameter
      const encodedReplyContent = encodeURIComponent(replyContent.trim());
      
      const response = await fetch(`/api/feedbacks/${selectedFeedback.id}/reply?replyContent=${encodedReplyContent}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert('Reply submitted successfully!');
        setShowReplyModal(false);
        setReplyContent('');
        setSelectedFeedback(null);
        fetchFeedbacks(currentPage, pageSize, filters);
      } else {
        alert(data.message || 'Failed to submit reply');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('Network error. Please try again.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Handle delete feedback
  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
      return;
    }

    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required');
        return;
      }

      const response = await fetch(`/api/feedbacks/${feedbackId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        alert('Feedback deleted successfully!');
        fetchFeedbacks(currentPage, pageSize, filters);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete feedback');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Network error. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#ffc107';
      case 'APPROVED': return '#28a745';
      case 'REJECTED': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'APPROVED': return '✅';
      case 'REJECTED': return '❌';
      default: return '❓';
    }
  };

  if (loading && feedbacks.length === 0) {
    return (
      <div className="feedback-management">
        <div className="loading-container">
          <div className="loading-spinner">Loading feedbacks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-management">
      {/* Header */}
      <div className="page-header">
        <h1>💬 Quản lý Feedback</h1>
        <p>Quản lý đánh giá và phản hồi từ người dùng</p>
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
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Đã từ chối</option>
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
            <label>Email người dùng:</label>
            <input
              type="text"
              placeholder="Tìm theo email..."
              value={filters.userEmail}
              onChange={(e) => handleFilterChange('userEmail', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Số items/trang:</label>
            <select 
              value={pageSize} 
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <p>
          Hiển thị <strong>{feedbacks.length}</strong> trên <strong>{totalElements}</strong> feedback
          {filters.status || filters.bookTitle || filters.userEmail ? ' (đã lọc)' : ''}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={() => fetchFeedbacks(currentPage, pageSize, filters)}>
            Thử lại
          </button>
        </div>
      )}

      {/* Feedbacks List */}
      {feedbacks.length > 0 ? (
        <div className="feedbacks-list">
          {feedbacks.map((feedback) => (
            <div key={feedback.id} className={`feedback-card status-${feedback.status.toLowerCase()}`}>
              <div className="feedback-header">
                <div className="feedback-meta">
                  <h3 className="book-title">📚 {feedback.bookTitle}</h3>
                  <div className="user-info">
                    <span className="user-email">👤 {feedback.userEmail}</span>
                    <span className="feedback-date">
                      📅 {new Date(feedback.createdDate).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                
                <div className="feedback-status-actions">
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(feedback.status) }}
                  >
                    {getStatusIcon(feedback.status)} {feedback.status}
                  </span>
                  
                  <div className="action-buttons">
                    {feedback.status === 'PENDING' && (
                      <>
                        <button 
                          className="btn btn-approve"
                          onClick={() => handleApproveFeedback(feedback.id)}
                          title="Duyệt feedback"
                        >
                          ✅
                        </button>
                        <button 
                          className="btn btn-reject"
                          onClick={() => handleRejectFeedback(feedback.id)}
                          title="Từ chối feedback"
                        >
                          ❌
                        </button>
                      </>
                    )}
                    
                    <button 
                      className="btn btn-reply"
                      onClick={() => handleReplyFeedback(feedback)}
                      title="Phản hồi"
                    >
                      💬
                    </button>
                    
                    <button 
                      className="btn btn-delete"
                      onClick={() => handleDeleteFeedback(feedback.id)}
                      title="Xóa feedback"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

              <div className="feedback-content">
                <div className="rating-display">
                  <span className="rating-stars">
                    {'⭐'.repeat(feedback.rating)}
                  </span>
                  <span className="rating-value">({feedback.rating}/5)</span>
                </div>
                
                <div className="feedback-text">
                  <p>{feedback.content}</p>
                </div>
              </div>

              {feedback.reply && (
                <div className="admin-reply">
                  <div className="reply-header">
                    <span className="reply-label">💬 Phản hồi từ admin:</span>
                    {feedback.repliedDate && (
                      <span className="reply-date">
                        {new Date(feedback.repliedDate).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                  <div className="reply-content">
                    <p>{feedback.reply}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : !loading ? (
        <div className="no-feedbacks">
          <div className="no-feedbacks-icon">💭</div>
          <h3>Không có feedback nào</h3>
          <p>
            {filters.status || filters.bookTitle || filters.userEmail 
              ? 'Không tìm thấy feedback nào với bộ lọc hiện tại.'
              : 'Chưa có feedback nào trong hệ thống.'
            }
          </p>
        </div>
      ) : null}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            <span>Trang {currentPage + 1} trên {totalPages}</span>
          </div>
          
          <div className="pagination-controls">
            <button 
              className={`pagination-btn ${currentPage === 0 ? 'disabled' : ''}`}
              onClick={() => handlePageChange(0)}
              disabled={currentPage === 0}
            >
              ⏮️
            </button>
            
            <button 
              className={`pagination-btn ${currentPage === 0 ? 'disabled' : ''}`}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              ◀️
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(0, Math.min(currentPage - 2 + i, totalPages - 5 + i));
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
              ▶️
            </button>
            
            <button 
              className={`pagination-btn ${currentPage === totalPages - 1 ? 'disabled' : ''}`}
              onClick={() => handlePageChange(totalPages - 1)}
              disabled={currentPage === totalPages - 1}
            >
              ⏭️
            </button>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedFeedback && (
        <div className="modal-overlay" onClick={() => setShowReplyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💬 Phản hồi Feedback</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowReplyModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="original-feedback">
                <h4>Feedback gốc:</h4>
                <div className="original-content">
                  <p><strong>Người dùng:</strong> {selectedFeedback.userEmail}</p>
                  <p><strong>Sách:</strong> {selectedFeedback.bookTitle}</p>
                  <p><strong>Đánh giá:</strong> {'⭐'.repeat(selectedFeedback.rating)} ({selectedFeedback.rating}/5)</p>
                  <p><strong>Nội dung:</strong> {selectedFeedback.content}</p>
                </div>
              </div>
              
              <div className="reply-section">
                <label>Phản hồi của bạn:</label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Nhập phản hồi của bạn..."
                  rows="4"
                  className="reply-textarea"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowReplyModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSubmitReply}
                disabled={submittingReply || !replyContent.trim()}
              >
                {submittingReply ? 'Đang gửi...' : 'Gửi phản hồi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && feedbacks.length > 0 && (
        <div className="loading-overlay">
          <div className="loading-spinner">Đang tải...</div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;
