import React, { useState, useEffect } from 'react';
import { X, Clock, ArrowRight, ArrowDown, ArrowUp } from 'lucide-react';
import adminInventoryApi from '../../../services/admin/adminInventoryApi';

const InventoryHistoryModal = ({ isOpen, onClose, item }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && item) {
      fetchHistory();
    }
  }, [isOpen, item]);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      // Just fetch the latest 20 for this modal
      const res = await adminInventoryApi.getHistory(item.variant_id, { limit: 20 });
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (err) {
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-champagne">
          <div>
            <h2 className="text-xl font-bold text-espresso">Inventory History</h2>
            <p className="text-sm text-warm-taupe mt-1">{item.product_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-sand rounded-full transition-colors text-warm-taupe">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-espresso"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-champagne mx-auto mb-3" />
              <p className="text-warm-taupe">No inventory history found for this product.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {history.map((record) => (
                <div key={record.id} className="flex gap-4 p-4 rounded-xl border border-champagne hover:bg-sand/30 transition-colors">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    record.quantity > 0 ? 'bg-green-100 text-green-600' :
                    record.quantity < 0 ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {record.quantity > 0 ? <ArrowUp className="w-5 h-5" /> :
                     record.quantity < 0 ? <ArrowDown className="w-5 h-5" /> :
                     <ArrowRight className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-espresso capitalize">
                          {record.type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-warm-taupe mt-1">{record.note}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${
                          record.quantity > 0 ? 'text-green-600' :
                          record.quantity < 0 ? 'text-red-600' :
                          'text-espresso'
                        }`}>
                          {record.quantity > 0 ? '+' : ''}{record.quantity}
                        </p>
                        <p className="text-xs text-warm-taupe mt-1">
                          {new Date(record.created_at).toLocaleString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    {record.reference_type && (
                      <div className="mt-3 text-xs bg-white px-3 py-1.5 rounded border border-champagne inline-block text-warm-taupe">
                        <span className="capitalize">{record.reference_type}</span>: {record.reference_id}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryHistoryModal;
