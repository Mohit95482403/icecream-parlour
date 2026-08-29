import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AccountLayout from '../../layouts/AccountLayout';
import api from '../../services/api';
import orderService from '../../services/orderService';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reorderingOrderId, setReorderingOrderId] = useState(null);
  const [justAddedOrderId, setJustAddedOrderId] = useState(null);
  const { addMultipleItems, openDrawer } = useCart();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders');
        setOrders(response.data?.orders || []);
      } catch (err) {
        setError(err.message || 'Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'confirmed': return 'text-blue-600';
      case 'preparing': return 'text-purple-600';
      case 'ready': return 'text-indigo-600';
      case 'out_for_delivery': return 'text-orange-600';
      case 'delivered': return 'text-green-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusLabel = (status) => {
    return (status || '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const handleDownloadInvoice = async (orderNumber) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/orders/${orderNumber}/invoice`, {
        responseType: 'blob',
        withCredentials: true
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
      console.error('Error downloading invoice', err);
      toast.error('Unable to generate invoice at this time.');
    }
  };

  const handleBuyAgain = async (orderNumber) => {
    setReorderingOrderId(orderNumber);
    try {
      const res = await orderService.buyAgain(orderNumber);
      const data = res?.data || res;
      const itemsToAdd = data?.items || data?.addedItems || [];

      if (!itemsToAdd || itemsToAdd.length === 0) {
        toast.error(data?.message || 'None of the items from this order are currently available.');
        return;
      }

      // Add valid authoritative items to cart
      addMultipleItems(itemsToAdd, false);
      setJustAddedOrderId(orderNumber);
      setTimeout(() => setJustAddedOrderId(null), 3000);

      // Detailed toast notification
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
      toast.error(err.message || err.response?.data?.error?.message || 'Unable to reorder items. Please try again.');
    } finally {
      setReorderingOrderId(null);
    }
  };

  return (
    <AccountLayout title="Order History">
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded"></div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 text-sm">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-midnight-charcoal mb-4">Your sweetest moments are still ahead.</p>
          <Link to="/shop" className="inline-block bg-midnight-charcoal text-white py-3 px-8 font-medium hover:bg-black transition-colors">
            EXPLORE ICE CREAM
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const isEligibleForBuyAgain = order.order_status === 'delivered' || order.order_status === 'cancelled';
            const isReorderingThis = reorderingOrderId === order.order_number;
            const isJustAddedThis = justAddedOrderId === order.order_number;

            return (
              <div key={order.order_number} className="border border-warm-taupe/20 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#FAFAFA]">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-playfair text-lg text-midnight-charcoal">
                      Order #{order.order_number}
                    </h3>
                    {order.is_gift_order === 1 && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded flex items-center gap-1">
                        🎁 GIFT ORDER
                      </span>
                    )}
                    {order.payment_status === 'refunded' && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 rounded">
                        REFUNDED
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-warm-taupe mb-2">
                    {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-midnight-charcoal font-medium">₹{parseFloat(order.total_amount).toFixed(2)}</p>
                </div>
                
                <div className="flex flex-col items-start md:items-end gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={`text-sm font-medium flex items-center gap-1.5 ${getStatusColor(order.order_status)}`}>
                      <span className="w-2 h-2 rounded-full bg-current"></span>
                      {getStatusLabel(order.order_status)}
                    </div>
                    {order.payment_status && order.payment_status !== 'refunded' && (
                      <span className="text-xs text-warm-taupe">
                        ({order.payment_status.toUpperCase()})
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end pt-2 md:pt-0">
                    <button 
                      onClick={() => handleDownloadInvoice(order.order_number)}
                      className="text-xs sm:text-sm border border-midnight-charcoal px-3 sm:px-4 py-2 hover:bg-gray-50 transition-colors flex-1 sm:flex-initial text-center rounded-sm"
                    >
                      INVOICE
                    </button>

                    {order.order_status !== 'cancelled' && (
                      <Link 
                        to={`/account/orders/${order.order_number}/track`}
                        className="text-xs sm:text-sm bg-midnight-charcoal text-white px-3 sm:px-4 py-2 hover:bg-black transition-colors flex-1 sm:flex-initial text-center rounded-sm"
                      >
                        TRACK
                      </Link>
                    )}

                    {isEligibleForBuyAgain && (
                      <button
                        onClick={() => handleBuyAgain(order.order_number)}
                        disabled={isReorderingThis}
                        className={`text-xs sm:text-sm px-3 sm:px-4 py-2 transition-all flex-1 sm:flex-initial text-center rounded-sm font-medium uppercase tracking-wider ${
                          isJustAddedThis
                            ? 'bg-green-700 text-white border border-green-700'
                            : 'bg-espresso text-ivory hover:bg-black border border-espresso disabled:opacity-50'
                        }`}
                        title="Reorder available items from this order into your cart"
                      >
                        {isReorderingThis ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ADDING...
                          </span>
                        ) : isJustAddedThis ? (
                          '✓ ADDED'
                        ) : (
                          'BUY AGAIN'
                        )}
                      </button>
                    )}

                    <Link 
                      to={`/order/${order.order_number}`}
                      className="text-xs sm:text-sm border border-midnight-charcoal px-3 sm:px-4 py-2 hover:bg-gray-50 transition-colors flex-1 sm:flex-initial text-center rounded-sm"
                    >
                      VIEW
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AccountLayout>
  );
};

export default Orders;
