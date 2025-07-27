import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../utils/auth';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const userEmail = auth.getUserEmail();
  
  // State for top borrowed books
  const [topBorrowedBooks, setTopBorrowedBooks] = useState([]);
  const [topBooksLoading, setTopBooksLoading] = useState(true);
  const [topBooksError, setTopBooksError] = useState('');

  // Fetch top borrowed books
  useEffect(() => {
    const fetchTopBorrowedBooks = async () => {
      try {
        const token = auth.getAccessToken();
        if (!token) {
          setTopBooksError('No authentication token found');
          return;
        }

        const response = await fetch('/api/books/top-borrowed?limit=5', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
          setTopBorrowedBooks(data.data || []);
        } else {
          setTopBooksError(data.message || 'Failed to fetch top borrowed books');
        }
      } catch (error) {
        console.error('Error fetching top borrowed books:', error);
        setTopBooksError('Network error. Please check your connection.');
      } finally {
        setTopBooksLoading(false);
      }
    };

    fetchTopBorrowedBooks();
  }, []);

  const quickStats = [
    { label: 'Books Borrowed', value: '3', icon: '📖', color: '#4a90e2' },
    { label: 'Books Available', value: '1,247', icon: '📚', color: '#28a745' },
    { label: 'Overdue Books', value: '0', icon: '⏰', color: '#dc3545' },
    { label: 'Favorite Books', value: '12', icon: '❤️', color: '#ffc107' }
  ];

  const recentActivity = [
    { action: 'Borrowed', book: 'JavaScript: The Good Parts', date: '2025-01-25', status: 'active' },
    { action: 'Returned', book: 'Clean Code', date: '2025-01-23', status: 'completed' },
    { action: 'Reserved', book: 'React Patterns', date: '2025-01-22', status: 'pending' }
  ];

  const recommendedBooks = [
    { title: 'You Don\'t Know JS', author: 'Kyle Simpson', category: 'Programming' },
    { title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', category: 'Programming' },
    { title: 'The Pragmatic Programmer', author: 'Dave Thomas', category: 'Software Development' }
  ];

  return (
    <div className="home-dashboard">
      {/* Welcome Section */}
      <section className="welcome-section">
        <div className="welcome-content">
          <h1>Welcome back! 👋</h1>
          <p>Hello <strong>{userEmail}</strong>, here's what's happening in your library today.</p>
        </div>
        <div className="quick-actions">
          <button 
            className="action-btn primary"
            onClick={() => navigate('/books')}
          >
            📚 Browse Books
          </button>
          <button className="action-btn secondary">🔍 Search</button>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="stats-section">
        <h2>Quick Overview</h2>
        <div className="stats-grid">
          {quickStats.map((stat, index) => (
            <div key={index} className="stat-card" style={{ borderLeftColor: stat.color }}>
              <div className="stat-icon" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="activity-section">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          {recentActivity.map((activity, index) => (
            <div key={index} className={`activity-item ${activity.status}`}>
              <div className="activity-icon">
                {activity.action === 'Borrowed' && '📖'}
                {activity.action === 'Returned' && '✅'}
                {activity.action === 'Reserved' && '🔖'}
              </div>
              <div className="activity-content">
                <div className="activity-text">
                  <strong>{activity.action}</strong> "{activity.book}"
                </div>
                <div className="activity-date">{activity.date}</div>
              </div>
              <div className={`activity-status ${activity.status}`}>
                {activity.status === 'active' && '🟢'}
                {activity.status === 'completed' && '✅'}
                {activity.status === 'pending' && '🟡'}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Borrowed Books */}
      <section className="top-borrowed-section">
        <h2>📈 Most Popular Books</h2>
        <p className="section-subtitle">Discover what everyone is reading</p>
        
        {topBooksLoading ? (
          <div className="loading-books">
            <div className="loading-spinner">Loading popular books...</div>
          </div>
        ) : topBooksError ? (
          <div className="error-books">
            <div className="error-message">{topBooksError}</div>
          </div>
        ) : topBorrowedBooks.length > 0 ? (
          <div className="books-grid">
            {topBorrowedBooks.map((book, index) => (
              <div key={book.id} className="book-card popular">
                <div className="book-rank">#{index + 1}</div>
                <div className="book-cover">📖</div>
                <div className="book-info">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">by {book.author}</p>
                  <div className="book-stats">
                    <span className="book-genre">📚 {book.genre}</span>
                    <span className="borrow-count">👥 {book.borrowCount || 0} borrows</span>
                  </div>
                  <span className={`availability ${book.availableQuantity > 0 ? 'available' : 'unavailable'}`}>
                    {book.availableQuantity > 0 ? `✓ Available (${book.availableQuantity})` : '✗ Not Available'}
                  </span>
                </div>
                <button 
                  className="book-action"
                  onClick={() => navigate(`/book/${book.id}`)}
                >
                  {book.availableQuantity > 0 ? '📚 Borrow Now' : '👀 View Details'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-popular-books">
            <div className="placeholder-icon">📈</div>
            <h3>No popular books data available</h3>
            <p>Check back later for trending books!</p>
          </div>
        )}
      </section>

      {/* Recommended Books */}
      <section className="recommendations-section">
        <h2>Recommended for You</h2>
        <div className="books-grid">
          {recommendedBooks.map((book, index) => (
            <div key={index} className="book-card">
              <div className="book-cover">📖</div>
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">by {book.author}</p>
                <span className="book-category">{book.category}</span>
              </div>
              <button className="book-action">View Details</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
