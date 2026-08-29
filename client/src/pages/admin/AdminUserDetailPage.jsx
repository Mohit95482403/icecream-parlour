import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  Mail, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  IndianRupee, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader
} from 'lucide-react';
import adminUsersApi from '../../services/admin/adminUsersApi';
import SEO from '../../components/seo/SEO';

const formatMoney = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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

// Reusable Modal Component
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, actionText, actionType, loading }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-espresso/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 animate-fade-in">
        <h3 className="text-xl font-medium text-espresso mb-2">{title}</h3>
        <p className="text-espresso/70 mb-6">{message}</p>
        
        <div className="flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-espresso bg-warm-taupe/10 hover:bg-warm-taupe/20 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-lg text-ivory transition-colors disabled:opacity-50 flex items-center gap-2 ${
              actionType === 'danger' ? 'bg-berry hover:bg-berry/90' : 'bg-espresso hover:bg-espresso/90'
            }`}
          >
            {loading && <div className="w-4 h-4 border-2 border-ivory border-t-transparent rounded-full animate-spin"></div>}
            {actionText}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminUserDetailPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminUsersApi.getUserById(id);
      setData(res.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        setError('Customer not found.');
      } else {
        setError('Unable to load customer details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleStatusChange = async () => {
    try {
      setActionLoading(true);
      setActionError('');
      const newStatus = data.user.status === 'active' ? 'blocked' : 'active';
      await adminUsersApi.updateUserStatus(id, newStatus);
      
      setActionSuccess(`Customer successfully ${newStatus === 'active' ? 'activated' : 'deactivated'}.`);
      setModalOpen(false);
      
      // Update local state to reflect change without full reload
      setData(prev => ({
        ...prev,
        user: { ...prev.user, status: newStatus }
      }));
      
      // Clear success message after 3 seconds
      setTimeout(() => setActionSuccess(''), 3000);
      
    } catch (err) {
      setActionError(err.response?.data?.message || 'Unable to update customer status.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-8 h-8 animate-spin text-espresso/40" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="w-12 h-12 text-berry mb-4" />
        <h2 className="text-xl font-medium text-espresso mb-2">{error}</h2>
        <Link to="/admin/users" className="btn btn-primary mt-4">Back to Customers</Link>
      </div>
    );
  }

  const { user, stats, orders, addresses } = data;
  const isActive = user.status === 'active';

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-12">
      <SEO title={`${user.first_name} ${user.last_name} - GLACÉ Admin`} noindex={true} />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/admin/dashboard" className="text-espresso/60 hover:text-espresso transition-colors">Dashboard</Link>
        <span className="text-espresso/40">/</span>
        <Link to="/admin/users" className="text-espresso/60 hover:text-espresso transition-colors">Users</Link>
        <span className="text-espresso/40">/</span>
        <span className="font-medium text-espresso">{user.first_name} {user.last_name}</span>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-pistachio/20 border border-pistachio rounded-lg flex items-center gap-3 text-green-900 animate-fade-in">
          <CheckCircle2 size={18} />
          <p className="text-sm font-medium">{actionSuccess}</p>
        </div>
      )}
      
      {actionError && (
        <div className="p-4 bg-berry/10 border border-berry/30 rounded-lg flex items-center gap-3 text-berry animate-fade-in">
          <XCircle size={18} />
          <p className="text-sm font-medium">{actionError}</p>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-warm-taupe/20 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-espresso/5 text-espresso flex items-center justify-center font-display text-2xl border border-warm-taupe/20 shrink-0">
            {user.first_name?.charAt(0) || ''}{user.last_name?.charAt(0) || ''}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-display font-medium text-espresso">
                {user.first_name} {user.last_name}
              </h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                isActive ? 'bg-pistachio/30 text-green-900' : 'bg-berry/20 text-berry'
              }`}>
                {isActive ? 'Active' : 'Blocked'}
              </span>
            </div>
            <p className="text-espresso/60 mb-3">{user.email}</p>
            <p className="text-sm text-espresso/70 flex items-center gap-1.5">
              <Calendar size={14} />
              Customer since {formatDate(user.created_at)}
            </p>
          </div>
        </div>

        <div className="flex md:flex-col gap-3 shrink-0">
          <button 
            onClick={() => setModalOpen(true)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
              isActive 
                ? 'border-berry text-berry hover:bg-berry hover:text-ivory' 
                : 'border-espresso text-espresso hover:bg-espresso hover:text-ivory'
            }`}
          >
            {isActive ? 'Deactivate Account' : 'Activate Account'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-xl border border-warm-taupe/20 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-warm-taupe/10 rounded-lg text-espresso shrink-0"><ShoppingBag size={24} /></div>
          <div>
            <p className="text-xs font-medium text-espresso/60 uppercase tracking-wider mb-1">Total Orders</p>
            <p className="text-xl font-display">{stats.orderCount}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-warm-taupe/20 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-warm-taupe/10 rounded-lg text-espresso shrink-0"><IndianRupee size={24} /></div>
          <div>
            <p className="text-xs font-medium text-espresso/60 uppercase tracking-wider mb-1">Total Spent</p>
            <p className="text-xl font-display">{formatMoney(stats.totalSpent)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-warm-taupe/20 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-warm-taupe/10 rounded-lg text-espresso shrink-0"><IndianRupee size={24} /></div>
          <div>
            <p className="text-xs font-medium text-espresso/60 uppercase tracking-wider mb-1">Avg Order Value</p>
            <p className="text-xl font-display">{formatMoney(stats.avgOrderValue)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-warm-taupe/20 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-warm-taupe/10 rounded-lg text-espresso shrink-0"><Calendar size={24} /></div>
          <div>
            <p className="text-xs font-medium text-espresso/60 uppercase tracking-wider mb-1">Last Order</p>
            <p className="text-base font-medium text-espresso line-clamp-1">
              {stats.lastOrder ? formatDate(stats.lastOrder.created_at).split(',')[0] : 'Never'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* Left Column: Order History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-warm-taupe/20 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-warm-taupe/10">
              <h2 className="font-medium text-espresso text-lg">Order History</h2>
            </div>
            
            <div className="overflow-x-auto">
              {orders.length > 0 ? (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-ivory/50">
                      <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Order</th>
                      <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-taupe/10">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-ivory/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-espresso">{order.order_number}</td>
                        <td className="px-6 py-4 text-sm text-espresso/70">{formatDate(order.created_at)}</td>
                        <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                        <td className="px-6 py-4 text-sm font-medium text-espresso">{formatMoney(order.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-espresso/60">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>No orders found for this customer.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Contact & Addresses */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-warm-taupe/20 shadow-sm p-6">
            <h2 className="font-medium text-espresso text-lg mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-espresso/40 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-espresso/60 uppercase">Email Address</p>
                  <p className="text-sm text-espresso mt-0.5 break-all">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-espresso/40 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-espresso/60 uppercase">Phone Number</p>
                  <p className="text-sm text-espresso mt-0.5">{user.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="bg-white rounded-xl border border-warm-taupe/20 shadow-sm p-6 flex flex-col h-full max-h-[500px]">
            <h2 className="font-medium text-espresso text-lg mb-4">Saved Addresses</h2>
            <div className="space-y-4 overflow-y-auto hide-scrollbar">
              {addresses.length > 0 ? (
                addresses.map(addr => (
                  <div key={addr.id} className="p-4 bg-ivory/50 border border-warm-taupe/30 rounded-lg relative">
                    {addr.is_default === 1 && (
                      <span className="absolute top-4 right-4 text-[10px] font-bold tracking-wider uppercase bg-espresso text-ivory px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-espresso/60 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-espresso">{addr.label || 'Address'}</p>
                    </div>
                    <div className="text-sm text-espresso/80 space-y-0.5 pl-6">
                      <p>{addr.full_name}</p>
                      <p>{addr.address_line_1}</p>
                      {addr.address_line_2 && <p>{addr.address_line_2}</p>}
                      <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                      {addr.phone && <p className="mt-2 pt-2 border-t border-warm-taupe/20">Tel: {addr.phone}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-espresso/60 py-6 border border-dashed border-warm-taupe/30 rounded-lg">
                  No saved addresses.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleStatusChange}
        title={isActive ? 'Deactivate Customer?' : 'Activate Customer?'}
        message={
          isActive 
            ? `${user.first_name} ${user.last_name} will no longer be able to sign in or place new orders. You can reactivate their account at any time.`
            : `${user.first_name} ${user.last_name} will be able to sign in and place orders again.`
        }
        actionText={isActive ? 'Deactivate Customer' : 'Activate Customer'}
        actionType={isActive ? 'danger' : 'primary'}
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminUserDetailPage;
