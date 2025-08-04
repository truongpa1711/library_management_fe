import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '../../utils/auth';
import './BookManagement.css';

const BookManagement = () => {
  // State for books
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(2);

  // State for categories (for form dropdowns)
  const [categories, setCategories] = useState([]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLendModal, setShowLendModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  // Lending modal states
  const [lendingData, setLendingData] = useState({
    userId: '',
    userEmail: '',
    dueDate: ''
  });
  const [lending, setLending] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    publicationYear: new Date().getFullYear(),
    description: '',
    genre: '',
    availableQuantity: 0,
    totalQuantity: 0,
    location: '',
    status: 'READY',
    imageUrl: '',
    categoryIds: []
  });
  const [submitting, setSubmitting] = useState(false);

  // Search and filter states
  const [searchFilters, setSearchFilters] = useState({
    title: '',
    author: '',
    genre: '',
    status: ''
  });

  const fetchCategories = useCallback(async (forceReload = false) => {
    try {
      const token = auth.getAccessToken();
      if (!token) return;

      // Simple API call without parameters as requested
      const timestamp = forceReload ? `?t=${Date.now()}` : '';
      const response = await fetch(`/api/categories${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      const data = await response.json();
      if (response.ok && data.status === 'success') {
        // Handle both paginated and non-paginated responses
        const categoriesData = data.data?.content || data.data || [];
        setCategories(categoriesData);
      } else {
        console.error('Failed to fetch categories:', data.message);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchBooks = useCallback(async (pageNum = 0, filters = {}) => {
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
      if (filters.title) params.append('title', filters.title);
      if (filters.author) params.append('author', filters.author);
      if (filters.genre) params.append('genre', filters.genre);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`/api/books?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const booksData = data.data?.content || data.data || [];
        setBooks(booksData);
        setPage(data.data?.number || 0);
        setTotalPages(data.data?.totalPages || 1);
        setTotalElements(data.data?.totalElements || booksData.length);
      } else {
        setError(data.message || 'Failed to fetch books');
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchCategories();
    fetchBooks();
  }, [fetchCategories, fetchBooks]);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
      fetchBooks(newPage, searchFilters);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchBooks(0, searchFilters);
  };

  const handleClearFilters = () => {
    setSearchFilters({
      title: '',
      author: '',
      genre: '',
      status: ''
    });
    setPage(0);
    fetchBooks(0, {});
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      isbn: '',
      publisher: '',
      publicationYear: new Date().getFullYear(),
      description: '',
      genre: '',
      availableQuantity: 0,
      totalQuantity: 0,
      location: '',
      status: 'READY',
      imageUrl: '',
      categoryIds: []
    });
  };

  const handleAddBook = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditBook = (book) => {
    setSelectedBook(book);
    setFormData({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      publisher: book.publisher || '',
      publicationYear: book.publicationYear || new Date().getFullYear(),
      description: book.description || '',
      genre: book.genre || '',
      availableQuantity: book.availableQuantity || 0,
      totalQuantity: book.totalQuantity || 0,
      location: book.location || '',
      status: book.status || 'READY',
      imageUrl: book.imageUrl || '',
      categoryIds: book.categories ? book.categories.map(cat => cat.id) : []
    });
    setShowEditModal(true);
  };

  const handleDeleteBook = (book) => {
    setSelectedBook(book);
    setShowDeleteModal(true);
  };

  const handleLendBook = (book) => {
    setSelectedBook(book);
    // Initialize lending data with default due date (14 days from now)
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 14);
    setLendingData({
      userId: '',
      userEmail: '',
      dueDate: defaultDueDate.toISOString().split('T')[0]
    });
    
    // Test token validity when opening modal
    const token = auth.getAccessToken();
    if (!token) {
      alert('Authentication required. Please login again.');
      return;
    }
    
    setShowLendModal(true);
  };

  // Search for users by email
  const searchUsers = async (email) => {
    if (!email.trim()) {
      setUserSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        setUserSearchResults([]);
        return;
      }

      const response = await fetch(`/api/user/searchByEmail?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('User search failed:', response.status, errorText);
        setUserSearchResults([]);
        return;
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        // API trả về paginated response với users trong data.content
        const users = data.data?.content || [];
        setUserSearchResults(users);
      } else {
        setUserSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setUserSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Handle user selection
  const handleSelectUser = (user) => {
    setLendingData(prev => ({
      ...prev,
      userId: user.id,
      userEmail: user.email
    }));
    setUserSearchResults([]);
  };

  // Handle lending book to user
  const handleSubmitLending = async () => {
    if (!lendingData.userId || !lendingData.dueDate) {
      alert('Vui lòng chọn người dùng và ngày trả dự kiến');
      return;
    }

    setLending(true);
    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const response = await fetch(`/api/book-loans/${lendingData.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookIds: [selectedBook.id],
          dueDate: lendingData.dueDate
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert(`Successfully lent "${selectedBook.title}" to ${lendingData.userEmail}!\nDue date: ${lendingData.dueDate}`);
        
        // Close modal and reset
        setShowLendModal(false);
        setLendingData({
          userId: '',
          userEmail: '',
          dueDate: ''
        });
        setSelectedBook(null);
        
        // Refresh books list
        fetchBooks(page, searchFilters);
      } else {
        alert(data.message || 'Failed to lend book. Please try again.');
      }
    } catch (error) {
      console.error('Error lending book:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setLending(false);
    }
  };

  const handleSubmitAdd = async () => {
    if (!formData.title.trim() || !formData.author.trim() || !formData.isbn.trim()) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc (Tên sách, Tác giả, ISBN)');
      return;
    }

    setSubmitting(true);

    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          title: formData.title.trim(),
          author: formData.author.trim(),
          isbn: formData.isbn.trim(),
          publisher: formData.publisher.trim(),
          description: formData.description.trim(),
          genre: formData.genre.trim(),
          location: formData.location.trim(),
          imageUrl: formData.imageUrl.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert('Thêm sách thành công!');
        setShowAddModal(false);
        resetForm();
        fetchBooks(0, searchFilters);
        setPage(0);
      } else {
        alert(data.message || 'Thêm sách thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error adding book:', error);
      alert('Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!formData.title.trim() || !formData.author.trim() || !formData.isbn.trim()) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc (Tên sách, Tác giả, ISBN)');
      return;
    }

    setSubmitting(true);

    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const response = await fetch(`/api/books/${selectedBook.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          title: formData.title.trim(),
          author: formData.author.trim(),
          isbn: formData.isbn.trim(),
          publisher: formData.publisher.trim(),
          description: formData.description.trim(),
          genre: formData.genre.trim(),
          location: formData.location.trim(),
          imageUrl: formData.imageUrl.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert('Cập nhật sách thành công!');
        setShowEditModal(false);
        resetForm();
        setSelectedBook(null);
        fetchBooks(page, searchFilters);
      } else {
        alert(data.message || 'Cập nhật sách thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error updating book:', error);
      alert('Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDelete = async () => {
    setSubmitting(true);

    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const response = await fetch(`/api/books/${selectedBook.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        alert('Xóa sách thành công!');
        setShowDeleteModal(false);
        setSelectedBook(null);
        
        // If we're on the last page and it becomes empty, go to previous page
        const remainingItems = books.length - 1;
        const newPage = remainingItems === 0 && page > 0 ? page - 1 : page;
        
        fetchBooks(newPage, searchFilters);
        setPage(newPage);
      } else {
        const data = await response.json();
        alert(data.message || 'Xóa sách thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowLendModal(false);
    setSelectedBook(null);
    setLendingData({
      userId: '',
      userEmail: '',
      dueDate: ''
    });
    setUserSearchResults([]);
    resetForm();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'READY': return '#28a745';
      case 'BORROWED': return '#ffc107';
      case 'MAINTENANCE': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'READY': return 'Sẵn sàng';
      case 'BORROWED': return 'Đã mượn';
      case 'MAINTENANCE': return 'Bảo trì';
      default: return status;
    }
  };

  if (loading && page === 0) {
    return (
      <div className="book-management">
        <div className="loading-container">
          <div className="loading-spinner">Đang tải danh sách sách...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="book-management">
      {/* Header */}
      <div className="book-header">
        <div className="header-left">
          <h2>📚 Quản lý Sách</h2>
          <p>Quản lý toàn bộ sách trong thư viện</p>
        </div>
        <div className="header-right">
          <button className="btn btn-primary" onClick={handleAddBook}>
            ➕ Thêm sách mới
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="book-filters">
        <div className="search-grid">
          <div className="search-field">
            <label>Tên sách</label>
            <input
              type="text"
              placeholder="Tìm theo tên sách..."
              value={searchFilters.title}
              onChange={(e) => setSearchFilters({...searchFilters, title: e.target.value})}
              className="search-input"
            />
          </div>
          
          <div className="search-field">
            <label>Tác giả</label>
            <input
              type="text"
              placeholder="Tìm theo tác giả..."
              value={searchFilters.author}
              onChange={(e) => setSearchFilters({...searchFilters, author: e.target.value})}
              className="search-input"
            />
          </div>
          
          <div className="search-field">
            <label>Thể loại</label>
            <input
              type="text"
              placeholder="Tìm theo thể loại..."
              value={searchFilters.genre}
              onChange={(e) => setSearchFilters({...searchFilters, genre: e.target.value})}
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
              <option value="READY">Sẵn sàng</option>
              <option value="BORROWED">Đã mượn</option>
              <option value="MAINTENANCE">Bảo trì</option>
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
            Tổng cộng: {totalElements} sách
          </span>
        </div>
      </div>

      {/* Books Table */}
      {error ? (
        <div className="error-container">
          <div className="error-message">
            <span className="error-icon">❌</span>
            {error}
          </div>
        </div>
      ) : books.length > 0 ? (
        <div className="books-content">
          <div className="books-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Thông tin sách</th>
                  <th>Tác giả</th>
                  <th>Thể loại</th>
                  <th>Số lượng</th>
                  <th>Trạng thái</th>
                  <th>Vị trí</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id}>
                    <td>#{book.id}</td>
                    <td>
                      <div className="book-info">
                        <div className="book-title">{book.title}</div>
                        <div className="book-details">
                          <span>📖 {book.isbn}</span>
                          <span>📅 {book.publicationYear}</span>
                          <span>🏢 {book.publisher}</span>
                        </div>
                        {book.categories && book.categories.length > 0 && (
                          <div className="book-categories">
                            {book.categories.map(cat => (
                              <span key={cat.id} className="category-badge">{cat.name}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="book-author">
                        👤 {book.author}
                      </div>
                    </td>
                    <td>
                      <div className="book-genre">
                        🏷️ {book.genre}
                      </div>
                    </td>
                    <td>
                      <div className="book-quantity">
                        <div className="quantity-available">
                          Có sẵn: <strong>{book.availableQuantity}</strong>
                        </div>
                        <div className="quantity-total">
                          Tổng: {book.totalQuantity}
                        </div>
                        <div className="quantity-borrowed">
                          Đã mượn: {book.borrowCount || 0}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(book.status) }}
                      >
                        {getStatusText(book.status)}
                      </span>
                    </td>
                    <td>
                      <div className="book-location">
                        📍 {book.location}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-lend"
                          onClick={() => handleLendBook(book)}
                          title="Cho mượn sách"
                          disabled={book.availableQuantity <= 0}
                        >
                          📚
                        </button>
                        <button
                          className="btn btn-edit"
                          onClick={() => handleEditBook(book)}
                          title="Chỉnh sửa"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-delete"
                          onClick={() => handleDeleteBook(book)}
                          title="Xóa"
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
                <span>({totalElements} sách)</span>
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
        <div className="no-books">
          <div className="no-books-icon">📚</div>
          <h3>Không tìm thấy sách nào</h3>
          <p>
            {Object.values(searchFilters).some(v => v) ? 
              'Không có sách nào phù hợp với tiêu chí tìm kiếm.' :
              'Chưa có sách nào trong hệ thống.'
            }
          </p>
          {!Object.values(searchFilters).some(v => v) && (
            <button className="btn btn-primary" onClick={handleAddBook}>
              ➕ Thêm sách đầu tiên
            </button>
          )}
        </div>
      )}

      {/* Add Book Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Thêm sách mới</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên sách *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Nhập tên sách..."
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Tác giả *</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({...formData, author: e.target.value})}
                    placeholder="Nhập tên tác giả..."
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>ISBN *</label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({...formData, isbn: e.target.value})}
                    placeholder="Nhập mã ISBN..."
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Nhà xuất bản</label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => setFormData({...formData, publisher: e.target.value})}
                    placeholder="Nhập nhà xuất bản..."
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Năm xuất bản</label>
                  <input
                    type="number"
                    value={formData.publicationYear}
                    onChange={(e) => setFormData({...formData, publicationYear: parseInt(e.target.value) || new Date().getFullYear()})}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Thể loại</label>
                  <input
                    type="text"
                    value={formData.genre}
                    onChange={(e) => setFormData({...formData, genre: e.target.value})}
                    placeholder="Nhập thể loại..."
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Số lượng có sẵn</label>
                  <input
                    type="number"
                    value={formData.availableQuantity}
                    onChange={(e) => setFormData({...formData, availableQuantity: parseInt(e.target.value) || 0})}
                    min="0"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Tổng số lượng</label>
                  <input
                    type="number"
                    value={formData.totalQuantity}
                    onChange={(e) => setFormData({...formData, totalQuantity: parseInt(e.target.value) || 0})}
                    min="0"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Vị trí</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Vd: Kệ A1, Tầng 2..."
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="form-select"
                  >
                    <option value="READY">Sẵn sàng</option>
                    <option value="BORROWED">Đã mượn</option>
                    <option value="MAINTENANCE">Bảo trì</option>
                  </select>
                </div>
                
                <div className="form-group full-width">
                  <label>URL hình ảnh</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Danh mục ({categories.length} danh mục có sẵn)</label>
                  <div className="categories-selection">
                    {categories.length > 0 ? (
                      categories.map(category => (
                        <label key={category.id} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.categoryIds.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  categoryIds: [...formData.categoryIds, category.id]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  categoryIds: formData.categoryIds.filter(id => id !== category.id)
                                });
                              }
                            }}
                          />
                          {category.name}
                        </label>
                      ))
                    ) : (
                      <div className="no-categories-message">
                        <span>⚠️ Chưa có danh mục nào. <a href="/admin/categories">Thêm danh mục trước</a>.</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="form-group full-width">
                  <label>Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Nhập mô tả về cuốn sách..."
                    className="form-textarea"
                    rows="3"
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModals}>
                Hủy
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSubmitAdd}
                disabled={submitting || !formData.title.trim() || !formData.author.trim() || !formData.isbn.trim()}
              >
                {submitting ? 'Đang thêm...' : 'Thêm sách'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {showEditModal && selectedBook && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Chỉnh sửa sách</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên sách *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Nhập tên sách..."
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Tác giả *</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({...formData, author: e.target.value})}
                    placeholder="Nhập tên tác giả..."
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>ISBN *</label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({...formData, isbn: e.target.value})}
                    placeholder="Nhập mã ISBN..."
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Nhà xuất bản</label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => setFormData({...formData, publisher: e.target.value})}
                    placeholder="Nhập nhà xuất bản..."
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Năm xuất bản</label>
                  <input
                    type="number"
                    value={formData.publicationYear}
                    onChange={(e) => setFormData({...formData, publicationYear: parseInt(e.target.value) || new Date().getFullYear()})}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Thể loại</label>
                  <input
                    type="text"
                    value={formData.genre}
                    onChange={(e) => setFormData({...formData, genre: e.target.value})}
                    placeholder="Nhập thể loại..."
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Số lượng có sẵn</label>
                  <input
                    type="number"
                    value={formData.availableQuantity}
                    onChange={(e) => setFormData({...formData, availableQuantity: parseInt(e.target.value) || 0})}
                    min="0"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Tổng số lượng</label>
                  <input
                    type="number"
                    value={formData.totalQuantity}
                    onChange={(e) => setFormData({...formData, totalQuantity: parseInt(e.target.value) || 0})}
                    min="0"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Vị trí</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Vd: Kệ A1, Tầng 2..."
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="form-select"
                  >
                    <option value="READY">Sẵn sàng</option>
                    <option value="BORROWED">Đã mượn</option>
                    <option value="MAINTENANCE">Bảo trì</option>
                  </select>
                </div>
                
                <div className="form-group full-width">
                  <label>URL hình ảnh</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Danh mục</label>
                  <div className="categories-selection">
                    {categories.length > 0 ? (
                      categories.map(category => (
                        <label key={category.id} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.categoryIds.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  categoryIds: [...formData.categoryIds, category.id]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  categoryIds: formData.categoryIds.filter(id => id !== category.id)
                                });
                              }
                            }}
                          />
                          {category.name}
                        </label>
                      ))
                    ) : (
                      <div className="no-categories-message">
                        <span>⚠️ Chưa có danh mục nào. <a href="/admin/categories">Thêm danh mục trước</a>.</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="form-group full-width">
                  <label>Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Nhập mô tả về cuốn sách..."
                    className="form-textarea"
                    rows="3"
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModals}>
                Hủy
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSubmitEdit}
                disabled={submitting || !formData.title.trim() || !formData.author.trim() || !formData.isbn.trim()}
              >
                {submitting ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBook && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗑️ Xác nhận xóa</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="delete-confirmation">
                <div className="warning-icon">⚠️</div>
                <p>Bạn có chắc chắn muốn xóa cuốn sách này không?</p>
                <div className="book-info">
                  <strong>Tên sách:</strong> {selectedBook.title}<br/>
                  <strong>Tác giả:</strong> {selectedBook.author}<br/>
                  <strong>ISBN:</strong> {selectedBook.isbn}<br/>
                  <strong>Tổng số lượng:</strong> {selectedBook.totalQuantity}
                </div>
                <p className="warning-text">
                  ⚠️ Hành động này không thể hoàn tác!
                </p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModals}>
                Hủy
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleSubmitDelete}
                disabled={submitting}
              >
                {submitting ? 'Đang xóa...' : 'Xóa sách'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lend Book Modal */}
      {showLendModal && selectedBook && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>📚 Cho mượn sách</h3>
              <button className="modal-close" onClick={() => setShowLendModal(false)}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="book-info-section">
                <h4>Thông tin sách</h4>
                <div className="book-details">
                  <p><strong>Tên sách:</strong> {selectedBook.title}</p>
                  <p><strong>Tác giả:</strong> {selectedBook.author}</p>
                  <p><strong>ISBN:</strong> {selectedBook.isbn}</p>
                  <p><strong>Số lượng có sẵn:</strong> {selectedBook.availableQuantity}</p>
                </div>
              </div>

              <div className="user-selection-section">
                <h4>Chọn người dùng</h4>
                <div className="user-search">
                  <label>Email người dùng:</label>
                  <input
                    type="email"
                    placeholder="Nhập email để tìm kiếm..."
                    value={lendingData.userEmail}
                    onChange={(e) => {
                      setLendingData(prev => ({
                        ...prev,
                        userEmail: e.target.value,
                        userId: ''
                      }));
                      searchUsers(e.target.value);
                    }}
                    className="form-input"
                  />
                  
                  {searchingUsers && (
                    <div className="search-loading">🔍 Đang tìm kiếm...</div>
                  )}
                  
                  {userSearchResults.length > 0 && (
                    <div className="user-search-results">
                      {userSearchResults.map((user) => (
                        <div
                          key={user.id}
                          className="user-result-item"
                          onClick={() => handleSelectUser(user)}
                        >
                          <div className="user-info">
                            <strong>{user.email}</strong>
                            <span className="user-name">{user.firstName} {user.lastName}</span>
                          </div>
                          <button className="select-user-btn">Chọn</button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {lendingData.userId && (
                    <div className="selected-user">
                      ✅ Đã chọn: {lendingData.userEmail}
                    </div>
                  )}
                </div>
              </div>

              <div className="due-date-section">
                <h4>Ngày trả dự kiến</h4>
                <label>Chọn ngày trả:</label>
                <input
                  type="date"
                  value={lendingData.dueDate}
                  onChange={(e) => setLendingData(prev => ({
                    ...prev,
                    dueDate: e.target.value
                  }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="form-input"
                />
              </div>

              <div className="lending-terms">
                <h4>Điều khoản cho mượn</h4>
                <ul>
                  <li>📖 Người mượn có trách nhiệm giữ gìn sách trong tình trạng tốt</li>
                  <li>📅 Phải trả sách đúng hạn để tránh phí phạt</li>
                  <li>🔄 Có thể gia hạn 1 lần nếu không có người đặt trước</li>
                  <li>💰 Phí phạt quá hạn: 5,000đ/ngày</li>
                </ul>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowLendModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSubmitLending}
                disabled={lending || !lendingData.userId || !lendingData.dueDate}
              >
                {lending ? '⏳ Đang cho mượn...' : '✅ Cho mượn sách'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookManagement;
