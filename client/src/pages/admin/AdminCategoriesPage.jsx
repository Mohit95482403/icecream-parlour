import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';
import adminCategoriesApi from '../../services/admin/adminCategoriesApi';

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await adminCategoriesApi.getCategories();
      if (response.data.success) {
        setCategories(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch categories');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category = null) => {
    setFormError('');
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        status: category.status
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!formData.name.trim()) {
      setFormError('Category name is required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await adminCategoriesApi.updateCategory(editingCategory.id, formData);
      } else {
        await adminCategoriesApi.createCategory(formData);
      }
      await fetchCategories();
      handleCloseModal();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (category) => {
    if (category.product_count > 0 && category.status === 'active') {
      if (!window.confirm(`This category has ${category.product_count} products. Are you sure you want to deactivate it?`)) {
        return;
      }
    }
    
    try {
      const newStatus = category.status === 'active' ? 'inactive' : 'active';
      await adminCategoriesApi.updateCategoryStatus(category.id, newStatus);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-espresso"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-espresso">Categories</h1>
          <p className="text-warm-taupe mt-1">Manage your ice cream categories</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-espresso text-white px-4 py-2 rounded-lg font-medium hover:bg-espresso/90 flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Category
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white rounded-xl shadow-sm border border-champagne overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-sand/30 border-b border-champagne text-sm font-medium text-warm-taupe">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Products</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-warm-taupe">
                    <p className="mb-4">No categories found.</p>
                    <button
                      onClick={() => handleOpenModal()}
                      className="text-espresso font-medium hover:underline"
                    >
                      Create your first category
                    </button>
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="border-b border-champagne/50 hover:bg-sand/10">
                    <td className="px-6 py-4 font-medium text-espresso">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 text-warm-taupe max-w-xs truncate">
                      {category.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sand text-espresso">
                        {category.product_count} Products
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-warm-taupe">
                      {new Date(category.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(category)}
                        className="text-espresso hover:text-matcha transition-colors p-1"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(category)}
                        className={`p-1 transition-colors ${
                          category.status === 'active' ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'
                        }`}
                        title={category.status === 'active' ? 'Deactivate Category' : 'Activate Category'}
                      >
                        {category.status === 'active' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-champagne flex justify-between items-center">
              <h2 className="text-xl font-bold text-espresso">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={handleCloseModal} className="text-warm-taupe hover:text-espresso">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-espresso mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none transition-all"
                  placeholder="e.g. Classic Flavours"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-espresso mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none transition-all"
                  rows="3"
                  placeholder="Brief description of this category"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-espresso mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none transition-all"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-warm-taupe hover:text-espresso font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-espresso text-white px-6 py-2 rounded-lg font-medium hover:bg-espresso/90 disabled:opacity-70 transition-colors"
                >
                  {submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;
