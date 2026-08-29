import React, { useState, useEffect } from 'react';
import { UserPlus, Truck, Users, X, Search, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import adminDeliveryApi from '../../services/admin/adminDeliveryApi';
import toast from 'react-hot-toast';

// ─── Add Delivery Agent Modal ────────────────────────────────────────
const AddAgentModal = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', email: '', phone: '', password: '', status: 'active' });
    setErrors({});
    setServerError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.phone && !/^[0-9+\-\s()]{7,20}$/.test(form.phone)) errs.phone = 'Invalid phone number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError('');
    try {
      await adminDeliveryApi.addDeliveryPersonnel({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        status: form.status
      });
      toast.success('Delivery agent added successfully');
      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add delivery agent';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-warm-taupe/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-md">
              <UserPlus size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-display font-medium text-espresso">Add Delivery Agent</h3>
              <p className="text-xs text-espresso/50">Create a new delivery partner account</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-warm-taupe/10 rounded-lg transition-colors">
            <X size={18} className="text-espresso/60" />
          </button>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-espresso/70 mb-1.5">First Name *</label>
              <input
                type="text"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                className={`w-full px-3 py-2.5 bg-ivory/50 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${errors.firstName ? 'border-red-400 focus:ring-red-200' : 'border-warm-taupe/30 focus:ring-pink-200 focus:border-pink-400'}`}
                placeholder="Raj"
              />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-espresso/70 mb-1.5">Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                className="w-full px-3 py-2.5 bg-ivory/50 border border-warm-taupe/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 transition-all"
                placeholder="Kumar"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-espresso/70 mb-1.5">Email *</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso/30" />
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={`w-full pl-9 pr-3 py-2.5 bg-ivory/50 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${errors.email ? 'border-red-400 focus:ring-red-200' : 'border-warm-taupe/30 focus:ring-pink-200 focus:border-pink-400'}`}
                placeholder="agent@example.com"
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-espresso/70 mb-1.5">Phone</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso/30" />
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className={`w-full pl-9 pr-3 py-2.5 bg-ivory/50 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${errors.phone ? 'border-red-400 focus:ring-red-200' : 'border-warm-taupe/30 focus:ring-pink-200 focus:border-pink-400'}`}
                placeholder="+91 98765 43210"
              />
            </div>
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-espresso/70 mb-1.5">Password *</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className={`w-full px-3 py-2.5 bg-ivory/50 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${errors.password ? 'border-red-400 focus:ring-red-200' : 'border-warm-taupe/30 focus:ring-pink-200 focus:border-pink-400'}`}
              placeholder="Minimum 6 characters"
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-espresso/70 mb-1.5">Initial Status</label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2.5 bg-ivory/50 border border-warm-taupe/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 transition-all"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-warm-taupe/10">
            <button
              type="button"
              onClick={() => { resetForm(); onClose(); }}
              className="px-5 py-2.5 text-sm font-medium text-espresso bg-ivory border border-warm-taupe/30 rounded-lg hover:bg-warm-taupe/15 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg hover:from-pink-600 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Creating Agent...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Add Delivery Agent
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────
const AdminDeliveryPage = () => {
  const [activeTab, setActiveTab] = useState('deliveries');

  // Deliveries state
  const [deliveries, setDeliveries] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Add agent modal state
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);

  // Agents state
  const [agentSearch, setAgentSearch] = useState('');
  const [agentStatusFilter, setAgentStatusFilter] = useState('all');

  useEffect(() => {
    fetchPersonnel();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDeliveries();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, status, page]);

  const fetchPersonnel = async () => {
    try {
      const res = await adminDeliveryApi.getDeliveryPersonnel();
      setPersonnel(res.data);
    } catch (err) {
      console.error('Error fetching delivery personnel', err);
    }
  };

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await adminDeliveryApi.getDeliveries({ search, status, page, limit: 15 });
      setDeliveries(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedPerson) {
      toast.error('Please select a delivery person');
      return;
    }
    setAssigning(true);
    try {
      await adminDeliveryApi.assignDelivery(selectedDelivery.id, selectedPerson);
      toast.success('Delivery assigned');
      setShowAssignModal(false);
      fetchDeliveries();
    } catch (error) {
      toast.error('Failed to assign delivery');
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await adminDeliveryApi.updateDeliveryStatus(id, newStatus);
      toast.success('Status updated');
      fetchDeliveries();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadgeColor = (st) => {
    switch (st) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'picked_up': return 'bg-indigo-100 text-indigo-800';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed':
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter agents for the Agents tab
  const filteredAgents = personnel.filter(agent => {
    const matchSearch = !agentSearch || 
      (agent.first_name || '').toLowerCase().includes(agentSearch.toLowerCase()) ||
      (agent.email || '').toLowerCase().includes(agentSearch.toLowerCase()) ||
      (agent.phone || '').includes(agentSearch);
    const matchStatus = agentStatusFilter === 'all' || agent.status === agentStatusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">

      {/* ── Premium Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-medium text-espresso mb-1">Delivery Management</h1>
          <p className="text-espresso/60 text-sm">Manage delivery agents, assignments, availability, and delivery operations.</p>
        </div>
        <button
          onClick={() => setShowAddAgentModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl hover:from-pink-600 hover:to-rose-700 transition-all shadow-md hover:shadow-lg"
        >
          <UserPlus size={16} />
          + Add Delivery Agent
        </button>
      </div>

      {/* ── Tab Switcher ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-warm-taupe/20 shadow-sm p-1 inline-flex gap-1">
        <button
          onClick={() => setActiveTab('deliveries')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'deliveries'
              ? 'bg-espresso text-ivory shadow-sm'
              : 'text-espresso/60 hover:text-espresso hover:bg-warm-taupe/10'
          }`}
        >
          <Truck size={16} />
          Deliveries
        </button>
        <button
          onClick={() => setActiveTab('agents')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'agents'
              ? 'bg-espresso text-ivory shadow-sm'
              : 'text-espresso/60 hover:text-espresso hover:bg-warm-taupe/10'
          }`}
        >
          <Users size={16} />
          Delivery Agents
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            activeTab === 'agents' ? 'bg-ivory/20 text-ivory' : 'bg-warm-taupe/15 text-espresso/60'
          }`}>{personnel.length}</span>
        </button>
      </div>

      {/* ── DELIVERIES TAB ────────────────────────────────────────── */}
      {activeTab === 'deliveries' && (
        <>
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-warm-taupe/20 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso/40" />
              <input
                type="text"
                placeholder="Search orders, customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-ivory/50 border border-warm-taupe/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 transition-all"
              />
            </div>
            <select value={status} onChange={e => setStatus(e.target.value)} className="px-4 py-2.5 bg-ivory/50 border border-warm-taupe/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 text-espresso">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="unassigned">Unassigned</option>
              <option value="assigned">Assigned</option>
              <option value="picked_up">Picked Up</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed / Issue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Deliveries Table */}
          <div className="bg-white rounded-xl shadow-sm border border-warm-taupe/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-ivory/50 border-b border-warm-taupe/10">
                    <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Assigned To</th>
                    <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-taupe/10">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4"><div className="h-5 w-24 bg-warm-taupe/10 rounded animate-pulse"></div></td>
                        <td className="px-6 py-4"><div className="h-5 w-32 bg-warm-taupe/10 rounded animate-pulse"></div></td>
                        <td className="px-6 py-4"><div className="h-5 w-28 bg-warm-taupe/10 rounded animate-pulse"></div></td>
                        <td className="px-6 py-4"><div className="h-6 w-20 bg-warm-taupe/10 rounded-full animate-pulse"></div></td>
                        <td className="px-6 py-4"><div className="h-8 w-16 bg-warm-taupe/10 rounded ml-auto animate-pulse"></div></td>
                      </tr>
                    ))
                  ) : deliveries.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center text-espresso/60">
                        <Truck size={40} className="mx-auto mb-3 text-espresso/20" />
                        <p className="text-base font-medium mb-1">No delivery tasks found</p>
                        <p className="text-sm">Orders will appear here when they are ready for delivery.</p>
                      </td>
                    </tr>
                  ) : (
                    deliveries.map(delivery => (
                      <tr key={delivery.id} className="hover:bg-ivory/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-espresso">#{delivery.order_number}</td>
                        <td className="px-6 py-4 text-sm text-espresso/70">{delivery.customer_name}</td>
                        <td className="px-6 py-4 text-sm">
                          {delivery.order_status === 'cancelled' || delivery.status === 'cancelled' ? (
                            <span className="text-espresso/40 italic">Not Applicable</span>
                          ) : delivery.delivery_person_name ? (
                            <span className="font-medium text-espresso">{delivery.delivery_person_name}</span>
                          ) : (
                            <span className="text-espresso/40 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(delivery.order_status === 'cancelled' ? 'cancelled' : delivery.status)}`}>
                            {((delivery.order_status === 'cancelled' ? 'cancelled' : delivery.status) || '').replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && delivery.order_status !== 'cancelled' && (
                              <button
                                onClick={() => { setSelectedDelivery(delivery); setSelectedPerson(delivery.delivery_partner_id || ''); setShowAssignModal(true); }}
                                className="px-3 py-1.5 bg-ivory border border-warm-taupe/30 text-espresso rounded-lg hover:bg-warm-taupe/15 text-xs font-medium transition-colors"
                              >
                                Assign
                              </button>
                            )}
                            {delivery.status === 'assigned' && (
                              <button onClick={() => handleStatusUpdate(delivery.id, 'picked_up')} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-medium transition-colors">Pick Up</button>
                            )}
                            {delivery.status === 'picked_up' && (
                              <button onClick={() => handleStatusUpdate(delivery.id, 'out_for_delivery')} className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-xs font-medium transition-colors">Out for Delivery</button>
                            )}
                            {delivery.status === 'out_for_delivery' && (
                              <button onClick={() => handleStatusUpdate(delivery.id, 'delivered')} className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium transition-colors">Deliver</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-warm-taupe/10 flex items-center justify-between bg-ivory/30">
                <span className="text-sm text-espresso/60">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-1.5 border border-warm-taupe/30 rounded-lg hover:bg-warm-taupe/15 disabled:opacity-50 text-sm transition-colors">Previous</button>
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-1.5 border border-warm-taupe/30 rounded-lg hover:bg-warm-taupe/15 disabled:opacity-50 text-sm transition-colors">Next</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── AGENTS TAB ────────────────────────────────────────────── */}
      {activeTab === 'agents' && (
        <>
          {/* Agents Search & Filter */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-warm-taupe/20 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso/40" />
              <input
                type="text"
                placeholder="Search agents by name, email, phone..."
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-ivory/50 border border-warm-taupe/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 transition-all"
              />
            </div>
            <select value={agentStatusFilter} onChange={e => setAgentStatusFilter(e.target.value)} className="px-4 py-2.5 bg-ivory/50 border border-warm-taupe/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 text-espresso">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Agents Table */}
          <div className="bg-white rounded-xl shadow-sm border border-warm-taupe/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-ivory/50 border-b border-warm-taupe/10">
                    <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Agent</th>
                    <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-taupe/10">
                  {filteredAgents.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-16 text-center text-espresso/60">
                        <Users size={40} className="mx-auto mb-3 text-espresso/20" />
                        <p className="text-base font-medium mb-1">No delivery agents found</p>
                        <p className="text-sm">Click the "+ Add Delivery Agent" button to create one.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAgents.map(agent => (
                      <tr key={agent.id} className="hover:bg-ivory/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-rose-200 text-rose-700 flex items-center justify-center font-medium text-sm border border-rose-200/50">
                              {(agent.first_name || 'A').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-espresso">{agent.first_name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {agent.email && (
                              <p className="text-sm text-espresso/70 flex items-center gap-1.5">
                                <Mail size={13} className="text-espresso/30" /> {agent.email}
                              </p>
                            )}
                            {agent.phone && (
                              <p className="text-sm text-espresso/70 flex items-center gap-1.5">
                                <Phone size={13} className="text-espresso/30" /> {agent.phone}
                              </p>
                            )}
                            {!agent.email && !agent.phone && <p className="text-sm text-espresso/40 italic">No contact info</p>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            agent.status === 'active'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-gray-50 text-gray-600 border border-gray-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            {agent.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-espresso/60">
                          {agent.created_at ? new Date(agent.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Assign Delivery Modal ─────────────────────────────────── */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowAssignModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-display font-medium text-espresso">Assign Delivery</h3>
                <p className="text-sm text-espresso/50">Order #{selectedDelivery?.order_number}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-warm-taupe/10 rounded-lg transition-colors">
                <X size={18} className="text-espresso/60" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-medium text-espresso/70 mb-2">Select Delivery Person</label>
              <select
                value={selectedPerson}
                onChange={(e) => setSelectedPerson(e.target.value)}
                className="w-full border border-warm-taupe/30 rounded-lg px-4 py-2.5 bg-ivory/50 text-sm outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
              >
                <option value="">-- Select Person --</option>
                {personnel.filter(p => p.status === 'active').map(p => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name || ''}</option>
                ))}
              </select>
              {personnel.filter(p => p.status === 'active').length === 0 && (
                <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  No active delivery agents. Add one first.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAssignModal(false)} className="px-5 py-2.5 text-sm font-medium text-espresso bg-ivory border border-warm-taupe/30 rounded-lg hover:bg-warm-taupe/15 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning || !selectedPerson}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg hover:from-pink-600 hover:to-rose-700 transition-all disabled:opacity-50 shadow-md"
              >
                {assigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Agent Modal ───────────────────────────────────────── */}
      <AddAgentModal
        isOpen={showAddAgentModal}
        onClose={() => setShowAddAgentModal(false)}
        onSuccess={fetchPersonnel}
      />
    </div>
  );
};

export default AdminDeliveryPage;
