import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrderTracking } from '../../hooks/useOrderTracking';
import AccountLayout from '../../layouts/AccountLayout';
import OrderStatusTimeline from '../../components/orders/OrderStatusTimeline';
import api from '../../services/api';
import axios from 'axios';

const OrderTracking = () => {
  const { orderNumber } = useParams();
  const { trackingData, isLoading, error } = useOrderTracking(orderNumber);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  if (isLoading) {
    return (
      <AccountLayout title={`Track Order #${orderNumber}`}>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-midnight-charcoal"></div>
        </div>
      </AccountLayout>
    );
  }

  if (error || !trackingData) {
    return (
      <AccountLayout title="Order Not Found">
        <div className="p-6 bg-red-50 text-red-600 text-center">
          {error || 'Unable to track this order.'}
          <div className="mt-4">
            <Link to="/account/orders" className="underline">Back to Orders</Link>
          </div>
        </div>
      </AccountLayout>
    );
  }

  const { order, timeline, delivery } = trackingData;

  const handleDownloadInvoice = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/orders/${orderNumber}/invoice`, {
        responseType: 'blob',
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
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
      console.error('Invoice download error:', err);
      if (err.response && err.response.status === 409) {
        setDownloadError("Your invoice will be available once your order has been delivered.");
      } else if (err.response && err.response.status === 403) {
        setDownloadError("You are not authorized to access this invoice.");
      } else {
        setDownloadError("Unable to generate your invoice right now. Please try again.");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const renderDeliveryEstimate = () => {
    if (!delivery || delivery.status === 'delivered' || delivery.status === 'cancelled') return null;
    
    // Simplistic formatting for simulation
    const formatTime = (isoString) => {
      if (!isoString) return '';
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
      <div className="bg-[#FAFAFA] border border-warm-taupe/20 p-6 mb-8 flex flex-col md:flex-row items-center gap-6 justify-between">
        <div>
          <h3 className="font-playfair text-xl text-midnight-charcoal mb-1">Estimated Delivery</h3>
          <p className="text-warm-taupe">
            {delivery.estimatedStart && delivery.estimatedEnd 
              ? `Today, ${formatTime(delivery.estimatedStart)} – ${formatTime(delivery.estimatedEnd)}`
              : 'Calculating...'}
          </p>
        </div>
        <div className="text-right">
          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full mb-2">
            {order.status === 'out_for_delivery' ? 'On the way' : 'Being prepared'}
          </span>
          {delivery.agent_name && (
            <div className="text-sm text-midnight-charcoal">
              <p className="font-medium">Delivery Agent:</p>
              <p>{delivery.agent_name}</p>
              {delivery.agent_phone && <p className="text-gray-500">{delivery.agent_phone}</p>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AccountLayout title={`Track Order #${order.orderNumber}`}>
      <div className="mb-8">
        <Link to={`/account/orders`} className="text-sm text-midnight-charcoal hover:underline inline-flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back to Orders
        </Link>
      </div>

      {order.status === 'cancelled' ? (
        <div className="bg-red-50 p-6 border border-red-100 mb-8">
          <h3 className="font-playfair text-xl text-red-800 mb-2">Order Cancelled</h3>
          <p className="text-red-600">This order has been cancelled and will not be delivered.</p>
        </div>
      ) : (
        <>
          {order.isGiftOrder && (
            <div className="bg-amber-50/70 border border-amber-300 p-5 mb-8 flex items-start gap-3">
              <span className="text-xl mt-0.5">🎁</span>
              <div>
                <h4 className="font-semibold text-amber-950 text-sm">Gift Delivery Order</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Delivering to <strong className="font-semibold">{order.giftRecipientName}</strong> at {order.giftRecipientAddress}, {order.giftRecipientCity} ({order.giftRecipientPostalCode})
                </p>
              </div>
            </div>
          )}

          {renderDeliveryEstimate()}
          
          <div className="bg-white border border-warm-taupe/20 p-6 md:p-8">
            <h3 className="font-playfair text-xl text-midnight-charcoal mb-6">Order Progress</h3>
            <OrderStatusTimeline timeline={timeline} />
          </div>

          {order.status === 'delivered' && (
            <div className="mt-8 bg-[#FAFAFA] border border-warm-taupe/20 p-8 text-center">
              <h3 className="font-playfair text-2xl text-midnight-charcoal mb-2">
                ORDER DELIVERED SUCCESSFULLY ✓
              </h3>
              <p className="text-warm-taupe mb-6">
                Thank you for ordering from GLACÉ.
              </p>
              
              {downloadError && (
                <div className="mb-4 text-red-600 text-sm">
                  {downloadError}
                </div>
              )}
              
              <button 
                onClick={handleDownloadInvoice}
                disabled={isDownloading}
                className="inline-block bg-midnight-charcoal text-white py-3 px-8 font-medium hover:bg-black transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isDownloading ? 'Downloading Invoice...' : 'DOWNLOAD INVOICE'}
              </button>
            </div>
          )}
        </>
      )}
    </AccountLayout>
  );
};

export default OrderTracking;
