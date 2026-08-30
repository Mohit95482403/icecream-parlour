import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import adminProductsApi from '../../services/admin/adminProductsApi';
import adminCategoriesApi from '../../services/admin/adminCategoriesApi';
import OptimizedImage from '../../components/OptimizedImage';

const AdminProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    compare_at_price: '',
    sku: '',
    stock: '',
    status: 'active',
    images: []
  });

  const [imageInput, setImageInput] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const catRes = await adminCategoriesApi.getCategories();
        if (catRes.data.success) {
          setCategories(catRes.data.data.filter(c => c.status === 'active'));
        }

        if (isEditMode) {
          const prodRes = await adminProductsApi.getProductById(id);
          if (prodRes.data.success) {
            const product = prodRes.data.data;
            const variant = product.variant || {};
            setFormData({
              name: product.name || '',
              description: product.description || '',
              category_id: product.category_id || '',
              price: variant.price ? parseFloat(variant.price).toString() : '',
              compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price).toString() : '',
              sku: variant.sku || '',
              stock: variant.stock_quantity ? variant.stock_quantity.toString() : '0',
              status: product.status || 'active',
              images: (product.images || []).map(img => img.image_url)
            });
          }
        }
      } catch (err) {
        setError('Error loading initial data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddImage = () => {
    if (imageInput.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageInput.trim()]
      }));
      setImageInput('');
    }
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    if (!formData.name.trim()) return setError('Product name is required');
    if (!formData.category_id) return setError('Category is required');
    if (!formData.price || isNaN(parseFloat(formData.price))) return setError('Valid price is required');
    if (!formData.stock || isNaN(parseInt(formData.stock, 10))) return setError('Valid stock quantity is required');

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        stock: parseInt(formData.stock, 10)
      };

      if (isEditMode) {
        await adminProductsApi.updateProduct(id, payload);
      } else {
        await adminProductsApi.createProduct(payload);
      }
      
      navigate('/admin/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving product');
      setSubmitting(false);
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <button 
          onClick={() => navigate('/admin/products')}
          className="p-2 bg-sand rounded-full text-espresso hover:bg-sand/70 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-espresso">
            {isEditMode ? 'Edit Product' : 'Create New Product'}
          </h1>
          <p className="text-warm-taupe mt-1">Fill in the details for your product</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Basic Details */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-champagne space-y-4">
              <h2 className="text-lg font-bold text-espresso border-b border-champagne pb-2">Basic Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none"
                  placeholder="e.g. Madagascan Vanilla"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-espresso mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none"
                  rows="4"
                  placeholder="Describe your ice cream..."
                ></textarea>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-champagne space-y-4">
              <h2 className="text-lg font-bold text-espresso border-b border-champagne pb-2">Images</h2>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  className="flex-grow px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none"
                  placeholder="Enter image URL"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImage();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="bg-sand text-espresso px-4 py-2 rounded-lg font-medium hover:bg-sand/70 transition-colors whitespace-nowrap"
                >
                  Add Image
                </button>
              </div>

              {formData.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-champagne aspect-square">
                      <OptimizedImage src={img} alt={`Product preview ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-white rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-champagne rounded-xl p-8 flex flex-col items-center justify-center text-warm-taupe mt-4 bg-sand/10">
                  <Upload className="w-8 h-8 mb-2 text-champagne" />
                  <p>Add image URLs to show product previews.</p>
                </div>
              )}
            </div>
            
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            
            {/* Organization */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-champagne space-y-4">
              <h2 className="text-lg font-bold text-espresso border-b border-champagne pb-2">Organization</h2>
              
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-espresso mb-1">Category *</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none"
                  required
                >
                  <option value="" disabled>Select a category...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-champagne space-y-4">
              <h2 className="text-lg font-bold text-espresso border-b border-champagne pb-2">Pricing</h2>
              
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">Price (£) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-espresso mb-1">Compare at price (£)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="compare_at_price"
                  value={formData.compare_at_price}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none"
                  placeholder="0.00"
                />
                <p className="text-xs text-warm-taupe mt-1">To show a discounted price, enter the original higher price here.</p>
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-champagne space-y-4">
              <h2 className="text-lg font-bold text-espresso border-b border-champagne pb-2">Inventory</h2>
              
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none"
                  placeholder="e.g. VAN-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-espresso mb-1">Stock Quantity *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none"
                  placeholder="0"
                  required
                />
              </div>
            </div>

          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end space-x-4 border-t border-champagne pt-6">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-6 py-3 rounded-lg text-warm-taupe font-medium hover:text-espresso transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-espresso text-white px-8 py-3 rounded-lg font-medium hover:bg-espresso/90 disabled:opacity-70 transition-colors"
          >
            {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
