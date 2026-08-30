import React, { useState, useEffect, useCallback } from 'react';
import { Star, Search, Eye, Check, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import adminReviewsApi from '../../services/admin/adminReviewsApi';
import toast from 'react-hot-toast';

const AdminReviewsPage = () => {
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'all', rating: '', search: '' });
  const [selectedReview, setSelectedReview] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await adminReviewsApi.getSummary();
      setSummary(res.data.data);
    } catch { /* silent */ }
  }, []);

  const fetchReviews = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminReviewsApi.getReviews({
        status: filters.status, rating: filters.rating, search: filters.search, page, limit: 20
      });
      setReviews(res.data.data.reviews);
      setPagination(res.data.data.pagination);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchReviews(1); }, [fetchReviews]);

  const handleViewDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await adminReviewsApi.getReviewDetail(id);
      setSelectedReview(res.data.data);
    } catch {
      toast.error('Failed to load review detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await adminReviewsApi.approveReview(id);
      toast.success('Review approved');
      fetchReviews(pagination.page);
      fetchSummary();
      if (selectedReview?.id === id) setSelectedReview(prev => ({ ...prev, status: 'approved' }));
    } catch {
      toast.error('Failed to approve review');
    }
  };

  const handleReject = async () => {
    if (!showRejectModal) return;
    try {
      await adminReviewsApi.rejectReview(showRejectModal, rejectNote || null);
      toast.success('Review rejected');
      setShowRejectModal(null);
      setRejectNote('');
      fetchReviews(pagination.page);
      fetchSummary();
      if (selectedReview?.id === showRejectModal) setSelectedReview(prev => ({ ...prev, status: 'rejected' }));
    } catch {
      toast.error('Failed to reject review');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      await adminReviewsApi.deleteReview(id);
      toast.success('Review deleted');
      fetchReviews(pagination.page);
      fetchSummary();
      if (selectedReview?.id === id) setSelectedReview(null);
    } catch {
      toast.error('Failed to delete review');
    }
  };

  const renderStars = (rating) => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={14} className={i <= rating ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-gray-300'} />
      ))}
    </div>
  );

  const statusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      approved: 'bg-green-50 text-green-700 border-green-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 border rounded ${styles[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
        {status?.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: summary.total, color: 'text-gray-900' },
            { label: 'Pending', value: summary.pending, color: 'text-amber-600' },
            { label: 'Approved', value: summary.approved, color: 'text-green-600' },
            { label: 'Rejected', value: summary.rejected, color: 'text-red-600' },
            { label: 'Avg Rating', value: summary.averageRating, color: 'text-amber-500' },
          ].map(card => (
            <div key={card.label} className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-lg border border-gray-200">
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={filters.rating}
          onChange={e => setFilters(f => ({ ...f, rating: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Ratings</option>
          {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Star{r!==1?'s':''}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer, product, order..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No reviews found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Review</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.map(review => (
                  <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{review.first_name} {review.last_name}</p>
                      <p className="text-xs text-gray-500">{review.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[150px] truncate">{review.product_name}</td>
                    <td className="px-4 py-3">{renderStars(review.rating)}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{review.comment}</td>
                    <td className="px-4 py-3">{statusBadge(review.status)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleViewDetail(review.id)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="View">
                          <Eye size={16} />
                        </button>
                        {review.status !== 'approved' && (
                          <button onClick={() => handleApprove(review.id)} className="p-1.5 text-gray-400 hover:text-green-600 transition-colors" title="Approve">
                            <Check size={16} />
                          </button>
                        )}
                        {review.status !== 'rejected' && (
                          <button onClick={() => { setShowRejectModal(review.id); setRejectNote(''); }} className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors" title="Reject">
                            <X size={16} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(review.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} reviews)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchReviews(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => fetchReviews(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedReview(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Review Details</h3>
              <button onClick={() => setSelectedReview(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {detailLoading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-0.5">Customer</p>
                    <p className="font-medium">{selectedReview.first_name} {selectedReview.last_name}</p>
                    <p className="text-xs text-gray-400">{selectedReview.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Product</p>
                    <p className="font-medium">{selectedReview.product_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Order</p>
                    <p className="font-medium">#{selectedReview.order_number}</p>
                    <p className="text-xs text-gray-400">{selectedReview.order_status?.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Rating</p>
                    {renderStars(selectedReview.rating)}
                  </div>
                </div>

                <div>
                  <p className="text-gray-500 text-sm mb-1">Status</p>
                  {statusBadge(selectedReview.status)}
                </div>

                {selectedReview.title && (
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Title</p>
                    <p className="font-medium">{selectedReview.title}</p>
                  </div>
                )}

                <div>
                  <p className="text-gray-500 text-sm mb-1">Review</p>
                  <p className="text-gray-700 leading-relaxed">{selectedReview.comment}</p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm mb-0.5">Verified Purchase</p>
                  <p className="text-green-600 font-medium text-sm">✓ Yes</p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm mb-0.5">Submitted</p>
                  <p className="text-sm">{new Date(selectedReview.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  {selectedReview.status !== 'approved' && (
                    <button onClick={() => handleApprove(selectedReview.id)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium">
                      Approve
                    </button>
                  )}
                  {selectedReview.status !== 'rejected' && (
                    <button onClick={() => { setShowRejectModal(selectedReview.id); setRejectNote(''); }} className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm font-medium">
                      Reject
                    </button>
                  )}
                  <button onClick={() => handleDelete(selectedReview.id)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium ml-auto">
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowRejectModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Reject Review</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note (optional)</label>
                <textarea
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  placeholder="Reason for rejection..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowRejectModal(null)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium">
                  Cancel
                </button>
                <button onClick={handleReject} className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm font-medium">
                  Reject Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPage;
