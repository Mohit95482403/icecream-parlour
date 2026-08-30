import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import adminOrderApi from '../../services/admin/adminOrderApi';
import adminApi from '../../utils/adminApi';
import toast from 'react-hot-toast';
import DeliveryAddress from '../../components/common/DeliveryAddress';

const AdminOrderDetailsPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelNote, setCancelNote] = useState('');
  const [autoRefundOnCancel, setAutoRefundOnCancel] = useState(true);

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('Order cancelled by admin');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const res = await adminOrderApi.getOrderById(id);
      setOrder(res.data);
    } catch (error) {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus, note = '', processRefund = false) => {
    setUpdating(true);
    try {
      await adminOrderApi.updateOrderStatus(id, newStatus, note, processRefund);
      toast.success('Order status updated');
      await fetchOrderDetails();
      if (newStatus === 'cancelled') setShowCancelConfirm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleProcessRefund = async () => {
    setIsProcessingRefund(true);
    try {
      const res = await adminOrderApi.processRefund(id, refundReason);
      if (res.data?.success) {
        toast.success('Refund processed successfully');
        setShowRefundModal(false);
        await fetchOrderDetails();
      } else {
        toast.error(res.data?.message || 'Failed to process refund');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process refund');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await adminOrderApi.getEligibleDeliveryPersonnel();
      setAgents(res.data);
    } catch (error) {
      toast.error('Failed to load delivery agents');
    }
  };

  const handleAssignAgent = async () => {
    if (!selectedAgent) return toast.error('Please select an agent');
    setUpdating(true);
    try {
      await adminOrderApi.assignDelivery(id, selectedAgent);
      toast.success('Delivery agent assigned successfully');
      setShowAssignModal(false);
      fetchOrderDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign agent');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (showAssignModal && agents.length === 0) fetchAgents();
  }, [showAssignModal]);

  const handleDownloadInvoice = async () => {
    setIsDownloading(true);
    try {
      const res = await adminApi.get(`/orders/number/${order.order_number}/invoice`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = res.headers['content-disposition'];
      let fileName = `GLACE-Invoice-${order.order_number}.pdf`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download invoice');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  };

  const getStatusBadgeColor = (st) => {
    switch (st) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'ready': return 'bg-indigo-100 text-indigo-800';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentBadgeColor = (st) => {
    switch (st) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading order details...</div>;
  }

  if (!order) {
    return <div className="p-8 text-center text-gray-500">Order not found.</div>;
  }

  const { items = [], history = [], payment, refund } = order;

  const isPaid = order.payment_status === 'paid' || (payment && payment.status === 'paid');
  const isRefunded = order.payment_status === 'refunded' || (payment && payment.status === 'refunded') || (refund && refund.status === 'REFUNDED');
  const isCancelled = order.order_status === 'cancelled';
  const canRefund = isCancelled && isPaid && !isRefunded;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link to="/admin/orders" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.order_number}</h1>
            {order.is_gift_order === 1 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                🎁 GIFT ORDER
              </span>
            )}
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(order.order_status)}`}>
              {order.order_status.toUpperCase()}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentBadgeColor(order.payment_status)}`}>
              {order.payment_status.toUpperCase()}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 ml-8">Placed on {new Date(order.created_at).toLocaleString('en-IN')}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Download Invoice */}
          <button 
            onClick={handleDownloadInvoice}
            disabled={isDownloading}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition-colors disabled:bg-gray-400"
          >
            {isDownloading ? 'Downloading...' : 'Download Invoice'}
          </button>

          {/* Refund Button for Cancelled Paid Orders */}
          {canRefund && (
            <button
              onClick={() => setShowRefundModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
            >
              Process Refund
            </button>
          )}

          {/* Refunded indicator */}
          {isRefunded && (
            <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg">
              ✓ Refunded
            </span>
          )}

          {/* Cancel Order button */}
          {!isCancelled && order.order_status !== 'delivered' && (
            <button 
              onClick={() => setShowCancelConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (Left) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Order Items</h2>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[480px]">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-medium text-gray-500 uppercase">
                    <th className="pb-3">Product</th>
                    <th className="pb-3 text-right">Price</th>
                    <th className="pb-3 text-right">Qty</th>
                    <th className="pb-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="py-3">
                        <div className="font-medium text-gray-900">{item.product_name}</div>
                        <div className="text-sm text-gray-500">{item.variant_name} (SKU: {item.sku})</div>
                      </td>
                      <td className="py-3 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                      <td className="py-3 text-right text-gray-600">× {item.quantity}</td>
                      <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(item.line_total != null ? item.line_total : item.total_price != null ? item.total_price : (item.unit_price * item.quantity))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment & Refund Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900">Payment & Settlement</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentBadgeColor(order.payment_status)}`}>
                {order.payment_status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block text-xs">Payment Method</span>
                <span className="font-medium text-gray-900 capitalize">{payment?.payment_method || 'Online Payment'}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Amount Paid</span>
                <span className="font-medium text-gray-900">{formatCurrency(order.total_amount)}</span>
              </div>
              {payment?.transaction_reference && (
                <div className="md:col-span-2">
                  <span className="text-gray-500 block text-xs">Transaction Reference</span>
                  <span className="font-mono text-xs text-gray-900 bg-gray-50 p-1.5 rounded border border-gray-100 block mt-0.5">
                    {payment.transaction_reference}
                  </span>
                </div>
              )}
              {payment?.paid_at && (
                <div>
                  <span className="text-gray-500 block text-xs">Paid On</span>
                  <span className="text-gray-900">{new Date(payment.paid_at).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500 block text-xs">Refund Status</span>
                <span className={`font-medium ${isRefunded ? 'text-purple-700' : 'text-gray-700'}`}>
                  {isRefunded ? 'REFUNDED' : (isCancelled && isPaid ? 'Refund Pending / Eligible' : 'Not Refunded')}
                </span>
              </div>
            </div>

            {/* Refund Information Banner if Refunded */}
            {isRefunded && (
              <div className="mt-4 p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-purple-900 font-semibold text-sm">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Refund Details (Simulated Internal Settlement)</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-purple-950">
                  <div>
                    <span className="text-purple-700 text-xs block">Refund Reference</span>
                    <span className="font-mono font-semibold text-xs">{refund?.refund_reference || payment?.refund_reference}</span>
                  </div>
                  <div>
                    <span className="text-purple-700 text-xs block">Refund Amount</span>
                    <span className="font-bold text-purple-900">{formatCurrency(refund?.amount || payment?.refund_amount || order.total_amount)}</span>
                  </div>
                  <div>
                    <span className="text-purple-700 text-xs block">Refund Date</span>
                    <span>{new Date(refund?.processed_at || payment?.refunded_at || order.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div>
                    <span className="text-purple-700 text-xs block">Reason</span>
                    <span className="italic">{refund?.reason || payment?.refund_reason || 'Order cancelled'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Callout if Cancelled & Paid but not refunded */}
            {canRefund && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">Order is Cancelled and Paid</h4>
                  <p className="text-xs text-amber-700 mt-0.5">Click to process the simulated refund of {formatCurrency(order.total_amount)}.</p>
                </div>
                <button
                  onClick={() => setShowRefundModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors shadow-sm shrink-0"
                >
                  Process Refund Now
                </button>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-3">Pricing Breakdown</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>{formatCurrency(order.delivery_fee)}</span>
              </div>
              {parseFloat(order.discount_amount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between font-bold text-lg text-gray-900">
                <span>Grand Total</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar (Right) */}
        <div className="space-y-6">
          
          {/* Status Update Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-3">Order Status</h2>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-4">Advance the order to the next stage.</p>
              
              {order.order_status === 'pending' && (
                <button disabled={updating} onClick={() => handleStatusUpdate('confirmed', 'Admin confirmed order')} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {updating ? 'Updating...' : 'Confirm Order'}
                </button>
              )}
              {order.order_status === 'confirmed' && order.delivery_method === 'delivery' && !order.delivery_status && (
                <button disabled={updating} onClick={() => setShowAssignModal(true)} className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  Assign Delivery Agent
                </button>
              )}
              {((order.order_status === 'confirmed' && order.delivery_method === 'pickup') || 
                (order.order_status === 'confirmed' && order.delivery_status === 'assigned')) && (
                <button disabled={updating} onClick={() => handleStatusUpdate('preparing', 'Order is preparing')} className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
                  {updating ? 'Updating...' : 'Start Preparing'}
                </button>
              )}
              {order.order_status === 'preparing' && (
                <button disabled={updating} onClick={() => handleStatusUpdate('ready', 'Order is ready')} className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {updating ? 'Updating...' : 'Mark as Ready'}
                </button>
              )}
              {order.order_status === 'ready' && order.delivery_method === 'delivery' && (
                <button disabled={updating} onClick={() => handleStatusUpdate('out_for_delivery', 'Order is out for delivery')} className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors">
                  {updating ? 'Updating...' : 'Mark Out for Delivery'}
                </button>
              )}
              {(order.order_status === 'ready' && order.delivery_method === 'pickup') || order.order_status === 'out_for_delivery' ? (
                <button disabled={updating} onClick={() => handleStatusUpdate('delivered', 'Order was delivered')} className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {updating ? 'Updating...' : 'Mark as Delivered'}
                </button>
              ) : null}
              {order.order_status === 'delivered' && (
                <p className="text-sm text-green-600 font-medium">This order is fully delivered.</p>
              )}
              {order.order_status === 'cancelled' && (
                <div className="space-y-2">
                  <p className="text-sm text-red-600 font-medium">This order has been cancelled.</p>
                  {isRefunded && <p className="text-xs text-purple-700 font-medium">Payment has been refunded.</p>}
                </div>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-3">Purchaser (Customer)</h2>
            <div className="text-sm space-y-2">
              <p className="font-medium text-gray-900">
                {order.guest_first_name} {order.guest_last_name}
              </p>
              <p className="text-gray-600">{order.guest_email || order.account_email}</p>
              <p className="text-gray-600">{order.guest_phone || order.account_phone}</p>
            </div>
          </div>

          {/* Gift Order Details (If Gift) */}
          {order.is_gift_order === 1 && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
                <span className="text-lg">🎁</span>
                <h2 className="text-base font-bold text-amber-950">Gift Recipient Details</h2>
              </div>
              <div className="text-sm space-y-2 text-amber-950">
                <div>
                  <span className="text-xs text-amber-800 font-semibold block">Recipient Name</span>
                  <p className="font-semibold text-gray-900">{order.gift_recipient_name}</p>
                </div>
                <div>
                  <span className="text-xs text-amber-800 font-semibold block">Recipient Phone</span>
                  <p className="font-mono text-gray-800">{order.gift_recipient_phone}</p>
                </div>
                <div>
                  <span className="text-xs text-amber-800 font-semibold block">Delivery Address</span>
                  <p className="text-gray-800">{order.gift_recipient_address}</p>
                  <p className="text-gray-700">{order.gift_recipient_city}, {order.gift_recipient_state} - {order.gift_recipient_postal_code}</p>
                </div>
                {order.gift_message && (
                  <div className="pt-2 border-t border-amber-200/60">
                    <span className="text-xs text-amber-800 font-semibold block mb-1">Gift Message</span>
                    <div className="p-2.5 bg-white border border-amber-200 rounded italic text-gray-800 text-xs">
                      "{order.gift_message}"
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delivery Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-3">Delivery Details</h2>
            <div className="text-sm space-y-3">
              <div>
                <span className="text-gray-500 block mb-1">Method</span>
                <span className="font-medium text-gray-900 capitalize">{order.delivery_method}</span>
              </div>
              {order.delivery_method === 'delivery' && (
                <>
                  <div>
                    <span className="text-gray-500 block mb-1">Delivery Address</span>
                    <DeliveryAddress address={order.delivery_address_snapshot} />
                  </div>
                  {order.delivery_status && (
                    <div>
                      <span className="text-gray-500 block mb-1">Delivery Status</span>
                      <span className="font-medium text-gray-900 capitalize">{order.delivery_status.replace('_', ' ')}</span>
                    </div>
                  )}
                  {order.delivery_first_name && (
                    <div>
                      <span className="text-gray-500 block mb-1">Assigned To</span>
                      <span className="font-medium text-gray-900">{order.delivery_first_name} {order.delivery_last_name}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-3">Timeline</h2>
            <div className="space-y-4">
              {history.map((evt) => (
                <div key={evt.id} className="relative pl-4 border-l-2 border-gray-200">
                  <div className="absolute w-3 h-3 bg-pink-500 rounded-full -left-[7px] top-1.5 border-2 border-white"></div>
                  <p className="text-sm font-medium text-gray-900 capitalize">{evt.new_status.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-500">{new Date(evt.created_at).toLocaleString('en-IN')}</p>
                  {evt.note && <p className="text-xs text-gray-600 mt-1 italic">{evt.note}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">By {evt.changed_by_name}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Cancel Order #{order.order_number}</h3>
              <button onClick={() => setShowCancelConfirm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <p className="text-sm text-gray-600 leading-relaxed">
              Cancelling this order will restore reserved inventory stock and cancel any active deliveries.
            </p>

            {isPaid && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                <p className="text-xs font-semibold text-purple-900">Payment Status: PAID ({formatCurrency(order.total_amount)})</p>
                <label className="flex items-center gap-2 text-xs text-purple-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefundOnCancel}
                    onChange={e => setAutoRefundOnCancel(e.target.checked)}
                    className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Process simulated refund of {formatCurrency(order.total_amount)} immediately</span>
                </label>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reason for cancellation</label>
              <textarea 
                value={cancelNote}
                onChange={e => setCancelNote(e.target.value)}
                placeholder="e.g., Customer requested via phone, out of stock, etc."
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="3"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowCancelConfirm(false)} 
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Keep Order
              </button>
              <button 
                onClick={() => handleStatusUpdate('cancelled', cancelNote || 'Cancelled by admin', isPaid && autoRefundOnCancel)} 
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50" 
                disabled={updating}
              >
                {updating ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Refund Confirmation Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Refund Order #{order.order_number}</h3>
              <button onClick={() => !isProcessingRefund && setShowRefundModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-xl text-sm border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Order:</span>
                <span className="font-semibold text-gray-900">#{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount to Refund:</span>
                <span className="font-bold text-purple-700 text-base">{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Status:</span>
                <span className="font-medium text-green-700">PAID</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Settlement Mode:</span>
                <span className="text-gray-700">Internal Simulated Refund</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Refund Reason</label>
              <input
                type="text"
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Reason for refund"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRefundModal(false)}
                disabled={isProcessingRefund}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessRefund}
                disabled={isProcessingRefund}
                className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessingRefund ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Refund...</span>
                  </>
                ) : (
                  'Process Refund'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Agent Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Select Delivery Agent</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">Choose an active agent to assign to this delivery.</p>
              {agents.length === 0 ? (
                <p className="text-sm text-red-500 font-medium">No active delivery agents available.</p>
              ) : (
                <select 
                  value={selectedAgent} 
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full rounded-lg border-gray-300 focus:ring-black focus:border-black p-2 border"
                >
                  <option value="">-- Select Agent --</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.first_name} ({agent.email})</option>
                  ))}
                </select>
              )}
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAssignModal(false)} className="flex-1 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleAssignAgent} 
                  disabled={updating || !selectedAgent} 
                  className="flex-1 py-2 text-white bg-black rounded-lg hover:bg-gray-900 font-medium disabled:opacity-50 transition-colors"
                >
                  {updating ? 'Assigning...' : 'Assign Agent'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrderDetailsPage;
