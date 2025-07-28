import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '../../utils/auth';
import './CategoryManagement.css';

const CategoryManagement = () => {
  // State for categories
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalElements, setTotalElements] = useState(0);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const token = auth.getAccessToken();
      if (!token) {
        setError('Authentication token not found');
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
        const categoriesData = data.data || [];
        setCategories(categoriesData);
        setFilteredCategories(categoriesData);
        setTotalElements(categoriesData.length);
      } else {
        setError(data.message || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filter categories based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.tags?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      tags: ''
    });
  };

  const handleAddCategory = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      tags: category.tags || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteCategory = (category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };


  const handleSubmitAdd = async () => {
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }

    setSubmitting(true);

    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          tags: formData.tags.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert('Thêm danh mục thành công!');
        setShowAddModal(false);
        resetForm();
        fetchCategories(); // Refresh list
      } else {
        alert(data.message || 'Thêm danh mục thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }

    setSubmitting(true);

    try {
      const token = auth.getAccessToken();
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          tags: formData.tags.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert('Cập nhật danh mục thành công!');
        setShowEditModal(false);
        resetForm();
        setSelectedCategory(null);
        fetchCategories(); // Refresh list
      } else {
        alert(data.message || 'Cập nhật danh mục thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error updating category:', error);
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

      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        alert('Xóa danh mục thành công!');
        setShowDeleteModal(false);
        setSelectedCategory(null);
        fetchCategories(); // Refresh list
      } else {
        const data = await response.json();
        alert(data.message || 'Xóa danh mục thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setSubmitting(false);
    }
  };



  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedCategory(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="category-management">
        <div className="loading-container">
          <div className="loading-spinner">Đang tải danh mục...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="category-management">
      {/* Header */}
      <div className="category-header">
        <div className="header-left">
          <h2>🏷️ Quản lý Danh mục</h2>
          <p>Quản lý các danh mục sách trong thư viện</p>
        </div>
        <div className="header-right">
          <button className="btn btn-primary" onClick={handleAddCategory}>
            ➕ Thêm danh mục
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="category-filters">
        <div className="search-section">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm danh mục theo tên, mô tả hoặc tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="filter-info">
          <span className="total-count">
            Tổng cộng: {totalElements} danh mục
          </span>
        </div>
      </div>

      {/* Categories Table */}
      {error ? (
        <div className="error-container">
          <div className="error-message">
            <span className="error-icon">❌</span>
            {error}
          </div>
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="categories-content">
          <div className="categories-table">
            <table>
              <thead>
                <tr>
                  <th style={{textAlign:'center'}}>ID</th>
                  <th style={{textAlign:'center'}}>Tên danh mục</th>
                  <th style={{textAlign:'center'}}>Mô tả</th>
                  <th style={{textAlign:'center'}}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id}>
                    <td>#{category.id}</td>
                    <td>
                      <div className="category-name">
                        <span className="name">{category.name}</span>
                        {category.tags && (
                          <div className="category-tags-inline">
                            <span className="tag">{category.tags}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="category-description">
                        {category.description || 'Không có mô tả'}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-edit"
                          onClick={() => handleEditCategory(category)}
                          title="Chỉnh sửa"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-delete"
                          onClick={() => handleDeleteCategory(category)}
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
        </div>
      ) : (
        <div className="no-categories">
          <div className="no-categories-icon">🏷️</div>
          <h3>Không tìm thấy danh mục nào</h3>
          <p>
            {searchTerm ? 
              'Không có danh mục nào phù hợp với từ khóa tìm kiếm.' :
              'Chưa có danh mục nào trong hệ thống.'
            }
          </p>
          {!searchTerm && (
            <button className="btn btn-primary" onClick={handleAddCategory}>
              ➕ Thêm danh mục đầu tiên
            </button>
          )}
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Thêm danh mục mới</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Tên danh mục *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nhập tên danh mục..."
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Nhập mô tả danh mục..."
                  className="form-textarea"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder="Nhập tags..."
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModals}>
                Hủy
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSubmitAdd}
                disabled={submitting || !formData.name.trim()}
              >
                {submitting ? 'Đang thêm...' : 'Thêm danh mục'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Chỉnh sửa danh mục</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Tên danh mục *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nhập tên danh mục..."
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Nhập mô tả danh mục..."
                  className="form-textarea"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder="Nhập tags..."
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModals}>
                Hủy
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSubmitEdit}
                disabled={submitting || !formData.name.trim()}
              >
                {submitting ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCategory && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗑️ Xác nhận xóa</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="delete-confirmation">
                <div className="warning-icon">⚠️</div>
                <p>Bạn có chắc chắn muốn xóa danh mục này không?</p>
                <div className="category-info">
                  <strong>Tên:</strong> {selectedCategory.name}<br/>
                  <strong>Mô tả:</strong> {selectedCategory.description || 'Không có mô tả'}<br/>
                  <strong>Tags:</strong> {selectedCategory.tags || 'Không có tags'}
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
                {submitting ? 'Đang xóa...' : 'Xóa danh mục'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CategoryManagement;
