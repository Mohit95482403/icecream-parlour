import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import adminProductsApi from '../../services/admin/adminProductsApi';
import adminCategoriesApi from '../../services/admin/adminCategoriesApi';
import OptimizedImage from '../../components/OptimizedImage';

const AdminProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Filters
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'all',
    stock: 'all',
    sort: 'newest'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories for filter dropdown if not loaded
      if (categories.length === 0) {
        const catRes = await adminCategoriesApi.getCategories();
        if (catRes.data.success) {
          setCategories(catRes.data.data.filter(c => c.status === 'active'));
        }
      }

      // Fetch products
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      const prodRes = await adminProductsApi.getProducts(params);
      
      if (prodRes.data.success) {
        setProducts(prodRes.data.data.products);
        setPagination(prodRes.data.data.pagination);
      } else {
        setError(prodRes.data.message || 'Failed to fetch products');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.page, filters.category, filters.status, filters.stock, filters.sort]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination({ ...pagination, page: 1 });
      } else {
        fetchData();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleToggleStatus = async (product) => {
    try {
      const newStatus = product.status === 'active' ? 'inactive' : 'active';
      await adminProductsApi.updateProductStatus(product.id, newStatus);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-espresso"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-espresso">Products</h1>
          <p className="text-warm-taupe mt-1">Manage your ice cream catalog ({pagination.total} total)</p>
        </div>
        <button
          onClick={() => navigate('/admin/products/new')}
          className="bg-espresso text-white px-4 py-2 rounded-lg font-medium hover:bg-espresso/90 flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Product
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-champagne flex flex-col lg:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative flex-grow w-full lg:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-warm-taupe" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-champagne rounded-lg focus:ring-espresso focus:border-espresso text-sm"
            placeholder="Search products, sku..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <select 
            className="border border-champagne rounded-lg px-3 py-2 text-sm focus:ring-espresso focus:border-espresso"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select 
            className="border border-champagne rounded-lg px-3 py-2 text-sm focus:ring-espresso focus:border-espresso"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select 
            className="border border-champagne rounded-lg px-3 py-2 text-sm focus:ring-espresso focus:border-espresso"
            value={filters.stock}
            onChange={(e) => handleFilterChange('stock', e.target.value)}
          >
            <option value="all">All Stock</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock (≤10)</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <select 
            className="border border-champagne rounded-lg px-3 py-2 text-sm focus:ring-espresso focus:border-espresso bg-sand/20"
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="price_desc">Price (High-Low)</option>
            <option value="price_asc">Price (Low-High)</option>
            <option value="stock_asc">Stock (Low-High)</option>
            <option value="stock_desc">Stock (High-Low)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-champagne overflow-hidden flex-grow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-sand/30 border-b border-champagne text-sm font-medium text-warm-taupe">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm relative">
              {loading && products.length > 0 && (
                <tr className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                  <td>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-espresso"></div>
                  </td>
                </tr>
              )}
              {products.length === 0 && !loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-warm-taupe">
                    <p className="mb-4">No products found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b border-champagne/50 hover:bg-sand/10">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-sand rounded-md overflow-hidden">
                          {product.image_url ? (
                            <OptimizedImage src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <OptimizedImage src={null} alt="No image" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-espresso">{product.name}</div>
                          <div className="text-xs text-warm-taupe">SKU: {product.sku || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-warm-taupe">
                      {product.category_name || '-'}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      £{parseFloat(product.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.stock > 10 
                          ? 'bg-green-100 text-green-800' 
                          : product.stock > 0 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stock || 0} in stock
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/admin/products/${product.id}`)}
                        className="text-espresso hover:text-matcha transition-colors p-1"
                        title="Edit Product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(product)}
                        className={`p-1 transition-colors ${
                          product.status === 'active' ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'
                        }`}
                        title={product.status === 'active' ? 'Deactivate Product' : 'Activate Product'}
                      >
                        {product.status === 'active' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-champagne flex items-center justify-between">
            <div className="text-sm text-warm-taupe">
              Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> products
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-champagne rounded-md disabled:opacity-50 text-sm font-medium hover:bg-sand/50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-champagne rounded-md disabled:opacity-50 text-sm font-medium hover:bg-sand/50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductsPage;
