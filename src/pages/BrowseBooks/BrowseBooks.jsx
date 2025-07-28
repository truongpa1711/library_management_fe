import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../utils/auth';
import './BrowseBooks.css';

const BrowseBooks = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booksLoading, setBooksLoading] = useState(false);
  const [error, setError] = useState('');
  const [booksError, setBooksError] = useState('');
  
  // Borrowing state
  const [borrowingBooks, setBorrowingBooks] = useState(new Set());
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedBookToBorrow, setSelectedBookToBorrow] = useState(null);
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  
  // Initialize state from sessionStorage if available
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const saved = sessionStorage.getItem('browseBooks_selectedCategory');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [pagination, setPagination] = useState(() => {
    const savedPagination = sessionStorage.getItem('browseBooks_pagination');
    return savedPagination ? JSON.parse(savedPagination) : {
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0
    };
  });

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = auth.getAccessToken();
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/categories', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
          setCategories(data.data);
        } else {
          setError(data.message || 'Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Restore books from sessionStorage on component mount
  useEffect(() => {
    const savedBooks = sessionStorage.getItem('browseBooks_books');
    if (selectedCategory && savedBooks) {
      const booksData = JSON.parse(savedBooks);
      setBooks(booksData);
    }
  }, [selectedCategory]);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (selectedCategory) {
      sessionStorage.setItem('browseBooks_selectedCategory', JSON.stringify(selectedCategory));
    }
  }, [selectedCategory]);

  useEffect(() => {
    sessionStorage.setItem('browseBooks_pagination', JSON.stringify(pagination));
  }, [pagination]);

  useEffect(() => {
    if (books.length > 0) {
      sessionStorage.setItem('browseBooks_books', JSON.stringify(books));
    }
  }, [books]);

  // Helper function to get min and max dates for borrow period
  const getDateLimits = () => {
    const today = new Date();
    const minDate = new Date();
    minDate.setDate(today.getDate() + 1); // Minimum 1 day from now
    
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30); // Maximum 30 days from now
    
    return {
      min: minDate.toISOString().split('T')[0],
      max: maxDate.toISOString().split('T')[0]
    };
  };

  // Initialize expected return date with default (14 days)
  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 14);
    setExpectedReturnDate(defaultDate.toISOString().split('T')[0]);
  }, []);

  // Fetch books by category
  const fetchBooks = async (categoryId, page = 0, size = 10) => {
    setBooksLoading(true);
    setBooksError('');

    try {
      const token = auth.getAccessToken();
      if (!token) {
        setBooksError('No authentication token found');
        setBooksLoading(false);
        return;
      }

      const response = await fetch(`/api/books/get-by-category/${categoryId}?page=${page}&size=${size}&direction=null&orderBy=genre`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setBooks(data.data.content || []);
        setPagination({
          page: data.data.number || 0,
          size: data.data.size || 10,
          totalElements: data.data.totalElements || 0,
          totalPages: data.data.totalPages || 0
        });
      } else {
        setBooksError(data.message || 'Failed to fetch books');
        setBooks([]);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      setBooksError('Network error. Please check your connection.');
      setBooks([]);
    } finally {
      setBooksLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    fetchBooks(category.id, 0, pagination.size);
  };

  const handlePageSizeChange = (newSize) => {
    setPagination(prev => ({ ...prev, size: newSize, page: 0 }));
    if (selectedCategory) {
      fetchBooks(selectedCategory.id, 0, newSize);
    }
  };

  const handleBookClick = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  const handleBorrowBook = async (book, event) => {
    // Prevent navigation to book details
    event.stopPropagation();
    
    if (!book || book.availableQuantity <= 0) {
      alert('This book is not available for borrowing.');
      return;
    }

    // Show borrow modal instead of immediate borrowing
    setSelectedBookToBorrow(book);
    setShowBorrowModal(true);
  };

  const confirmBorrowBook = async () => {
    if (!selectedBookToBorrow || !expectedReturnDate) {
      alert('Vui lòng chọn ngày trả dự kiến');
      return;
    }

    setBorrowingBooks(prev => new Set(prev).add(selectedBookToBorrow.id));
    
    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        setBorrowingBooks(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedBookToBorrow.id);
          return newSet;
        });
        return;
      }

      const response = await fetch('/api/book-loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookIds: [selectedBookToBorrow.id],
          dueDate: expectedReturnDate
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert(`Successfully borrowed "${selectedBookToBorrow.title}"!\nDue date: ${expectedReturnDate}`);
        
        // Close modal and reset
        setShowBorrowModal(false);
        setSelectedBookToBorrow(null);
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 14);
        setExpectedReturnDate(defaultDate.toISOString().split('T')[0]);
        
        // Refresh books list to update availability
        if (selectedCategory) {
          fetchBooks(selectedCategory.id, pagination.page, pagination.size);
        }
      } else {
        alert(data.message || 'Failed to borrow book. Please try again.');
      }
    } catch (error) {
      console.error('Error borrowing book:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setBorrowingBooks(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedBookToBorrow.id);
        return newSet;
      });
    }
  };

  return (
    <div className="browse-books">
      {/* Header */}
      <div className="browse-header">
        <h1>Browse Books</h1>
        <p>Discover books by category</p>
      </div>

      {/* Categories Section - Compact */}
      <section className="categories-compact">
        <h2>Categories</h2>
        {loading ? (
          <div className="loading-spinner-compact">Loading...</div>
        ) : error ? (
          <div className="error-message-compact">{error}</div>
        ) : (
          <div className="categories-row">
            {categories.map((category) => (
              <div 
                key={category.id} 
                className={`category-chip ${selectedCategory?.id === category.id ? 'active' : ''}`}
                onClick={() => handleCategoryClick(category)}
              >
                <span className="category-chip-icon">📚</span>
                <span className="category-chip-name">{category.name}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Books Section */}
      <section className="books-section">
        {selectedCategory ? (
          <div>
            <h2>Books in "{selectedCategory.name}"</h2>
            <p className="category-description">{selectedCategory.description}</p>
            
            {/* Page Size Selector */}
            <div className="books-controls">
              <label className="page-size-label">
                Books per page:
                <select 
                  className="page-size-select"
                  value={pagination.size}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>
            
            {booksLoading ? (
              <div className="loading-spinner">Loading books...</div>
            ) : booksError ? (
              <div className="error-message">{booksError}</div>
            ) : books.length > 0 ? (
              <>
                <div className="books-grid">
                  {books.map((book) => (
                    <div key={book.id} className="book-card">
                      <div className="book-cover">📖</div>
                      <div className="book-info">
                        <h3 className="book-title">{book.title}</h3>
                        <p className="book-author">by {book.author}</p>
                        <p className="book-genre">Genre: {book.genre}</p>
                        <p className="book-publisher">Publisher: {book.publisher}</p>
                        <p className="book-year">Year: {book.publicationYear}</p>
                        <span className={`book-status ${book.availableQuantity > 0 ? 'available' : 'borrowed'}`}>
                          {book.availableQuantity > 0 ? `Available (${book.availableQuantity})` : 'Not Available'}
                        </span>
                      </div>
                      <div className="book-actions">
                        <button 
                          className="book-action-secondary"
                          onClick={() => handleBookClick(book.id)}
                        >
                          👁️ View Details
                        </button>
                        {book.availableQuantity > 0 ? (
                          <button 
                            className="book-action-primary"
                            onClick={(e) => handleBorrowBook(book, e)}
                            disabled={borrowingBooks.has(book.id)}
                          >
                            {borrowingBooks.has(book.id) ? '⏳ Borrowing...' : '📚 Borrow'}
                          </button>
                        ) : (
                          <button className="book-action-disabled" disabled>
                            ❌ Not Available
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      className="pagination-btn"
                      disabled={pagination.page === 0}
                      onClick={() => fetchBooks(selectedCategory.id, pagination.page - 1, pagination.size)}
                    >
                      ← Previous
                    </button>
                    
                    <div className="pagination-pages">
                      {/* First page */}
                      {pagination.page > 2 && (
                        <>
                          <button 
                            className="pagination-page"
                            onClick={() => fetchBooks(selectedCategory.id, 0, pagination.size)}
                          >
                            1
                          </button>
                          {pagination.page > 3 && <span className="pagination-dots">...</span>}
                        </>
                      )}
                      
                      {/* Previous page */}
                      {pagination.page > 0 && (
                        <button 
                          className="pagination-page"
                          onClick={() => fetchBooks(selectedCategory.id, pagination.page - 1, pagination.size)}
                        >
                          {pagination.page}
                        </button>
                      )}
                      
                      {/* Current page */}
                      <button className="pagination-page active">
                        {pagination.page + 1}
                      </button>
                      
                      {/* Next page */}
                      {pagination.page < pagination.totalPages - 1 && (
                        <button 
                          className="pagination-page"
                          onClick={() => fetchBooks(selectedCategory.id, pagination.page + 1, pagination.size)}
                        >
                          {pagination.page + 2}
                        </button>
                      )}
                      
                      {/* Last page */}
                      {pagination.page < pagination.totalPages - 3 && (
                        <>
                          {pagination.page < pagination.totalPages - 4 && <span className="pagination-dots">...</span>}
                          <button 
                            className="pagination-page"
                            onClick={() => fetchBooks(selectedCategory.id, pagination.totalPages - 1, pagination.size)}
                          >
                            {pagination.totalPages}
                          </button>
                        </>
                      )}
                    </div>
                    
                    <button 
                      className="pagination-btn"
                      disabled={pagination.page >= pagination.totalPages - 1}
                      onClick={() => fetchBooks(selectedCategory.id, pagination.page + 1, pagination.size)}
                    >
                      Next →
                    </button>
                  </div>
                )}
                
                {/* Pagination Info */}
                {books.length > 0 && (
                  <div className="pagination-info">
                    Showing {pagination.page * pagination.size + 1} - {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} of {pagination.totalElements} books
                  </div>
                )}
              </>
            ) : (
              <div className="no-books-found">
                <div className="placeholder-icon">📚</div>
                <h3>No books found</h3>
                <p>No books available in this category yet.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="no-category-selected">
            <div className="placeholder-icon">📚</div>
            <h3>Select a category to browse books</h3>
            <p>Choose a category from above to see available books</p>
          </div>
        )}
      </section>

      {/* Borrow Book Modal */}
      {showBorrowModal && selectedBookToBorrow && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>📚 Mượn sách</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowBorrowModal(false);
                  setSelectedBookToBorrow(null);
                  const defaultDate = new Date();
                  defaultDate.setDate(defaultDate.getDate() + 14);
                  setExpectedReturnDate(defaultDate.toISOString().split('T')[0]);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="book-info-modal">
                <h4>📖 {selectedBookToBorrow.title}</h4>
                <p>👤 {selectedBookToBorrow.author}</p>
                <p>📚 {selectedBookToBorrow.genre}</p>
                <p>📦 Số lượng còn lại: {selectedBookToBorrow.availableQuantity}</p>
              </div>
              
              <div className="date-selection">
                <label htmlFor="expectedReturnDate">
                  <strong>Ngày trả dự kiến:</strong>
                </label>
                <input
                  type="date"
                  id="expectedReturnDate"
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  min={getDateLimits().min}
                  max={getDateLimits().max}
                  className="date-input"
                />
                <div className="date-note">
                  <small>
                    📅 Bạn có thể mượn từ ngày mai đến tối đa 30 ngày
                  </small>
                </div>
              </div>
              
              <div className="borrow-terms">
                <p><strong>Điều khoản mượn sách:</strong></p>
                <ul>
                  <li>📖 Bạn có trách nhiệm giữ gìn sách trong tình trạng tốt</li>
                  <li>📅 Vui lòng trả sách đúng hạn để tránh phí phạt</li>
                  <li>🔄 Có thể gia hạn 1 lần nếu không có người đặt trước</li>
                  <li>💰 Phí phạt quá hạn: 5,000đ/ngày</li>
                </ul>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowBorrowModal(false);
                  setSelectedBookToBorrow(null);
                  const defaultDate = new Date();
                  defaultDate.setDate(defaultDate.getDate() + 14);
                  setExpectedReturnDate(defaultDate.toISOString().split('T')[0]);
                }}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary"
                onClick={confirmBorrowBook}
                disabled={borrowingBooks.has(selectedBookToBorrow.id) || !expectedReturnDate}
              >
                {borrowingBooks.has(selectedBookToBorrow.id) ? '⏳ Đang mượn...' : '✅ Xác nhận mượn sách'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseBooks;
