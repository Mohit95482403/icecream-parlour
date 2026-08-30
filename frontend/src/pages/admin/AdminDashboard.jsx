import React, { useState, useEffect } from 'react';
import adminApi from '../../utils/adminApi';
import SEO from '../../components/seo/SEO';
import { IndianRupee, ShoppingBag, Users, Package, AlertCircle } from 'lucide-react';

const formatMoney = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-warm-taupe/20 text-espresso',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-yellow-100 text-yellow-800',
    out_for_delivery: 'bg-purple-100 text-purple-800',
    delivered: 'bg-pistachio/30 text-green-900',
    cancelled: 'bg-berry/20 text-berry'
  };

  const labels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.get('/dashboard');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-warm-taupe/10 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-warm-taupe/10 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-warm-taupe/10 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-berry mb-4" />
        <h2 className="text-xl font-medium text-espresso mb-2">{error}</h2>
        <button onClick={fetchDashboard} className="btn btn-primary mt-4">Try Again</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SEO title="Dashboard - GLACÉ Admin" noindex={true} />
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-medium text-espresso mb-1">Dashboard</h1>
        <p className="text-espresso/60 text-sm">Overview of your store performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-xl border border-warm-taupe/20 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-warm-taupe/10 rounded-lg text-espresso">
              <IndianRupee size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-espresso/60 uppercase tracking-wider">Total Revenue</p>
              <p className="text-2xl font-display mt-1">{formatMoney(data.revenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-warm-taupe/20 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-warm-taupe/10 rounded-lg text-espresso">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-espresso/60 uppercase tracking-wider">Total Orders</p>
              <p className="text-2xl font-display mt-1">{data.orders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-warm-taupe/20 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-warm-taupe/10 rounded-lg text-espresso">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-espresso/60 uppercase tracking-wider">Customers</p>
              <p className="text-2xl font-display mt-1">{data.customers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-warm-taupe/20 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-warm-taupe/10 rounded-lg text-espresso">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-espresso/60 uppercase tracking-wider">Active Products</p>
              <p className="text-2xl font-display mt-1">{data.products}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-warm-taupe/20 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-warm-taupe/10 flex items-center justify-between">
            <h2 className="font-medium text-espresso text-lg">Recent Orders</h2>
            <button className="text-sm font-medium text-espresso/60 hover:text-espresso">View All</button>
          </div>
          <div className="overflow-x-auto flex-1">
            {data.recentOrders.length > 0 ? (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-ivory/50">
                    <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-taupe/10">
                  {data.recentOrders.map(order => (
                    <tr key={order.id} className="hover:bg-ivory/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-espresso">{order.order_number}</td>
                      <td className="px-6 py-4 text-sm text-espresso/80">{order.first_name} {order.last_name}</td>
                      <td className="px-6 py-4 text-sm text-espresso/60">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-espresso">{formatMoney(order.total)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-espresso/60">
                No orders yet.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Data */}
        <div className="space-y-8">
          {/* Order Status */}
          <div className="bg-white rounded-xl border border-warm-taupe/20 shadow-sm p-6">
            <h2 className="font-medium text-espresso text-lg mb-4">Order Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-espresso/70">Pending</span>
                <span className="font-medium bg-ivory px-2 py-0.5 rounded-full">{data.orderStatus.pending}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-espresso/70">Preparing</span>
                <span className="font-medium bg-yellow-50 px-2 py-0.5 rounded-full text-yellow-800">{data.orderStatus.preparing}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-espresso/70">Out for Delivery</span>
                <span className="font-medium bg-purple-50 px-2 py-0.5 rounded-full text-purple-800">{data.orderStatus.out_for_delivery}</span>
              </div>
            </div>
          </div>

          {/* Low Stock */}
          <div className="bg-white rounded-xl border border-warm-taupe/20 shadow-sm p-6 flex flex-col h-full max-h-[300px]">
            <h2 className="font-medium text-espresso text-lg mb-4">Low Stock Alerts</h2>
            <div className="space-y-4 overflow-y-auto hide-scrollbar flex-1">
              {data.lowStock.length > 0 ? (
                data.lowStock.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-espresso">{item.product_name}</p>
                      <p className="text-xs text-espresso/60">{item.size}</p>
                    </div>
                    <span className="text-xs font-bold text-berry bg-berry/10 px-2 py-1 rounded-md">
                      {item.stock_quantity} left
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-espresso/60 py-4">
                  Inventory looks healthy.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
