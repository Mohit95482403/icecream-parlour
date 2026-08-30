import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminOrderApi from '../../services/admin/adminOrderApi';
import toast from 'react-hot-toast';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [payment, setPayment] = useState('all');
  const [giftType, setGiftType] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchOrders();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, status, payment, giftType, sort, page]);

  const fetchSummary = async () => {
    try {
      const res = await adminOrderApi.getOrderSummary();
      setSummary(res.data);
    } catch (err) {
      console.error('Error fetching summary', err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await adminOrderApi.getOrders({ search, status, payment, gift_type: giftType, sort, page, limit: 10 });
      setOrders(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };
  
  const getStatusBadgeColor = (st) => {
    switch (st) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-indigo-100 text-indigo-800';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentBadgeColor = (st) => {
    switch(st) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">Manage customer orders, payment status and fulfilment.</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{summary.total_orders}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{summary.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Revenue</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(summary.revenue)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Out for Delivery</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{summary.out_for_delivery}</p>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input 
            type="text" 
            placeholder="Search orders, customers..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
          />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg outline-none">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="ready">Ready</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={payment} onChange={e => setPayment(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg outline-none">
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select value={giftType} onChange={e => setGiftType(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg outline-none font-medium">
          <option value="all">All Types</option>
          <option value="regular">Regular Orders</option>
          <option value="gift">🎁 Gift Orders</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg outline-none">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest_amount">Highest Amount</option>
          <option value="lowest_amount">Lowest Amount</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">
                    No orders match your filters. 
                    <button onClick={() => { setSearch(''); setStatus('all'); setPayment('all'); }} className="ml-2 text-pink-600 hover:underline">Clear Filters</button>
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">
                      <div>#{order.order_number}</div>
                      {order.is_gift_order === 1 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          🎁 Gift
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      <div>{order.customer_name}</div>
                      <div className="text-xs text-gray-400">{order.guest_email}</div>
                      {order.is_gift_order === 1 && order.gift_recipient_name && (
                        <div className="text-xs text-amber-700 font-medium mt-0.5">
                          To: {order.gift_recipient_name}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-600">{order.total_items || 0} items</td>
                    <td className="p-4 font-medium text-gray-900">{formatCurrency(order.total_amount)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentBadgeColor(order.payment_status)}`}>
                        {order.payment_status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.order_status)}`}>
                        {order.order_status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <Link to={`/admin/orders/${order.id}`} className="text-pink-600 hover:text-pink-900 font-medium text-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button 
                disabled={page === totalPages} 
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
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

export default AdminOrdersPage;
