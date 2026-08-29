import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import axios from 'axios';

const METHOD_LABELS = {
  'upi': 'UPI',
  'demo_upi': 'UPI',
  'card': 'Credit / Debit Card',
  'demo_card': 'Credit / Debit Card',
  'netbanking': 'Net Banking',
  'demo_netbanking': 'Net Banking',
  'wallet': 'Digital Wallet',
  'demo_wallet': 'Digital Wallet'
};

const OrderSuccess = () => {
  const { id: orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/orders/${orderNumber}`);
      if (res.data?.order) {
        setOrder(res.data.order);
      } else if (res.order) {
        setOrder(res.order);
      } else {
        throw new Error('Order data could not be retrieved.');
      }
    } catch (err) {
      console.error('Failed to load order info:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderNumber) fetchOrder();
  }, [orderNumber]);

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/orders/${order?.order_number || orderNumber}/invoice`,
        {
          responseType: 'blob',
          withCredentials: true
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `GLACE-Invoice-${order?.order_number || orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Invoice download error:', err);
      alert('Unable to download invoice at this moment.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-[#FDFBF7] px-4 py-16">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg bg-white p-8 sm:p-10 border border-warm-taupe/20 rounded-2xl text-center shadow-sm"
      >
        {/* Success Icon */}
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-200/60 shadow-xs">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl text-charcoal mb-2">Payment Successful!</h1>
        <p className="text-charcoal-light text-sm sm:text-base mb-8">
          Thank you for your order. Your payment has been received and your artisan ice cream is being prepared.
        </p>

        {loading ? (
          <div className="bg-sand-light/40 border border-sand-dark rounded-xl p-6 mb-8 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-espresso border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-charcoal-light uppercase tracking-wider">Fetching Order Details...</p>
          </div>
        ) : error ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 text-left text-sm space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-amber-200/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">Order Reference</span>
              <span className="font-semibold text-charcoal font-mono text-sm">{orderNumber}</span>
            </div>
            <p className="text-xs text-amber-700">Order confirmed. Status details could not be refreshed immediately.</p>
            <button
              onClick={fetchOrder}
              className="text-xs font-semibold text-espresso underline hover:text-charcoal"
            >
              Retry loading details
            </button>
          </div>
        ) : (
          /* Order Details Card */
          <div className="bg-[#FAF8F5] border border-sand-dark rounded-xl p-5 sm:p-6 mb-8 text-left space-y-3 shadow-xs">
            <div className="flex justify-between items-center pb-2.5 border-b border-sand-dark">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-light">Order Number</span>
              <span className="font-bold text-charcoal font-mono text-sm">{order?.order_number || orderNumber}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-charcoal-light">Amount Paid</span>
              <span className="font-bold text-charcoal text-base">₹{parseFloat(order?.total_amount || 0).toFixed(2)}</span>
            </div>

            {order?.payment?.payment_method && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-charcoal-light">Payment Method</span>
                <span className="font-medium text-charcoal">
                  {METHOD_LABELS[order.payment.payment_method] || order.payment.payment_method.toUpperCase()}
                </span>
              </div>
            )}

            {order?.payment?.transaction_reference && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-charcoal-light">Transaction Reference</span>
                <span className="font-mono text-xs text-charcoal-light">{order.payment.transaction_reference}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm pt-1">
              <span className="text-charcoal-light">Payment Status</span>
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                {order?.payment_status?.toUpperCase() || 'PAID'}
              </span>
            </div>

            {order?.items && order.items.length > 0 && (
              <div className="pt-2.5 mt-2 border-t border-sand-dark text-xs text-charcoal-light flex justify-between items-center">
                <span>{order.items.length} item(s) ordered</span>
                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  disabled={downloadingInvoice}
                  className="font-medium text-espresso hover:underline flex items-center gap-1"
                >
                  {downloadingInvoice ? 'Downloading...' : 'Download Invoice (PDF)'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={`/order/${order?.order_number || orderNumber}`}
            className="flex-1 px-6 py-3.5 bg-espresso text-cream text-xs font-medium uppercase tracking-widest rounded-full hover:bg-charcoal transition-colors text-center shadow-xs"
          >
            View Order Details
          </Link>
          <Link
            to="/shop"
            className="flex-1 px-6 py-3.5 border border-espresso/30 text-espresso text-xs font-medium uppercase tracking-widest rounded-full hover:bg-espresso hover:text-cream transition-colors text-center"
          >
            Continue Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderSuccess;
