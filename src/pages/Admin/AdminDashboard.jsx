import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '../../utils/auth';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import './AdminDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AdminDashboard = () => {
  const userEmail = auth.getUserEmail();
  
  // State for statistics
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const token = auth.getAccessToken();
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const response = await fetch('/api/books/statistics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setStatistics(data.data);
      } else {
        setError(data.message || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Default stats if API fails
  const defaultStats = [
    { label: 'Total Books', value: '0', icon: '📚', color: '#4a90e2', change: '+0' },
    { label: 'Active Users', value: '0', icon: '👥', color: '#28a745', change: '+0' },
    { label: 'Books Borrowed', value: '0', icon: '📖', color: '#ffc107', change: '-0' },
    { label: 'Available Books', value: '0', icon: '✅', color: '#17a2b8', change: '+0' }
  ];

  // Create stats from API data
  const getStatsFromAPI = () => {
    if (!statistics) return defaultStats;
    
    return [
      { 
        label: 'Total Books', 
        value: statistics.totalBooks?.toString() || '0', 
        icon: '📚', 
        color: '#4a90e2', 
        change: '+0' 
      },
      { 
        label: 'Total Borrowed', 
        value: statistics.totalBorrowed?.toString() || '0', 
        icon: '📖', 
        color: '#ffc107', 
        change: '+0' 
      },
      { 
        label: 'Top Authors', 
        value: statistics.topAuthors?.length?.toString() || '0', 
        icon: '👤', 
        color: '#28a745', 
        change: '+0' 
      },
      { 
        label: 'Top Genres', 
        value: statistics.topGenres?.length?.toString() || '0', 
        icon: '🏷️', 
        color: '#17a2b8', 
        change: '+0' 
      }
    ];
  };

  const adminStats = getStatsFromAPI();

  // Chart data generators
  const getTopAuthorsChartData = () => {
    if (!statistics?.topAuthors || statistics.topAuthors.length === 0) {
      return {
        labels: ['Chưa có dữ liệu'],
        datasets: [{
          label: 'Số sách',
          data: [0],
          backgroundColor: ['#e9ecef'],
          borderColor: ['#dee2e6'],
          borderWidth: 1
        }]
      };
    }

    const top5Authors = statistics.topAuthors.slice(0, 5);
    return {
      labels: top5Authors.map(author => author.name),
      datasets: [{
        label: 'Số sách',
        data: top5Authors.map(author => author.count),
        backgroundColor: [
          '#4a90e2',
          '#28a745',
          '#ffc107',
          '#17a2b8',
          '#6f42c1'
        ],
        borderColor: [
          '#357abd',
          '#1e7e34',
          '#e0a800',
          '#138496',
          '#5a32a3'
        ],
        borderWidth: 1
      }]
    };
  };

  const getTopGenresChartData = () => {
    if (!statistics?.topGenres || statistics.topGenres.length === 0) {
      return {
        labels: ['Chưa có dữ liệu'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e9ecef'],
          borderColor: ['#dee2e6'],
          borderWidth: 1
        }]
      };
    }

    const top5Genres = statistics.topGenres.slice(0, 5);
    return {
      labels: top5Genres.map(genre => genre.name),
      datasets: [{
        data: top5Genres.map(genre => genre.count),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ],
        borderColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ],
        borderWidth: 2
      }]
    };
  };

  const getBookStatsChartData = () => {
    if (!statistics) {
      return {
        labels: ['Tổng sách', 'Đã mượn', 'Có sẵn'],
        datasets: [{
          label: 'Số lượng',
          data: [0, 0, 0],
          backgroundColor: ['#4a90e2', '#ffc107', '#28a745'],
          borderColor: ['#357abd', '#e0a800', '#1e7e34'],
          borderWidth: 1
        }]
      };
    }

    const available = (statistics.totalBooks || 0) - (statistics.totalBorrowed || 0);
    return {
      labels: ['Tổng sách', 'Đã mượn', 'Có sẵn'],
      datasets: [{
        label: 'Số lượng',
        data: [
          statistics.totalBooks || 0,
          statistics.totalBorrowed || 0,
          available > 0 ? available : 0
        ],
        backgroundColor: ['#4a90e2', '#ffc107', '#28a745'],
        borderColor: ['#357abd', '#e0a800', '#1e7e34'],
        borderWidth: 1
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const recentActivities = [
    { user: 'john.doe@email.com', action: 'borrowed', book: 'JavaScript Guide', time: '2 hours ago' },
    { user: 'jane.smith@email.com', action: 'returned', book: 'Clean Code', time: '3 hours ago' },
    { user: 'admin', action: 'added', book: 'React Patterns', time: '5 hours ago' },
    { user: 'mike.jones@email.com', action: 'reserved', book: 'Node.js Design', time: '6 hours ago' }
  ];

  const systemAlerts = [
    { type: 'warning', message: '7 books are overdue and need attention', time: '1 hour ago' },
    { type: 'info', message: 'Database backup completed successfully', time: '2 hours ago' },
    { type: 'success', message: '12 new books added to the library', time: '4 hours ago' }
  ];

  return (
    <div className="admin-dashboard">
      {/* Welcome Section */}
      <section className="admin-welcome">
        <div className="welcome-content">
          <h1>Admin Dashboard 🔧</h1>
          <p>Welcome back, <strong>{userEmail}</strong>. Here's your library overview.</p>
        </div>
        <div className="admin-actions">
          <button className="action-btn primary">📝 Quick Add Book</button>
          <button className="action-btn secondary">📊 Generate Report</button>
        </div>
      </section>

      {/* Admin Stats */}
      <section className="admin-stats">
        <h2>System Overview</h2>
        <div className="stats-grid">
          {adminStats.map((stat, index) => (
            <div key={index} className="admin-stat-card" style={{ borderLeftColor: stat.color }}>
              <div className="stat-header">
                <div className="stat-icon" style={{ color: stat.color }}>
                  {stat.icon}
                </div>
                <div className={`stat-change ${stat.change.startsWith('+') ? 'positive' : 'negative'}`}>
                  {stat.change}
                </div>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Loading/Error States */}
      {loading && (
        <section className="loading-section">
          <div className="loading-spinner">Đang tải thống kê...</div>
        </section>
      )}

      {error && (
        <section className="error-section">
          <div className="error-message">
            <span className="error-icon">❌</span>
            {error}
          </div>
        </section>
      )}

      {/* Book Statistics */}
      {statistics && !loading && !error && (
        <>
          {/* Top Authors and Genres */}
          <div className="statistics-grid">
            <section className="top-authors">
              <h2>📖 Top Authors</h2>
              <div className="authors-list">
                {statistics.topAuthors && statistics.topAuthors.length > 0 ? (
                  statistics.topAuthors.slice(0, 5).map((author, index) => (
                    <div key={index} className="author-item">
                      <div className="author-rank">#{index + 1}</div>
                      <div className="author-details">
                        <div className="author-name">{author.name}</div>
                        <div className="author-count">{author.count} sách</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">Chưa có dữ liệu</div>
                )}
              </div>
            </section>

            <section className="top-genres">
              <h2>🏷️ Top Genres</h2>
              <div className="genres-list">
                {statistics.topGenres && statistics.topGenres.length > 0 ? (
                  statistics.topGenres.slice(0, 5).map((genre, index) => (
                    <div key={index} className="genre-item">
                      <div className="genre-rank">#{index + 1}</div>
                      <div className="genre-details">
                        <div className="genre-name">{genre.name}</div>
                        <div className="genre-count">{genre.count} sách</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">Chưa có dữ liệu</div>
                )}
              </div>
            </section>
          </div>

          {/* Most Borrowed Books */}
          <section className="most-borrowed">
            <h2>📚 Most Borrowed Books</h2>
            <div className="borrowed-books-list">
              {statistics.mostBorrowedBooks && statistics.mostBorrowedBooks.length > 0 ? (
                statistics.mostBorrowedBooks.slice(0, 5).map((book, index) => (
                  <div key={book.id} className="borrowed-book-item">
                    <div className="book-rank">#{index + 1}</div>
                    <div className="book-info">
                      <div className="book-title">{book.title}</div>
                      <div className="book-author">by {book.author}</div>
                      <div className="book-details">
                        <span className="borrow-count">📖 {book.borrowCount} lần mượn</span>
                        <span className="book-genre">🏷️ {book.genre}</span>
                        <span className="book-status" style={{
                          color: book.status === 'READY' ? '#28a745' : 
                                book.status === 'BORROWED' ? '#ffc107' : '#dc3545'
                        }}>
                          {book.status === 'READY' ? '✅ Sẵn sàng' : 
                           book.status === 'BORROWED' ? '📖 Đã mượn' : '🔧 Bảo trì'}
                        </span>
                      </div>
                      {book.categories && book.categories.length > 0 && (
                        <div className="book-categories">
                          {book.categories.map(cat => (
                            <span key={cat.id} className="category-tag">{cat.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data">Chưa có dữ liệu sách được mượn</div>
              )}
            </div>
          </section>
        </>
      )}

      {/* Charts Section */}
      {statistics && !loading && !error && (
        <section className="charts-section">
          <h2>📊 Biểu Đồ Thống Kê</h2>
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Top 5 Tác Giả</h3>
              <div className="chart-container">
                <Bar data={getTopAuthorsChartData()} options={chartOptions} />
              </div>
            </div>

            <div className="chart-card">
              <h3>Top 5 Thể Loại</h3>
              <div className="chart-container">
                <Doughnut data={getTopGenresChartData()} options={doughnutOptions} />
              </div>
            </div>

            <div className="chart-card">
              <h3>Thống Kê Sách</h3>
              <div className="chart-container">
                <Bar data={getBookStatsChartData()} options={chartOptions} />
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="dashboard-grid">
        {/* Recent Activities */}
        <section className="recent-activities">
          <h2>Recent Activities</h2>
          <div className="activities-list">
            {recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {activity.action === 'borrowed' && '📖'}
                  {activity.action === 'returned' && '✅'}
                  {activity.action === 'added' && '➕'}
                  {activity.action === 'reserved' && '🔖'}
                </div>
                <div className="activity-details">
                  <div className="activity-text">
                    <strong>{activity.user}</strong> {activity.action} "{activity.book}"
                  </div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="view-all-btn">View All Activities</button>
        </section>

        {/* System Alerts */}
        <section className="system-alerts">
          <h2>System Alerts</h2>
          <div className="alerts-list">
            {systemAlerts.map((alert, index) => (
              <div key={index} className={`alert-item ${alert.type}`}>
                <div className="alert-icon">
                  {alert.type === 'warning' && '⚠️'}
                  {alert.type === 'info' && 'ℹ️'}
                  {alert.type === 'success' && '✅'}
                </div>
                <div className="alert-content">
                  <div className="alert-message">{alert.message}</div>
                  <div className="alert-time">{alert.time}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="view-all-btn">View All Alerts</button>
        </section>
      </div>

      {/* Quick Actions */}
      <section className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button className="quick-action-card">
            <div className="action-icon">📚</div>
            <div className="action-title">Add New Book</div>
            <div className="action-desc">Add books to the library</div>
          </button>
          <button className="quick-action-card">
            <div className="action-icon">👤</div>
            <div className="action-title">Manage Users</div>
            <div className="action-desc">View and edit user accounts</div>
          </button>
          <button className="quick-action-card">
            <div className="action-icon">📊</div>
            <div className="action-title">View Reports</div>
            <div className="action-desc">Generate system reports</div>
          </button>
          <button className="quick-action-card">
            <div className="action-icon">⚙️</div>
            <div className="action-title">System Settings</div>
            <div className="action-desc">Configure system preferences</div>
          </button>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
