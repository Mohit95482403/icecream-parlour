import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AccountLayout from '../../layouts/AccountLayout';
import api from '../../services/api';
import orderService from '../../services/orderService';
import checkoutService from '../../services/checkoutService';
import CancelOrderModal from '../../components/orders/CancelOrderModal';
import ReviewForm from '../../components/reviews/ReviewForm';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import DeliveryAddress from '../../components/common/DeliveryAddress';

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

const OrderDetail = () => {
  const { id: orderNumber } = useParams();
  const navigate = useNavigate();
  const { addMultipleItems, openDrawer } = useCart();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelMode, setCancelMode] = useState('cancel');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isBuyingAgain, setIsBuyingAgain] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewedItems, setReviewedItems] = useState({});
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);

  // Inline Payment State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentModalError, setPaymentModalError] = useState(null);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderNumber}`);
      setOrder(response.data?.order);
    } catch (err) {
      setError(err.message || 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orderNumber) fetchOrder();
  }, [orderNumber]);

  const handleCancelOrder = async (reason) => {
    setIsCancelling(true);
    try {
      if (cancelMode === 'cancel') {
        await orderService.cancelOrder(orderNumber, reason);
        await fetchOrder();
      } else {
        await orderService.requestCancellation(orderNumber, reason);
        await fetchOrder();
      }
      setIsCancelModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to process cancellation');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleInlinePayment = async () => {
    setIsPaying(true);
    setPaymentModalError(null);
    try {
      await checkoutService.retryPayment(orderNumber, selectedMethod);
      const res = await checkoutService.processPayment({
        orderNumber,
        paymentMethod: selectedMethod
      });

      if (res.success && res.data?.status === 'paid') {
        setIsPayModalOpen(false);
        await fetchOrder();
      } else {
        setPaymentModalError('Payment could not be completed. Please try again.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentModalError(err.message || 'Payment processing failed.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setIsDownloadingInvoice(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/orders/${orderNumber}/invoice`,
        {
          responseType: 'blob',
          withCredentials: true
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `GLACE-Invoice-${orderNumber}.pdf`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading invoice', err);
      toast.error('Unable to generate invoice at this time.');
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const handleBuyAgain = async () => {
    setIsBuyingAgain(true);
    try {
      const res = await orderService.buyAgain(orderNumber);
      const data = res?.data || res;
      const itemsToAdd = data?.items || data?.addedItems || [];

      if (!itemsToAdd || itemsToAdd.length === 0) {
        toast.error(data?.message || 'None of the items from this order are currently available.');
        return;
      }

      // Merge items into cart
      addMultipleItems(itemsToAdd, false);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 3000);

      // Toast feedback
      if (data.unavailableItems && data.unavailableItems.length > 0) {
        toast(
          (t) => (
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-sm">
                ✓ Added {itemsToAdd.length} item{itemsToAdd.length > 1 ? 's' : ''} to cart
              </span>
              <span className="text-xs text-warm-taupe">
                {data.unavailableItems.length} item{data.unavailableItems.length > 1 ? 's were' : ' was'} unavailable and skipped.
              </span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  openDrawer();
                }}
                className="mt-1 text-xs font-semibold text-pistachio underline text-left"
              >
                View Cart &rarr;
              </button>
            </div>
          ),
          { duration: 5000 }
        );
      } else {
        toast.success(
          (t) => (
            <div className="flex items-center justify-between gap-3">
              <span>{data.message || `${itemsToAdd.length} item${itemsToAdd.length > 1 ? 's' : ''} added to your cart.`}</span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  openDrawer();
                }}
                className="text-xs font-bold underline uppercase tracking-wider text-pistachio"
              >
                View Cart
              </button>
            </div>
          ),
          { duration: 4000 }
        );
      }
    } catch (err) {
      console.error('Buy Again error:', err);
      toast.error(err.message || err.response?.data?.error?.message || 'Failed to prepare Buy Again items.');
    } finally {
      setIsBuyingAgain(false);
    }
  };

  if (isLoading) return <AccountLayout title="Order Details"><div className="animate-pulse h-64 bg-gray-100 rounded"></div></AccountLayout>;
  if (error) return <AccountLayout title="Order Details"><div className="p-4 bg-red-50 text-red-600">{error}</div></AccountLayout>;
  if (!order) return <AccountLayout title="Order Details"><div className="p-4 text-warm-taupe">Order not found.</div></AccountLayout>;

  const showPayButton = (order.payment_status === 'pending' || order.payment_status === 'failed') && order.order_status !== 'cancelled';
  const isRefunded = order.payment_status === 'refunded' || order.refund?.status === 'REFUNDED' || order.payment?.refund_reference;
  const isEligibleForBuyAgain = order.order_status === 'delivered' || order.order_status === 'cancelled';

  return (
    <AccountLayout title={`Order #${order.order_number}`}>
      <div className="space-y-8">
        
        {/* Status Timeline */}
        <div className="border border-warm-taupe/20 p-6 bg-[#FAFAFA] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-playfair text-lg text-midnight-charcoal mb-2">Order Status</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm">
               {order.is_gift_order === 1 && (
                 <span className="font-semibold px-2.5 py-0.5 rounded text-xs tracking-wider uppercase bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                   🎁 GIFT ORDER
                 </span>
               )}
               <span className={`font-semibold px-2.5 py-0.5 rounded text-xs tracking-wider uppercase ${
                 order.order_status === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-200' :
                 order.order_status === 'delivered' ? 'bg-green-50 text-green-700 border border-green-200' :
                 'bg-gray-100 text-gray-800'
               }`}>
                 {order.order_status.replace('_', ' ').toUpperCase()}
               </span>
               <span className={`font-semibold px-2.5 py-0.5 rounded text-xs tracking-wider uppercase ${
                 order.payment_status === 'paid' ? 'bg-green-50 text-green-700 border border-green-200' :
                 order.payment_status === 'refunded' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                 order.payment_status === 'failed' ? 'bg-red-50 text-red-600 border border-red-200' :
                 'bg-amber-50 text-amber-700 border border-amber-200'
               }`}>
                 PAYMENT: {order.payment_status.toUpperCase()}
               </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Download Invoice Button */}
            <button
              onClick={handleDownloadInvoice}
              disabled={isDownloadingInvoice}
              className="px-4 py-2 border border-midnight-charcoal text-midnight-charcoal hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isDownloadingInvoice ? 'DOWNLOADING...' : 'INVOICE'}
            </button>

            {/* Pay / Retry Payment button */}
            {showPayButton && (
              <button
                onClick={() => setIsPayModalOpen(true)}
                className="px-6 py-2 bg-espresso text-white hover:bg-black transition-colors text-sm font-medium"
              >
                {order.payment_status === 'failed' ? 'RETRY PAYMENT' : 'PAY NOW'}
              </button>
            )}
            
            {order.order_status !== 'cancelled' && (
              <Link 
                to={`/account/orders/${order.order_number}/track`}
                className="px-6 py-2 bg-midnight-charcoal text-white hover:bg-black transition-colors text-sm font-medium"
              >
                TRACK ORDER
              </Link>
            )}

            {order.order_status === 'pending' && (
              <button 
                onClick={() => { setCancelMode('cancel'); setIsCancelModalOpen(true); }}
                className="px-6 py-2 border border-red-600 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
              >
                CANCEL ORDER
              </button>
            )}
            {order.order_status === 'confirmed' && order.cancellation_status !== 'PENDING' && (
              <button 
                onClick={() => { setCancelMode('request'); setIsCancelModalOpen(true); }}
                className="px-6 py-2 border border-orange-500 text-orange-500 hover:bg-orange-50 transition-colors text-sm font-medium"
              >
                REQUEST CANCELLATION
              </button>
            )}
            {order.cancellation_status === 'PENDING' && (
               <div className="px-6 py-2 bg-orange-100 text-orange-700 text-sm font-medium border border-orange-200">
                 CANCELLATION REQUESTED
               </div>
            )}
            {order.cancellation_status === 'REJECTED' && (
               <div className="px-6 py-2 bg-red-100 text-red-700 text-sm font-medium border border-red-200" title={order.cancellation_request?.admin_reason}>
                 CANCELLATION REJECTED
               </div>
            )}
            {isEligibleForBuyAgain && (
              <button 
                onClick={handleBuyAgain}
                disabled={isBuyingAgain}
                className={`px-6 py-2 transition-colors text-sm font-medium uppercase tracking-wider ${
                  justAdded
                    ? 'bg-green-700 text-white border border-green-700'
                    : 'bg-espresso text-ivory hover:bg-black border border-espresso disabled:opacity-50'
                }`}
              >
                {isBuyingAgain ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ADDING...
                  </span>
                ) : justAdded ? (
                  '✓ ADDED TO CART'
                ) : (
                  'BUY AGAIN'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Dedicated Refund Card (When Refunded) */}
        {isRefunded && (
          <div className="border border-purple-200 bg-purple-50/60 p-6 rounded-none space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse"></span>
              <h3 className="font-playfair text-lg font-bold text-purple-950">Refund Processed</h3>
            </div>
            
            <p className="text-xs text-purple-800">
              The internal simulated refund for this cancelled order has completed successfully.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-2 border-t border-purple-200/60">
              <div>
                <span className="text-xs text-purple-700 block mb-0.5">Refund Status</span>
                <span className="font-semibold text-purple-900">REFUNDED</span>
              </div>
              <div>
                <span className="text-xs text-purple-700 block mb-0.5">Refund Amount</span>
                <span className="font-bold text-purple-950 text-base">
                  ₹{parseFloat(order.refund?.amount || order.payment?.refund_amount || order.total_amount).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-xs text-purple-700 block mb-0.5">Refund Reference</span>
                <span className="font-mono text-xs text-purple-900 font-semibold">
                  {order.refund?.refund_reference || order.payment?.refund_reference || 'REF-INTERNAL'}
                </span>
              </div>
              <div>
                <span className="text-xs text-purple-700 block mb-0.5">Refund Date</span>
                <span className="text-purple-900 text-xs">
                  {new Date(order.refund?.processed_at || order.payment?.refunded_at || order.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {(order.refund?.reason || order.payment?.refund_reason) && (
              <div className="pt-2 text-xs text-purple-800">
                <span className="font-medium">Reason: </span>
                <span className="italic">{order.refund?.reason || order.payment?.refund_reason}</span>
              </div>
            )}
          </div>
        )}

        {/* Payment Information */}
        {order.payment && (
          <div className="border border-warm-taupe/20 p-6 bg-[#FAFAFA]">
            <h3 className="font-playfair text-lg text-midnight-charcoal mb-4">Payment Details</h3>
            <div className="space-y-2 text-sm text-midnight-charcoal">
              <div className="flex justify-between">
                <span className="text-warm-taupe">Status</span>
                <span className={`font-semibold px-2 py-0.5 rounded text-xs uppercase ${
                  order.payment_status === 'paid' ? 'bg-green-50 text-green-700' :
                  order.payment_status === 'failed' ? 'bg-red-50 text-red-600' :
                  order.payment_status === 'refunded' ? 'bg-purple-50 text-purple-700' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {order.payment_status}
                </span>
              </div>
              {order.payment.payment_method && (
                <div className="flex justify-between">
                  <span className="text-warm-taupe">Method</span>
                  <span>{PAYMENT_METHOD_NAMES[order.payment.payment_method] || order.payment.payment_method}</span>
                </div>
              )}
              {order.payment.transaction_reference && (
                <div className="flex justify-between">
                  <span className="text-warm-taupe">Transaction Reference</span>
                  <span className="font-mono text-xs">{order.payment.transaction_reference}</span>
                </div>
              )}
              {order.payment.paid_at && (
                <div className="flex justify-between">
                  <span className="text-warm-taupe">Paid At</span>
                  <span>{new Date(order.payment.paid_at).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="border border-warm-taupe/20 p-6 bg-[#FAFAFA]">
          <h3 className="font-playfair text-lg text-midnight-charcoal mb-4">Items</h3>
          <div className="space-y-4">
            {order.items?.map(item => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-warm-taupe/10 last:border-0">
                <div>
                  <p className="text-midnight-charcoal font-medium">{item.product_name}</p>
                  <p className="text-sm text-warm-taupe">{item.variant_name} x {item.quantity}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-midnight-charcoal font-medium">₹{item.total_price}</p>
                  {order.order_status === 'delivered' && item.product_id && (
                    reviewedItems[item.product_id] ? (
                      <span className="text-xs text-pistachio font-medium px-3 py-1 bg-pistachio/10 border border-pistachio/20">✓ REVIEWED</span>
                    ) : (
                      <button
                        onClick={() => setReviewItem(item)}
                        className="text-xs font-medium px-3 py-1 border border-amber-400 text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        ★ RATE & REVIEW
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border border-warm-taupe/20 p-6 bg-[#FAFAFA]">
          <h3 className="font-playfair text-lg text-midnight-charcoal mb-4">Summary</h3>
          <div className="space-y-2 text-sm text-midnight-charcoal">
            <div className="flex justify-between"><span className="text-warm-taupe">Subtotal</span><span>₹{order.subtotal}</span></div>
            <div className="flex justify-between"><span className="text-warm-taupe">Delivery Fee</span><span>₹{order.delivery_fee}</span></div>
            {order.discount_amount > 0 && <div className="flex justify-between"><span className="text-green-600">Discount</span><span className="text-green-600">-₹{order.discount_amount}</span></div>}
            <div className="flex justify-between border-t border-warm-taupe/20 pt-2 mt-2 font-medium text-base">
              <span>Total</span><span>₹{order.total_amount}</span>
            </div>
          </div>
        </div>

        {/* Address / Gift Details */}
        {order.is_gift_order === 1 ? (
          <div className="border border-amber-300 bg-amber-50/40 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🎁</span>
              <h3 className="font-playfair text-lg font-bold text-amber-950">Gift Delivery Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-midnight-charcoal">
              <div>
                <p className="text-xs text-amber-800 uppercase font-semibold mb-1">Recipient</p>
                <p className="font-medium">{order.gift_recipient_name}</p>
                {order.gift_recipient_phone && <p className="text-warm-taupe">{order.gift_recipient_phone}</p>}
                <p className="mt-1">{order.gift_recipient_address}</p>
                <p>{order.gift_recipient_city}, {order.gift_recipient_state} {order.gift_recipient_postal_code}</p>
              </div>
              {order.gift_message && (
                <div>
                  <p className="text-xs text-amber-800 uppercase font-semibold mb-1">Gift Message</p>
                  <div className="p-3 bg-white border border-amber-200 rounded italic text-midnight-charcoal">
                    "{order.gift_message}"
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="border border-warm-taupe/20 p-6 bg-[#FAFAFA]">
            <h3 className="font-playfair text-lg text-midnight-charcoal mb-4">Delivery Address</h3>
            <DeliveryAddress address={order.delivery_address_snapshot} />
          </div>
        )}

      </div>

      {/* Inline Pay Modal for Pending / Failed Orders */}
      {isPayModalOpen && (
        <div className="fixed inset-0 bg-espresso/50 flex items-center justify-center z-50 p-4" onClick={() => !isPaying && setIsPayModalOpen(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b border-sand-dark">
              <h3 className="text-lg font-serif text-charcoal">Complete Payment</h3>
              <button onClick={() => !isPaying && setIsPayModalOpen(false)} className="text-charcoal-light hover:text-charcoal">✕</button>
            </div>

            <div>
              <p className="text-xs text-charcoal-light uppercase font-semibold">Payable Amount</p>
              <p className="text-2xl font-bold text-charcoal">₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-charcoal-light uppercase font-semibold">Payment Method</p>
              {['upi', 'card', 'netbanking', 'wallet'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMethod(m)}
                  className={`w-full p-3 rounded-xl border-2 text-left flex justify-between items-center transition-all ${
                    selectedMethod === m ? 'border-espresso bg-sand-light/40 font-semibold' : 'border-sand-dark hover:border-espresso/40'
                  }`}
                >
                  <span className="text-sm text-charcoal">{PAYMENT_METHOD_NAMES[m]}</span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedMethod === m ? 'border-espresso bg-espresso' : 'border-sand-dark'}`}>
                    {selectedMethod === m && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>

            {paymentModalError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">
                {paymentModalError}
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                disabled={isPaying}
                className="flex-1 py-3 border border-sand-dark text-charcoal text-sm rounded-full hover:bg-sand-light"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInlinePayment}
                disabled={isPaying}
                className="flex-1 py-3 bg-espresso text-cream text-sm font-semibold rounded-full hover:bg-charcoal flex items-center justify-center gap-2"
              >
                {isPaying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  `Pay ₹${parseFloat(order.total_amount).toLocaleString('en-IN')}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <CancelOrderModal 
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelOrder}
        isCancelling={isCancelling}
        mode={cancelMode}
      />

      {reviewItem && (
        <ReviewForm
          isOpen={!!reviewItem}
          onClose={() => setReviewItem(null)}
          productId={reviewItem.product_id}
          productName={reviewItem.product_name}
          orderId={order.id}
          onSuccess={() => {
            setReviewedItems(prev => ({ ...prev, [reviewItem.product_id]: true }));
            setReviewItem(null);
          }}
        />
      )}
    </AccountLayout>
  );
};

export default OrderDetail;
