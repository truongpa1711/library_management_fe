import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../../utils/auth';
import './BookDetails.css';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Similar books state
  const [similarBooks, setSimilarBooks] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarError, setSimilarError] = useState('');
  
  // Reservation state
  const [reserving, setReserving] = useState(false);
  const [userReservedBooks, setUserReservedBooks] = useState(new Set());

  // Feedbacks state
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);
  const [feedbacksError, setFeedbacksError] = useState('');
  const [feedbackPage, setFeedbackPage] = useState(0);
  const [feedbackTotalPages, setFeedbackTotalPages] = useState(0);
  const [feedbackTotalElements, setFeedbackTotalElements] = useState(0);
  const [feedbackPageSize] = useState(5);
  
  // Rating statistics state
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  // Add feedback modal state
  const [showAddFeedbackModal, setShowAddFeedbackModal] = useState(false);
  const [newFeedbackContent, setNewFeedbackContent] = useState('');
  const [newFeedbackRating, setNewFeedbackRating] = useState(5);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Edit feedback modal state
  const [showEditFeedbackModal, setShowEditFeedbackModal] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [editFeedbackContent, setEditFeedbackContent] = useState('');
  const [editFeedbackRating, setEditFeedbackRating] = useState(5);
  const [updatingFeedback, setUpdatingFeedback] = useState(false);

  const fetchFeedbacks = useCallback(async (bookId, page = 0) => {
    setFeedbacksLoading(true);
    setFeedbacksError('');

    try {
      const token = auth.getAccessToken();
      if (!token) {
        setFeedbacksError('No authentication token found');
        return;
      }

      const response = await fetch(`/api/feedbacks/book/${bookId}?page=${page}&size=${feedbackPageSize}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setFeedbacks(data.data.content || []);
        setFeedbackPage(data.data.number || 0);
        setFeedbackTotalPages(data.data.totalPages || 0);
        setFeedbackTotalElements(data.data.totalElements || 0);
        
        // Update rating statistics if available
        if (data.data.averageRating !== undefined) {
          setAverageRating(data.data.averageRating);
        }
        if (data.data.totalRatings !== undefined) {
          setTotalRatings(data.data.totalRatings);
        }
      } else {
        setFeedbacksError(data.message || 'Failed to fetch feedbacks');
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      setFeedbacksError('Network error. Please check your connection.');
    } finally {
      setFeedbacksLoading(false);
    }
  }, [feedbackPageSize]);

  useEffect(() => {
    const fetchBookDetails = async () => {
      setLoading(true);
      setError('');

      try {
        const token = auth.getAccessToken();
        if (!token) {
          setError('No authentication token found');
          return;
        }

        const response = await fetch(`/api/books/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
          setBook(data.data);
          // Fetch similar books and feedbacks after getting book details
          fetchSimilarBooks(id);
          fetchFeedbacks(id);
        } else {
          setError(data.message || 'Failed to fetch book details');
        }
      } catch (error) {
        console.error('Error fetching book details:', error);
        setError('Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    const fetchSimilarBooks = async (bookId) => {
      setSimilarLoading(true);
      setSimilarError('');

      try {
        const token = auth.getAccessToken();
        if (!token) {
          setSimilarError('No authentication token found');
          return;
        }

        const response = await fetch(`/api/books/similar/${bookId}?limit=5`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
          setSimilarBooks(data.data || []);
        } else {
          setSimilarError(data.message || 'Failed to fetch similar books');
        }
      } catch (error) {
        console.error('Error fetching similar books:', error);
        setSimilarError('Network error. Please check your connection.');
      } finally {
        setSimilarLoading(false);
      }
    };

    if (id) {
      fetchBookDetails();
    }
  }, [id, fetchFeedbacks]);

  // Fetch user's reserved books
  useEffect(() => {
    const fetchUserReservedBooks = async () => {
      try {
        const token = auth.getAccessToken();
        if (!token) return;

        const response = await fetch('/api/reservations/user?page=0&size=100', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        if (response.ok && data.status === 'success') {
          // Extract book IDs from active reservations
          const reservationsData = data.data?.content || data.data || [];
          const reservedBookIds = new Set(
            reservationsData
              .filter(reservation => reservation.status === 'PENDING' || reservation.status === 'APPROVED')
              .map(reservation => reservation.bookId)
          );
          setUserReservedBooks(reservedBookIds);
        }
      } catch (error) {
        console.error('Error fetching reserved books:', error);
      }
    };

    fetchUserReservedBooks();
  }, []);

  const handleFeedbackPageChange = (newPage) => {
    if (newPage >= 0 && newPage < feedbackTotalPages && book) {
      setFeedbackPage(newPage);
      fetchFeedbacks(book.id, newPage);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!newFeedbackContent.trim()) {
      alert('Vui lòng nhập nội dung đánh giá');
      return;
    }

    setSubmittingFeedback(true);

    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const response = await fetch('/api/feedbacks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookId: book.id,
          content: newFeedbackContent.trim(),
          rating: newFeedbackRating
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert('Đánh giá đã được gửi thành công!');
        
        // Reset form and close modal
        setNewFeedbackContent('');
        setNewFeedbackRating(5);
        setShowAddFeedbackModal(false);
        
        // Refresh feedbacks list
        fetchFeedbacks(book.id, 0);
        setFeedbackPage(0);
      } else {
        alert(data.message || 'Gửi đánh giá thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Handle edit feedback
  const handleEditFeedback = (feedback) => {
    setEditingFeedback(feedback);
    setEditFeedbackContent(feedback.content);
    setEditFeedbackRating(feedback.rating);
    setShowEditFeedbackModal(true);
  };

  // Handle update feedback
  const handleUpdateFeedback = async () => {
    if (!editFeedbackContent.trim()) {
      alert('Vui lòng nhập nội dung đánh giá');
      return;
    }

    setUpdatingFeedback(true);

    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const response = await fetch(`/api/feedbacks/${editingFeedback.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: editFeedbackContent.trim(),
          rating: editFeedbackRating
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert('Đánh giá đã được cập nhật thành công!');
        
        // Reset form and close modal
        setEditFeedbackContent('');
        setEditFeedbackRating(5);
        setEditingFeedback(null);
        setShowEditFeedbackModal(false);
        
        // Refresh feedbacks list
        fetchFeedbacks(book.id, feedbackPage);
      } else {
        alert(data.message || 'Cập nhật đánh giá thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
      alert('Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setUpdatingFeedback(false);
    }
  };

  const handleBorrowBook = async () => {
    // Borrowing is now admin-only functionality
    alert('Borrowing functionality is only available for administrators. Please contact library staff to borrow this book.');
  };

  // Handle reserve book
  const handleReserveBook = async () => {
    if (!book) {
      alert('Book information not available.');
      return;
    }

    // Check if user already reserved this book
    if (userReservedBooks.has(book.id)) {
      alert(`You have already reserved "${book.title}".`);
      return;
    }

    setReserving(true);
    
    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookId: book.id
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert(`Successfully reserved "${book.title}"!\nYou will be notified when the book becomes available.`);
        
        // Update user reserved books state
        setUserReservedBooks(prev => new Set(prev).add(book.id));
        
        // Refresh book details
        window.location.reload();
      } else {
        alert(data.message || 'Failed to reserve book. Please try again.');
      }
    } catch (error) {
      console.error('Error reserving book:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setReserving(false);
    }
  };

  const handleGoBack = () => {
    navigate('/books'); // Navigate back to Browse Books page
  };

  if (loading) {
    return (
      <div className="book-details-page">
        <div className="loading-container">
          <div className="loading-spinner">Loading book details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="book-details-page">
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button className="btn-outline" onClick={handleGoBack}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="book-details-page">
        <div className="error-container">
          <div className="error-message">Book not found</div>
          <button className="btn-outline" onClick={handleGoBack}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="book-details-page">
      {/* Header with navigation */}
      <div className="book-details-header">
        <button className="back-button" onClick={handleGoBack}>
          ← Back to Books
        </button>
        <h1>Book Details</h1>
      </div>

      {/* Main content */}
      <div className="book-details-content">
        <div className="book-details-main">
          {/* Book cover and basic info */}
          <div className="book-hero">
            <div className="book-cover-section">
              <div className="book-cover-large">📖</div>
              <span className={`book-status-large ${book.availableQuantity > 0 ? 'available' : 'unavailable'}`}>
                {book.availableQuantity > 0 ? 'Available' : 'Not Available'}
              </span>
            </div>
            
            <div className="book-hero-info">
              <h2 className="book-title">{book.title}</h2>
              <p className="book-author">by {book.author}</p>
              
              {/* Quick stats */}
              <div className="book-quick-stats">
                <div className="stat-item">
                  <span className="stat-label">Available</span>
                  <span className="stat-value">{book.availableQuantity}/{book.totalQuantity}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Genre</span>
                  <span className="stat-value">{book.genre}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Year</span>
                  <span className="stat-value">{book.publicationYear}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="book-actions">
                {book.availableQuantity > 0 ? (
                  <button 
                    className="btn-primary" 
                    onClick={handleBorrowBook}
                  >
                    📚 Request Borrow
                  </button>
                ) : userReservedBooks.has(book.id) ? (
                  <button className="btn-secondary" disabled>
                    📋 Already Reserved
                  </button>
                ) : (
                  <button 
                    className="btn-warning" 
                    onClick={handleReserveBook}
                    disabled={reserving}
                  >
                    {reserving ? '⏳ Reserving...' : '📋 Reserve This Book'}
                  </button>
                )}
                <button className="btn-outline">
                  ❤️ Add to Favorites
                </button>
              </div>
            </div>
          </div>

          {/* Detailed information */}
          <div className="book-details-sections">
            {/* Description */}
            {book.description && (
              <section className="detail-section">
                <h3>Description</h3>
                <p className="book-description">{book.description}</p>
              </section>
            )}

            {/* Book Information */}
            <section className="detail-section">
              <h3>Book Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>ISBN</label>
                  <span>{book.isbn}</span>
                </div>
                <div className="info-item">
                  <label>Publisher</label>
                  <span>{book.publisher}</span>
                </div>
                <div className="info-item">
                  <label>Publication Year</label>
                  <span>{book.publicationYear}</span>
                </div>
                <div className="info-item">
                  <label>Genre</label>
                  <span>{book.genre}</span>
                </div>
                <div className="info-item">
                  <label>Location</label>
                  <span>{book.location}</span>
                </div>
                <div className="info-item">
                  <label>Status</label>
                  <span className={`status-badge ${book.status.toLowerCase()}`}>
                    {book.status}
                  </span>
                </div>
              </div>
            </section>

            {/* Availability */}
            <section className="detail-section">
              <h3>Availability</h3>
              <div className="availability-info">
                <div className="availability-item">
                  <span className="availability-label">Total Copies:</span>
                  <span className="availability-value">{book.totalQuantity}</span>
                </div>
                <div className="availability-item">
                  <span className="availability-label">Available:</span>
                  <span className="availability-value">{book.availableQuantity}</span>
                </div>
                <div className="availability-item">
                  <span className="availability-label">Times Borrowed:</span>
                  <span className="availability-value">{book.borrowCount}</span>
                </div>
              </div>
            </section>

            {/* Categories */}
            {book.categories && book.categories.length > 0 && (
              <section className="detail-section">
                <h3>Categories</h3>
                <div className="categories-list">
                  {book.categories.map((category) => (
                    <span key={category.id} className="category-tag">
                      {category.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Similar Books Section */}
            <section className="detail-section">
              <h3>📚 Similar Books</h3>
              {similarLoading ? (
                <div className="similar-loading">
                  <div className="loading-spinner">Finding similar books...</div>
                </div>
              ) : similarError ? (
                <div className="similar-error">
                  <p>{similarError}</p>
                </div>
              ) : similarBooks.length > 0 ? (
                <div className="similar-books-grid">
                  {similarBooks.map((similarBook) => (
                    <div key={similarBook.id} className="similar-book-card">
                      <div className="similar-book-cover">📖</div>
                      <div className="similar-book-info">
                        <h4 className="similar-book-title">{similarBook.title}</h4>
                        <p className="similar-book-author">by {similarBook.author}</p>
                        <div className="similar-book-details">
                          <span className="similar-book-genre">📚 {similarBook.genre}</span>
                          <span className="similar-book-year">📅 {similarBook.publicationYear}</span>
                        </div>
                        <span className={`similar-availability ${similarBook.availableQuantity > 0 ? 'available' : 'unavailable'}`}>
                          {similarBook.availableQuantity > 0 ? `✓ Available (${similarBook.availableQuantity})` : '✗ Not Available'}
                        </span>
                      </div>
                      <button 
                        className="similar-book-action"
                        onClick={() => navigate(`/book/${similarBook.id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-similar-books">
                  <div className="placeholder-icon">🔍</div>
                  <p>No similar books found at the moment.</p>
                </div>
              )}
            </section>

            {/* Rating and Reviews Section - Ready for future development */}
            <section className="detail-section">
              <h3>Ratings & Reviews</h3>
              <div className="rating-section">
                {(averageRating > 0 || book.averageRating) ? (
                  <div className="rating-summary">
                    <div className="rating-score">
                      <span className="rating-stars">⭐ {(averageRating || book.averageRating || 0).toFixed(1)}</span>
                      <span className="rating-count">({totalRatings || book.totalRatings || 0} đánh giá)</span>
                    </div>
                    <div className="rating-details">
                      <span className="rating-info">
                        Điểm trung bình: <strong>{(averageRating || book.averageRating || 0).toFixed(1)}/5</strong>
                      </span>
                      <span className="rating-info">
                        Tổng số đánh giá: <strong>{totalRatings || book.totalRatings || 0}</strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="no-ratings">
                    <p>📝 Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá cuốn sách này!</p>
                  </div>
                )}
                
                {/* Placeholder for rating and review components */}
                <div className="feedbacks-section">
                  <div className="feedbacks-header">
                    <h4>💬 Đánh giá từ người đọc</h4>
                    <button 
                      className="btn btn-outline add-feedback-btn"
                      onClick={() => setShowAddFeedbackModal(true)}
                    >
                      ⭐ Thêm đánh giá
                    </button>
                  </div>
                  
                  {feedbacksLoading ? (
                    <div className="feedbacks-loading">
                      <div className="loading-spinner">Đang tải đánh giá...</div>
                    </div>
                  ) : feedbacksError ? (
                    <div className="feedbacks-error">
                      <p>{feedbacksError}</p>
                    </div>
                  ) : feedbacks.length > 0 ? (
                    <div className="feedbacks-content">
                      <div className="feedbacks-summary">
                        <div className="summary-stats">
                          <span className="summary-text">
                            Hiển thị {feedbacks.length} trên {feedbackTotalElements} đánh giá
                          </span>
                          {(averageRating > 0 || totalRatings > 0) && (
                            <div className="summary-rating">
                              <span className="summary-rating-score">⭐ {averageRating.toFixed(1)}</span>
                              <span className="summary-rating-count">({totalRatings} đánh giá)</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="feedbacks-list">
                        {feedbacks.map((feedback) => (
                          <div key={feedback.id} className={`feedback-card ${feedback.status.toLowerCase()}`}>
                            <div className="feedback-header">
                              <div className="feedback-user">
                                <span className="user-email">� {feedback.userEmail}</span>
                                <span className="feedback-date">
                                  📅 {new Date(feedback.createdDate).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              <div className="feedback-rating">
                                <span className="rating-stars">
                                  {'⭐'.repeat(feedback.rating)}
                                </span>
                                <span className="rating-value">({feedback.rating}/5)</span>
                              </div>
                            </div>
                            
                            <div className="feedback-content">
                              <p>{feedback.content}</p>
                            </div>
                            
                            {feedback.reply && (
                              <div className="feedback-reply">
                                <div className="reply-header">
                                  <span className="reply-label">📝 Phản hồi từ admin:</span>
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
                            
                            <div className="feedback-footer">
                              <div className="feedback-status-section">
                                <span className={`feedback-status status-${feedback.status.toLowerCase()}`}>
                                  {feedback.status === 'PENDING' ? '⏳ Đang xử lý' : 
                                   feedback.status === 'APPROVED' ? '✅ Đã duyệt' : 
                                   feedback.status === 'REJECTED' ? '❌ Bị từ chối' : feedback.status}
                                </span>
                                {feedback.isEditable && feedback.status === 'PENDING' && (
                                  <button 
                                    className="edit-feedback-btn"
                                    onClick={() => handleEditFeedback(feedback)}
                                    title="Chỉnh sửa đánh giá"
                                  >
                                    ✏️ Chỉnh sửa
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Pagination */}
                      {feedbackTotalPages > 1 && (
                        <div className="feedbacks-pagination">
                          <button 
                            className={`pagination-btn ${feedbackPage === 0 ? 'disabled' : ''}`}
                            onClick={() => handleFeedbackPageChange(feedbackPage - 1)}
                            disabled={feedbackPage === 0}
                          >
                            ◀️ Trước
                          </button>
                          
                          <span className="pagination-info">
                            Trang {feedbackPage + 1} / {feedbackTotalPages}
                          </span>
                          
                          <button 
                            className={`pagination-btn ${feedbackPage === feedbackTotalPages - 1 ? 'disabled' : ''}`}
                            onClick={() => handleFeedbackPageChange(feedbackPage + 1)}
                            disabled={feedbackPage === feedbackTotalPages - 1}
                          >
                            Sau ▶️
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="no-feedbacks">
                      <div className="no-feedbacks-icon">💭</div>
                      <h4>Chưa có đánh giá nào</h4>
                      <p>Hãy là người đầu tiên đánh giá cuốn sách này!</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Add Feedback Modal */}
      {showAddFeedbackModal && (
        <div className="modal-overlay" onClick={() => setShowAddFeedbackModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⭐ Thêm đánh giá</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowAddFeedbackModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="rating-section">
                <label>Đánh giá sao:</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${star <= newFeedbackRating ? 'filled' : ''}`}
                      onClick={() => setNewFeedbackRating(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="rating-text">({newFeedbackRating}/5 sao)</span>
              </div>
              
              <div className="content-section">
                <label>Nội dung đánh giá:</label>
                <textarea
                  value={newFeedbackContent}
                  onChange={(e) => setNewFeedbackContent(e.target.value)}
                  placeholder="Chia sẻ cảm nhận của bạn về cuốn sách này..."
                  rows="4"
                  className="feedback-textarea"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowAddFeedbackModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSubmitFeedback}
                disabled={submittingFeedback || !newFeedbackContent.trim() || newFeedbackRating === 0}
              >
                {submittingFeedback ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Feedback Modal */}
      {showEditFeedbackModal && editingFeedback && (
        <div className="modal-overlay" onClick={() => setShowEditFeedbackModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Chỉnh sửa đánh giá</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowEditFeedbackModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="rating-section">
                <label>Đánh giá sao:</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${star <= editFeedbackRating ? 'filled' : ''}`}
                      onClick={() => setEditFeedbackRating(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="rating-text">({editFeedbackRating}/5 sao)</span>
              </div>
              
              <div className="content-section">
                <label>Nội dung đánh giá:</label>
                <textarea
                  value={editFeedbackContent}
                  onChange={(e) => setEditFeedbackContent(e.target.value)}
                  placeholder="Chia sẻ cảm nhận của bạn về cuốn sách này..."
                  rows="4"
                  className="feedback-textarea"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowEditFeedbackModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleUpdateFeedback}
                disabled={updatingFeedback || !editFeedbackContent.trim() || editFeedbackRating === 0}
              >
                {updatingFeedback ? 'Đang cập nhật...' : 'Cập nhật đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetails;
