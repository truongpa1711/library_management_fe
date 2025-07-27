import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../utils/auth';
import './AllBooks.css';

const AllBooks = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Borrowing state
  const [borrowingBooks, setBorrowingBooks] = useState(new Set());
  
  // Search and filter state
  const [filters, setFilters] = useState({
    title: '',
    author: '',
    genre: '',
    publisher: '',
    publicationYear: ''
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  });

  // Sorting state
  const [sorting, setSorting] = useState({
    orderBy: 'title',
    direction: 'asc'
  });

  // Initialize with all books on component mount
  useEffect(() => {
    const initialFetch = async () => {
      setLoading(true);
      setError('');

      try {
        const token = auth.getAccessToken();
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        // Build query parameters for initial load
        const params = new URLSearchParams();
        params.append('page', '0');
        params.append('size', '10');
        params.append('orderBy', 'title');
        params.append('direction', 'asc');

        const response = await fetch(`/api/books?${params.toString()}`, {
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
          setError(data.message || 'Failed to fetch books');
          setBooks([]);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
        setError('Network error. Please check your connection.');
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    initialFetch();
  }, []);

  // Fetch books with filters and pagination
  const fetchBooks = async (newFilters = filters, newPagination = pagination, newSorting = sorting) => {
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
      const params = new URLSearchParams();
      
      // Add filters (only if they have values)
      if (newFilters.title) params.append('title', newFilters.title);
      if (newFilters.author) params.append('author', newFilters.author);
      if (newFilters.genre) params.append('genre', newFilters.genre);
      if (newFilters.publisher) params.append('publisher', newFilters.publisher);
      if (newFilters.publicationYear) params.append('publicationYear', newFilters.publicationYear);
      
      // Add pagination
      params.append('page', newPagination.page.toString());
      params.append('size', newPagination.size.toString());
      
      // Add sorting
      params.append('orderBy', newSorting.orderBy);
      params.append('direction', newSorting.direction);

      const response = await fetch(`/api/books?${params.toString()}`, {
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
        setError(data.message || 'Failed to fetch books');
        setBooks([]);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      setError('Network error. Please check your connection.');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
  };

  // Handle search submit
  const handleSearch = () => {
    const newPagination = { ...pagination, page: 0 }; // Reset to first page
    setPagination(newPagination);
    fetchBooks(filters, newPagination, sorting);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    const clearedFilters = {
      title: '',
      author: '',
      genre: '',
      publisher: '',
      publicationYear: ''
    };
    setFilters(clearedFilters);
    const newPagination = { ...pagination, page: 0 };
    setPagination(newPagination);
    fetchBooks(clearedFilters, newPagination, sorting);
  };

  // Handle page size change
  const handlePageSizeChange = (newSize) => {
    const newPagination = { ...pagination, size: newSize, page: 0 };
    setPagination(newPagination);
    fetchBooks(filters, newPagination, sorting);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    const newPagination = { ...pagination, page: newPage };
    setPagination(newPagination);
    fetchBooks(filters, newPagination, sorting);
  };

  // Handle sorting change
  const handleSortingChange = (field) => {
    const newDirection = sorting.orderBy === field && sorting.direction === 'asc' ? 'desc' : 'asc';
    const newSorting = { orderBy: field, direction: newDirection };
    setSorting(newSorting);
    fetchBooks(filters, pagination, newSorting);
  };

  // Handle book click
  const handleBookClick = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  // Handle borrow book
  const handleBorrowBook = async (book, event) => {
    // Prevent navigation to book details
    event.stopPropagation();
    
    if (!book || book.availableQuantity <= 0) {
      alert('This book is not available for borrowing.');
      return;
    }

    setBorrowingBooks(prev => new Set(prev).add(book.id));
    
    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      // Calculate due date (14 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      const dueDateString = dueDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD

      const response = await fetch('/api/book-loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookIds: [book.id],
          dueDate: dueDateString
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert(`Successfully borrowed "${book.title}"!\nDue date: ${dueDateString}`);
        
        // Refresh books list to update availability
        fetchBooks(filters, pagination, sorting);
      } else {
        alert(data.message || 'Failed to borrow book. Please try again.');
      }
    } catch (error) {
      console.error('Error borrowing book:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setBorrowingBooks(prev => {
        const newSet = new Set(prev);
        newSet.delete(book.id);
        return newSet;
      });
    }
  };

  return (
    <div className="all-books">
      {/* Header */}
      <div className="all-books-header">
        <h1>All Books</h1>
        <p>Search and browse all books in our library</p>
      </div>

      {/* Search and Filter Section */}
      <section className="search-filter-section">
        <div className="search-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Title</label>
              <input
                type="text"
                placeholder="Search by title..."
                value={filters.title}
                onChange={(e) => handleFilterChange('title', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="filter-group">
              <label>Author</label>
              <input
                type="text"
                placeholder="Search by author..."
                value={filters.author}
                onChange={(e) => handleFilterChange('author', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="filter-group">
              <label>Genre</label>
              <input
                type="text"
                placeholder="Search by genre..."
                value={filters.genre}
                onChange={(e) => handleFilterChange('genre', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          
          <div className="filter-row">
            <div className="filter-group">
              <label>Publisher</label>
              <input
                type="text"
                placeholder="Search by publisher..."
                value={filters.publisher}
                onChange={(e) => handleFilterChange('publisher', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="filter-group">
              <label>Publication Year</label>
              <input
                type="number"
                placeholder="e.g., 2020"
                value={filters.publicationYear}
                onChange={(e) => handleFilterChange('publicationYear', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="filter-actions">
              <button className="btn-primary" onClick={handleSearch}>
                🔍 Search
              </button>
              <button className="btn-outline" onClick={handleClearFilters}>
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>

        {/* Sorting and Page Size Controls */}
        <div className="controls-row">
          <div className="sorting-controls">
            <label>Sort by:</label>
            <select 
              value={sorting.orderBy}
              onChange={(e) => handleSortingChange(e.target.value)}
            >
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="publicationYear">Year</option>
              <option value="genre">Genre</option>
              <option value="borrowCount">Popularity</option>
            </select>
            <button 
              className={`sort-direction ${sorting.direction}`}
              onClick={() => handleSortingChange(sorting.orderBy)}
              title={`Sort ${sorting.direction === 'asc' ? 'descending' : 'ascending'}`}
            >
              {sorting.direction === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          <div className="page-size-control">
            <label>Books per page:</label>
            <select 
              value={pagination.size}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="results-section">
        {loading ? (
          <div className="loading-spinner">Searching books...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            {/* Results Summary */}
            <div className="results-summary">
              <h3>
                {pagination.totalElements > 0 
                  ? `Found ${pagination.totalElements} book${pagination.totalElements > 1 ? 's' : ''}`
                  : 'No books found'
                }
              </h3>
              {pagination.totalElements > 0 && (
                <p>
                  Showing {pagination.page * pagination.size + 1} - {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} of {pagination.totalElements}
                </p>
              )}
            </div>

            {/* Books Grid */}
            {books.length > 0 ? (
              <>
                <div className="books-grid">
                  {books.map((book) => (
                    <div key={book.id} className="book-card">
                      <div className="book-cover">📖</div>
                      <div className="book-info">
                        <h3 className="book-title">{book.title}</h3>
                        <p className="book-author">by {book.author}</p>
                        <div className="book-details">
                          <span className="book-genre">📚 {book.genre}</span>
                          <span className="book-year">📅 {book.publicationYear}</span>
                          <span className="book-publisher">🏢 {book.publisher}</span>
                        </div>
                        <div className="book-stats">
                          <span className={`availability ${book.availableQuantity > 0 ? 'available' : 'unavailable'}`}>
                            {book.availableQuantity > 0 ? `✓ Available (${book.availableQuantity})` : '✗ Not Available'}
                          </span>
                          <span className="borrow-count">👥 {book.borrowCount || 0} borrows</span>
                        </div>
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
                            {borrowingBooks.has(book.id) ? '⏳ Borrowing...' : '� Borrow'}
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
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      ← Previous
                    </button>
                    
                    <div className="pagination-pages">
                      {/* First page */}
                      {pagination.page > 2 && (
                        <>
                          <button 
                            className="pagination-page"
                            onClick={() => handlePageChange(0)}
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
                          onClick={() => handlePageChange(pagination.page - 1)}
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
                          onClick={() => handlePageChange(pagination.page + 1)}
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
                            onClick={() => handlePageChange(pagination.totalPages - 1)}
                          >
                            {pagination.totalPages}
                          </button>
                        </>
                      )}
                    </div>
                    
                    <button 
                      className="pagination-btn"
                      disabled={pagination.page >= pagination.totalPages - 1}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>No books found</h3>
                <p>Try adjusting your search criteria or clear filters to see all books.</p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default AllBooks;
