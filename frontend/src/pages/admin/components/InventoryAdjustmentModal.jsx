import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import adminInventoryApi from '../../../services/admin/adminInventoryApi';

const InventoryAdjustmentModal = ({ isOpen, onClose, item, onSuccess }) => {
  if (!isOpen || !item) return null;

  const [type, setType] = useState('increase');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('Restock');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const REASONS = [
    'Restock',
    'Supplier Delivery',
    'Damaged',
    'Expired',
    'Manual Correction',
    'Stock Count',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) < 0) {
      return setError('Please enter a valid positive number');
    }

    setLoading(true);
    try {
      const payload = {
        type,
        quantity: parseInt(quantity),
        reason
      };
      
      const res = await adminInventoryApi.adjustStock(item.variant_id, payload);
      if (res.data.success) {
        onSuccess(res.data.data.new_quantity);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error adjusting stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Preview calculation
  let newQuantity = item.stock;
  if (quantity && !isNaN(parseInt(quantity))) {
    const qty = parseInt(quantity);
    if (type === 'increase') newQuantity = item.stock + qty;
    if (type === 'decrease') newQuantity = item.stock - qty;
    if (type === 'set') newQuantity = qty;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-champagne">
          <h2 className="text-xl font-bold text-espresso">Adjust Stock</h2>
          <button onClick={onClose} className="p-2 hover:bg-sand rounded-full transition-colors text-warm-taupe">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="bg-sand/30 p-4 rounded-lg border border-champagne">
            <p className="text-sm text-warm-taupe">Product</p>
            <p className="font-semibold text-espresso">{item.product_name}</p>
            <div className="flex justify-between mt-2 pt-2 border-t border-champagne/50">
              <p className="text-sm text-warm-taupe">Current Stock</p>
              <p className="font-bold text-espresso">{item.stock}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Adjustment Type</label>
              <div className="grid grid-cols-3 gap-2">
                {['increase', 'decrease', 'set'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`py-2 px-3 text-sm rounded-lg border font-medium transition-colors ${
                      type === t 
                        ? 'bg-espresso text-white border-espresso' 
                        : 'bg-white text-espresso border-champagne hover:bg-sand/50'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Quantity</label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none"
                placeholder="Enter quantity"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-champagne focus:border-espresso focus:ring-1 focus:ring-espresso outline-none"
                required
              >
                {REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="bg-espresso/5 p-4 rounded-lg flex justify-between items-center">
              <p className="text-sm font-medium text-espresso">New Quantity Preview</p>
              <p className={`font-bold text-lg ${newQuantity < 0 ? 'text-red-500' : 'text-espresso'}`}>
                {newQuantity}
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg font-medium text-warm-taupe hover:text-espresso transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || newQuantity < 0}
              className="px-5 py-2.5 rounded-lg font-medium bg-espresso text-white hover:bg-espresso/90 transition-colors disabled:opacity-70 flex items-center"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              ) : null}
              {loading ? 'Updating...' : 'Update Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryAdjustmentModal;
