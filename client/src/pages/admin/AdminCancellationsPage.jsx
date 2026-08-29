import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminOrderApi from '../../services/admin/adminOrderApi';
import toast from 'react-hot-toast';

const AdminCancellationsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Modal States
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await adminOrderApi.getCancellationRequests({ status: filter });
      setRequests(res.data?.data || []);
    } catch (error) {
      toast.error('Failed to load cancellation requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const openApproveModal = (req) => {
    setSelectedRequest(req);
    setApproveModalOpen(true);
  };

  const openRejectModal = (req) => {
    setSelectedRequest(req);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      const targetId = selectedRequest.order_id || selectedRequest.id;
      const res = await adminOrderApi.approveCancellation(targetId);
      toast.success(res.data?.message || 'Cancellation approved successfully');
      setApproveModalOpen(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve cancellation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!rejectReason.trim()) {
      return toast.error('Please provide a reason for rejecting the request');
    }

    setActionLoading(true);
    try {
      const targetId = selectedRequest.order_id || selectedRequest.id;
      const res = await adminOrderApi.rejectCancellation(targetId, rejectReason.trim());
      toast.success(res.data?.message || 'Cancellation request rejected');
      setRejectModalOpen(false);
      setSelectedRequest(null);
      setRejectReason('');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject cancellation');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cancellation Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage customer order cancellation requests.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Filter Status:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-1.5 focus:ring-black focus:border-black outline-none"
          >
            <option value="all">All Requests</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <button
          onClick={fetchRequests}
          className="text-xs text-gray-600 hover:text-black font-medium border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
        >
          Refresh List
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading cancellation requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No cancellation requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Order #</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Amount & Payment</th>
                  <th className="p-4">Reason & Notes</th>
                  <th className="p-4">Date Requested</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="p-4">
                      <Link to={`/admin/orders/${req.order_id}`} className="font-semibold text-blue-600 hover:underline">
                        #{req.order_number}
                      </Link>
                    </td>
                    <td className="p-4 text-sm text-gray-900">
                      <div className="font-medium">{req.customer_name}</div>
                      {req.customer_email && <div className="text-xs text-gray-500">{req.customer_email}</div>}
                    </td>
                    <td className="p-4 text-sm">
                      <div className="font-medium text-gray-900">₹{parseFloat(req.total_amount || 0).toFixed(2)}</div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                        req.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        req.payment_status === 'refunded' ? 'bg-purple-100 text-purple-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {req.payment_status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-700 max-w-xs">
                      <div className="font-medium text-gray-900">{req.reason}</div>
                      {req.customer_message && (
                        <div className="text-xs text-gray-500 italic mt-0.5 truncate" title={req.customer_message}>
                          "{req.customer_message}"
                        </div>
                      )}
                      {req.admin_reason && (
                        <div className="text-xs text-red-600 mt-1">
                          Admin note: {req.admin_reason}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(req.requested_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider
                        ${req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 
                          req.status === 'APPROVED' ? 'bg-green-100 text-green-800 border border-green-200' : 
                          req.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                          'bg-red-100 text-red-800 border border-red-200'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openApproveModal(req)}
                            className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-300 rounded-lg font-medium text-xs transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(req)}
                            className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-300 rounded-lg font-medium text-xs transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium italic">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve Confirmation Modal */}
      {approveModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Approve Cancellation Request</h3>
              <button 
                onClick={() => { setApproveModalOpen(false); setSelectedRequest(null); }}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p>Are you sure you want to approve the cancellation request for order <span className="font-semibold text-gray-900">#{selectedRequest.order_number}</span>?</p>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs space-y-1">
                <div><span className="font-medium text-gray-700">Customer:</span> {selectedRequest.customer_name}</div>
                <div><span className="font-medium text-gray-700">Reason:</span> {selectedRequest.reason}</div>
                <div><span className="font-medium text-gray-700">Payment Status:</span> {selectedRequest.payment_status?.toUpperCase()}</div>
              </div>
              <ul className="text-xs text-gray-500 list-disc list-inside space-y-0.5 pt-1">
                <li>The order status will transition to <span className="font-semibold text-gray-700">CANCELLED</span>.</li>
                <li>Reserved inventory stock will be restored to inventory.</li>
                {selectedRequest.payment_status === 'paid' && (
                  <li className="text-emerald-700 font-medium">A full simulated refund of ₹{parseFloat(selectedRequest.total_amount).toFixed(2)} will be initiated automatically.</li>
                )}
                <li>The customer will be notified immediately.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setApproveModalOpen(false); setSelectedRequest(null); }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>{actionLoading ? 'Approving...' : 'Confirm & Approve'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Reject Cancellation Request</h3>
              <button 
                onClick={() => { setRejectModalOpen(false); setSelectedRequest(null); }}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p>Reject cancellation request for order <span className="font-semibold text-gray-900">#{selectedRequest.order_number}</span>.</p>
              <div className="text-xs text-gray-500">
                The order will remain in its current active status. No inventory will be restored and no refund will be issued.
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g., Ice cream preparation has already commenced / dispatched."
                  rows={3}
                  className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setRejectModalOpen(false); setSelectedRequest(null); }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>{actionLoading ? 'Rejecting...' : 'Reject Request'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCancellationsPage;
