import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '../../utils/adminApi';

const PAYMENT_METHOD_NAMES = {
  'upi': 'UPI',
  'demo_upi': 'UPI',
  'card': 'Credit / Debit Card',
  'demo_card': 'Credit / Debit Card',
  'netbanking': 'Net Banking',
  'demo_netbanking': 'Net Banking',
  'wallet': 'Digital Wallet',
  'demo_wallet': 'Digital Wallet'
};

const STATUS_COLORS = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-600 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  refunded: 'bg-purple-50 text-purple-700 border-purple-200',
  partially_refunded: 'bg-purple-50 text-purple-600 border-purple-200'
};

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await adminApi.get(`/payments?${params}`);
      setPayments(res.data.data || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPayments();
  };

  const viewDetails = async (paymentId) => {
    setDetailLoading(true);
    try {
      const res = await adminApi.get(`/payments/${paymentId}`);
      setSelectedPayment(res.data);
    } catch (err) {
      console.error('Failed to fetch payment details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-espresso">Payments</h1>
          <p className="text-sm text-warm-taupe mt-1">{total} total payment records</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-warm-taupe/20 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <input
              type="text"
              placeholder="Search by order #, transaction ref, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field w-full"
            />
          </form>
          <div className="flex gap-2 overflow-x-auto">
            {['all', 'pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded'].map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-colors border ${
                  statusFilter === s
                    ? 'bg-espresso text-ivory border-espresso'
                    : 'bg-white text-espresso/70 border-warm-taupe/30 hover:border-espresso/50'
                }`}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-warm-taupe/20 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-espresso border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-warm-taupe text-sm">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-warm-taupe">No payments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-cream/50 border-b border-warm-taupe/20">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-espresso/70 text-xs uppercase tracking-wider">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-espresso/70 text-xs uppercase tracking-wider">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-espresso/70 text-xs uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-espresso/70 text-xs uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-espresso/70 text-xs uppercase tracking-wider">Method</th>
                  <th className="text-left px-4 py-3 font-medium text-espresso/70 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-espresso/70 text-xs uppercase tracking-wider">Transaction</th>
                  <th className="text-left px-4 py-3 font-medium text-espresso/70 text-xs uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-espresso/70 text-xs uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-taupe/10">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-cream/30 transition-colors">
                    <td className="px-4 py-3 text-espresso font-medium">#{p.id}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-espresso">{p.order_number}</span>
                    </td>
                    <td className="px-4 py-3 text-espresso">{p.customer_name || '—'}</td>
                    <td className="px-4 py-3 font-medium text-espresso">₹{parseFloat(p.amount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-espresso/70">{PAYMENT_METHOD_NAMES[p.payment_method] || p.payment_method || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[p.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-warm-taupe">{p.transaction_reference || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-warm-taupe text-xs">
                      {new Date(p.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => viewDetails(p.id)}
                        className="text-xs font-medium text-espresso/60 hover:text-espresso transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-warm-taupe/10">
            <p className="text-xs text-warm-taupe">
              Page {page} of {totalPages} ({total} records)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium border border-warm-taupe/30 rounded-md disabled:opacity-40 hover:bg-cream transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-medium border border-warm-taupe/30 rounded-md disabled:opacity-40 hover:bg-cream transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-espresso/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPayment(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-warm-taupe/20">
              <h2 className="text-lg font-display font-bold text-espresso">
                Payment #{selectedPayment.id}
              </h2>
              <button onClick={() => setSelectedPayment(null)} className="text-warm-taupe hover:text-espresso transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {detailLoading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-espresso border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Payment info grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-warm-taupe text-xs mb-1">Order</p>
                    <p className="font-medium text-espresso">{selectedPayment.order_number}</p>
                  </div>
                  <div>
                    <p className="text-warm-taupe text-xs mb-1">Customer</p>
                    <p className="font-medium text-espresso">{selectedPayment.customer_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-warm-taupe text-xs mb-1">Amount</p>
                    <p className="font-medium text-espresso">₹{parseFloat(selectedPayment.amount).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-warm-taupe text-xs mb-1">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[selectedPayment.status] || ''}`}>
                      {selectedPayment.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-warm-taupe text-xs mb-1">Method</p>
                    <p className="text-espresso">{PAYMENT_METHOD_NAMES[selectedPayment.payment_method] || selectedPayment.payment_method || '—'}</p>
                  </div>
                  <div>
                    <p className="text-warm-taupe text-xs mb-1">Gateway</p>
                    <p className="text-espresso">{selectedPayment.gateway}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-warm-taupe text-xs mb-1">Transaction Reference</p>
                    <p className="font-mono text-xs text-espresso">{selectedPayment.transaction_reference || '—'}</p>
                  </div>
                  {selectedPayment.paid_at && (
                    <div>
                      <p className="text-warm-taupe text-xs mb-1">Paid At</p>
                      <p className="text-espresso text-xs">{new Date(selectedPayment.paid_at).toLocaleString('en-IN')}</p>
                    </div>
                  )}
                  {selectedPayment.failure_reason && (
                    <div className="col-span-2">
                      <p className="text-warm-taupe text-xs mb-1">Failure Reason</p>
                      <p className="text-red-600 text-xs">{selectedPayment.failure_reason}</p>
                    </div>
                  )}
                  {selectedPayment.refund_reference && (
                    <>
                      <div>
                        <p className="text-warm-taupe text-xs mb-1">Refund Reference</p>
                        <p className="font-mono text-xs text-espresso">{selectedPayment.refund_reference}</p>
                      </div>
                      <div>
                        <p className="text-warm-taupe text-xs mb-1">Refund Amount</p>
                        <p className="text-espresso">₹{parseFloat(selectedPayment.refund_amount).toFixed(2)}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Events Timeline */}
                {selectedPayment.events && selectedPayment.events.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-espresso mb-3 uppercase tracking-wider">Audit Trail</h3>
                    <div className="space-y-3">
                      {selectedPayment.events.map((evt, i) => (
                        <div key={evt.id || i} className="flex gap-3 text-xs">
                          <div className="shrink-0 w-2 h-2 rounded-full bg-espresso/40 mt-1.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-espresso">{evt.event_type}</span>
                              <span className="text-warm-taupe">{new Date(evt.created_at).toLocaleString('en-IN')}</span>
                            </div>
                            {evt.description && <p className="text-warm-taupe mt-0.5">{evt.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsPage;
