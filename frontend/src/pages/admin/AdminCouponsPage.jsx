import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';
import adminCouponsApi from '../../services/admin/adminCouponsApi';

const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    minimum_order_amount: '',
    maximum_discount_amount: '',
    usage_limit: '',
    per_user_limit: '',
    starts_at: '',
    expires_at: '',
    status: 'active'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await adminCouponsApi.getCoupons();
      if (response.data.success) {
        setCoupons(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch coupons');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenModal = (coupon = null) => {
    setFormError('');
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value || '',
        minimum_order_amount: coupon.minimum_order_amount || '',
        maximum_discount_amount: coupon.maximum_discount_amount || '',
        usage_limit: coupon.usage_limit || '',
        per_user_limit: coupon.per_user_limit || '',
        starts_at: coupon.starts_at ? new Date(coupon.starts_at).toISOString().slice(0, 16) : '',
        expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : '',
        status: coupon.status
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        minimum_order_amount: '',
        maximum_discount_amount: '',
        usage_limit: '',
        per_user_limit: '',
        starts_at: '',
        expires_at: '',
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!formData.code.trim()) {
      setFormError('Coupon code is required');
      return;
    }

    if (!formData.discount_value || formData.discount_value <= 0) {
      if (formData.discount_type !== 'free_delivery') {
        setFormError('Discount value is required and must be greater than 0');
        return;
      }
    }

    const payload = { ...formData };
    // Convert empty strings to null for optional numbers/dates
    Object.keys(payload).forEach(key => {
      if (payload[key] === '') payload[key] = null;
    });

    setSubmitting(true);
    try {
      if (editingCoupon) {
        await adminCouponsApi.updateCoupon(editingCoupon.id, payload);
      } else {
        await adminCouponsApi.createCoupon(payload);
      }
      await fetchCoupons();
      handleCloseModal();
    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        if (status === 404) {
          setFormError('Coupon API endpoint not found.');
        } else if (status === 401) {
          setFormError('Your admin session has expired. Please log in again.');
        } else if (status === 403) {
          setFormError('You are not authorized to manage coupons.');
        } else if (status === 409) {
          setFormError('Coupon code already exists.');
        } else if (status === 400) {
          setFormError(data.message || 'Validation error.');
        } else if (status === 500) {
          setFormError('Unable to create coupon right now. Please try again.');
        } else {
          setFormError(data.message || 'Error saving coupon');
        }
      } else {
        setFormError('Network error or server is unreachable.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (coupon) => {
    try {
      const newStatus = coupon.status === 'active' ? 'inactive' : 'active';
      await adminCouponsApi.updateCouponStatus(coupon.id, newStatus);
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleDelete = async (coupon) => {
    if (window.confirm(`Are you sure you want to delete coupon ${coupon.code}?`)) {
      try {
        await adminCouponsApi.deleteCoupon(coupon.id);
        fetchCoupons();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting coupon');
      }
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
          <h1 className="text-2xl font-bold text-espresso">Coupons & Promotions</h1>
          <p className="text-warm-taupe mt-1">Manage discount codes and promotional offers</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-espresso text-white px-4 py-2 rounded-lg font-medium hover:bg-espresso/90 flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Coupon
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-xl shadow-sm border border-champagne overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-sand/30 border-b border-champagne text-sm font-medium text-warm-taupe">
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Discount</th>
                <th className="px-6 py-4">Usage</th>
                <th className="px-6 py-4">Validity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-warm-taupe">
                    <p className="mb-4">No coupons found.</p>
                    <button
                      onClick={() => handleOpenModal()}
                      className="text-espresso font-medium hover:underline"
                    >
                      Create your first coupon
                    </button>
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-champagne/50 hover:bg-sand/10">
                    <td className="px-6 py-4 font-bold text-espresso tracking-wide">
                      {coupon.code}
                    </td>
                    <td className="px-6 py-4 text-warm-taupe">
                      {coupon.discount_type === 'percentage' && `${parseFloat(coupon.discount_value)}% OFF`}
                      {coupon.discount_type === 'fixed' && `₹${parseFloat(coupon.discount_value)} OFF`}
                      {coupon.discount_type === 'free_delivery' && `Free Delivery`}
                      {coupon.minimum_order_amount > 0 && (
                        <div className="text-xs text-warm-taupe/70 mt-1">Min. ₹{parseFloat(coupon.minimum_order_amount)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-warm-taupe">
                      <span className="font-medium">{coupon.usage_count}</span>
                      {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ' (Unlimited)'}
                    </td>
                    <td className="px-6 py-4 text-warm-taupe text-xs">
                      {coupon.starts_at && <div>From: {new Date(coupon.starts_at).toLocaleDateString()}</div>}
                      {coupon.expires_at && <div>To: {new Date(coupon.expires_at).toLocaleDateString()}</div>}
                      {!coupon.starts_at && !coupon.expires_at && 'Forever'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        coupon.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : coupon.status === 'expired' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {coupon.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(coupon)}
                        className="text-espresso hover:text-matcha transition-colors p-1"
                        title="Edit Coupon"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(coupon)}
                        className={`p-1 transition-colors ${
                          coupon.status === 'active' ? 'text-orange-500 hover:text-orange-700' : 'text-green-500 hover:text-green-700'
                        }`}
                        title={coupon.status === 'active' ? 'Deactivate Coupon' : 'Activate Coupon'}
                      >
                        {coupon.status === 'active' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(coupon)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8">
            <div className="px-6 py-4 border-b border-champagne flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-xl">
              <h2 className="text-xl font-bold text-espresso">
                {editingCoupon ? 'Edit Coupon' : 'Add Coupon'}
              </h2>
              <button onClick={handleCloseModal} className="text-warm-taupe hover:text-espresso">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-espresso mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none transition-all uppercase"
                    placeholder="e.g. SUMMER20"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-espresso mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none transition-all"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-espresso mb-1">Discount Type *</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none transition-all"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="free_delivery">Free Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-espresso mb-1">
                    Discount Value {formData.discount_type !== 'free_delivery' && '*'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none transition-all"
                    placeholder={formData.discount_type === 'percentage' ? 'e.g. 15' : 'e.g. 200'}
                    disabled={formData.discount_type === 'free_delivery'}
                    required={formData.discount_type !== 'free_delivery'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-espresso mb-1">Min. Order Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minimum_order_amount}
                    onChange={(e) => setFormData({...formData, minimum_order_amount: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none transition-all"
                    placeholder="e.g. 500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-espresso mb-1">Max. Discount Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.maximum_discount_amount}
                    onChange={(e) => setFormData({...formData, maximum_discount_amount: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none transition-all"
                    placeholder="e.g. 300"
                    disabled={formData.discount_type !== 'percentage'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-espresso mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({...formData, usage_limit: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none transition-all"
                    placeholder="e.g. 100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-espresso mb-1">Per User Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.per_user_limit}
                    onChange={(e) => setFormData({...formData, per_user_limit: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none transition-all"
                    placeholder="e.g. 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-espresso mb-1">Starts At</label>
                  <input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({...formData, starts_at: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-espresso mb-1">Expires At</label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-champagne">
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
                  {submitting ? 'Saving...' : editingCoupon ? 'Save Changes' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCouponsPage;
