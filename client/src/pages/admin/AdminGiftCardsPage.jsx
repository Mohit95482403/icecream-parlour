import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  Sliders, 
  Ban, 
  CheckCircle2, 
  Clock, 
  Receipt, 
  X, 
  DollarSign, 
  Send, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Copy,
  Check,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import giftCardService from '../../services/giftCardService';

const AdminGiftCardsPage = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, total: 0 });

  // Modal States
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({
    amount: 1000,
    recipientEmail: '',
    recipientName: '',
    senderName: 'GLACÉ Customer Care',
    personalMessage: ''
  });
  const [issuing, setIssuing] = useState(false);

  const [selectedCard, setSelectedCard] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  const [adjustCard, setAdjustCard] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ amount: '', reason: '' });
  const [adjusting, setAdjusting] = useState(false);

  const [deleteCard, setDeleteCard] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [copiedCode, setCopiedCode] = useState(null);

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      const res = await giftCardService.adminListGiftCards({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter
      });

      if (res.success && res.data) {
        setCards(res.data.cards || []);
        setPagination(res.data.pagination || { page: 1, limit: 20, totalPages: 1, total: 0 });
      }
    } catch (err) {
      console.error('Failed to load admin gift cards:', err);
      toast.error('Failed to load gift cards');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueForm.amount || parseFloat(issueForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setIssuing(true);
      const res = await giftCardService.adminIssueGiftCard(issueForm);
      if (res.success) {
        toast.success(`Gift card of ₹${issueForm.amount} issued successfully!`);
        setIsIssueModalOpen(false);
        setIssueForm({
          amount: 1000,
          recipientEmail: '',
          recipientName: '',
          senderName: 'GLACÉ Customer Care',
          personalMessage: ''
        });
        fetchCards();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to issue gift card');
    } finally {
      setIssuing(false);
    }
  };

  const handleSuspend = async (cardId) => {
    if (!window.confirm('Are you sure you want to suspend this gift card?')) return;
    try {
      const res = await giftCardService.adminSuspendGiftCard(cardId, 'Suspended by admin');
      if (res.success) {
        toast.success('Gift card suspended');
        fetchCards();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to suspend card');
    }
  };

  const handleActivate = async (cardId) => {
    try {
      const res = await giftCardService.adminActivateGiftCard(cardId);
      if (res.success) {
        toast.success('Gift card activated');
        fetchCards();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to activate card');
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustCard || !adjustForm.amount || !adjustForm.reason) {
      toast.error('Amount and reason are required');
      return;
    }

    try {
      setAdjusting(true);
      const res = await giftCardService.adminAdjustBalance(
        adjustCard.id,
        parseFloat(adjustForm.amount),
        adjustForm.reason
      );
      if (res.success) {
        toast.success('Balance adjusted successfully!');
        setAdjustCard(null);
        setAdjustForm({ amount: '', reason: '' });
        fetchCards();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to adjust balance');
    } finally {
      setAdjusting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteCard) return;
    try {
      setDeleting(true);
      const res = await giftCardService.adminDeleteGiftCard(deleteCard.id);
      if (res.success) {
        toast.success('Gift card deleted successfully.');
        setDeleteCard(null);
        fetchCards();
      } else {
        toast.error(res.error?.message || 'Unable to delete gift card. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting gift card:', err);
      toast.error(err.message || 'Unable to delete gift card. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const openDetails = async (cardId) => {
    try {
      setLedgerLoading(true);
      const res = await giftCardService.adminGetGiftCard(cardId);
      if (res.success && res.data) {
        setSelectedCard(res.data.card);
        setTransactions(res.data.transactions || []);
      }
    } catch (err) {
      toast.error('Failed to load card details');
    } finally {
      setLedgerLoading(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Active</span>;
      case 'exhausted':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sand-dark/40 text-charcoal-light">Exhausted</span>;
      case 'suspended':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Suspended</span>;
      case 'expired':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Expired</span>;
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Pending</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sand-light text-charcoal">{status}</span>;
    }
  };

  // Metrics
  const activeCards = cards.filter(c => c.status === 'active');
  const activeValue = activeCards.reduce((sum, c) => sum + c.currentBalance, 0);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-espresso tracking-tight">
            Gift Cards Management
          </h1>
          <p className="text-xs md:text-sm text-charcoal-light mt-1">
            Monitor real stored-value gift cards, adjust balances, and issue direct cards.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsIssueModalOpen(true)}
          className="px-5 py-2.5 bg-espresso text-cream text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-charcoal transition-all flex items-center gap-2 shadow-sm shrink-0"
        >
          <Plus size={16} />
          <span>Issue Gift Card</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 bg-white border border-sand-dark rounded-2xl shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold uppercase text-charcoal-light tracking-wider">Total Active Value</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-2xl font-serif font-bold text-charcoal">₹{activeValue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-charcoal-light mt-1">{activeCards.length} currently active cards</p>
        </div>

        <div className="p-5 bg-white border border-sand-dark rounded-2xl shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold uppercase text-charcoal-light tracking-wider">Total Stored Cards</span>
            <div className="w-8 h-8 rounded-lg bg-espresso/5 text-espresso flex items-center justify-center">
              <Gift size={16} />
            </div>
          </div>
          <p className="text-2xl font-serif font-bold text-charcoal">{pagination.total}</p>
          <p className="text-xs text-charcoal-light mt-1">Issued across all channels</p>
        </div>

        <div className="p-5 bg-white border border-sand-dark rounded-2xl shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold uppercase text-charcoal-light tracking-wider">Suspended Cards</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Ban size={16} />
            </div>
          </div>
          <p className="text-2xl font-serif font-bold text-charcoal">
            {cards.filter(c => c.status === 'suspended').length}
          </p>
          <p className="text-xs text-charcoal-light mt-1">Temporarily locked from redemption</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white border border-sand-dark rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-light" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, customer email, or recipient..."
            className="w-full pl-10 pr-4 py-2.5 bg-sand-light/40 border border-sand-dark rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-espresso focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-charcoal-light" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-sand-light/40 border border-sand-dark rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-espresso"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="exhausted">Exhausted</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <button
            type="button"
            onClick={fetchCards}
            className="p-2.5 text-charcoal-light hover:text-espresso bg-sand-light/40 border border-sand-dark rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-sand-dark rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-sand-dark text-charcoal-light font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">Gift Card Code</th>
                <th className="py-4 px-6">Balance / Initial</th>
                <th className="py-4 px-6">Customer / Recipient</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Expiry</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-dark/40">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-charcoal-light">
                    <Loader2 size={24} className="animate-spin text-espresso mx-auto mb-2" />
                    <span>Loading gift cards...</span>
                  </td>
                </tr>
              ) : cards.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-charcoal-light">
                    No gift cards found matching your criteria.
                  </td>
                </tr>
              ) : (
                cards.map((card) => (
                  <tr key={card.id} className="hover:bg-sand-light/20 transition-colors">
                    {/* Code */}
                    <td className="py-4 px-6 font-mono font-bold text-charcoal">
                      <div className="flex items-center gap-2">
                        <span>{card.code}</span>
                        <button
                          onClick={() => copyToClipboard(card.code)}
                          className="text-charcoal-light hover:text-espresso p-0.5"
                          title="Copy Code"
                        >
                          {copiedCode === card.code ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>

                    {/* Balance */}
                    <td className="py-4 px-6">
                      <p className="font-semibold text-charcoal text-sm">
                        ₹{card.currentBalance.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] text-charcoal-light">
                        Initial: ₹{card.initialAmount.toLocaleString('en-IN')}
                      </p>
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-6">
                      <p className="font-medium text-charcoal">
                        {card.recipientEmail || card.buyerEmail || 'Unassigned'}
                      </p>
                      <p className="text-[11px] text-charcoal-light">
                        {card.recipientName ? `For: ${card.recipientName}` : (card.buyerName ? `Buyer: ${card.buyerName}` : '')}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      {getStatusBadge(card.status)}
                    </td>

                    {/* Expiry */}
                    <td className="py-4 px-6 text-charcoal-light">
                      {card.expiresAt ? new Date(card.expiresAt).toLocaleDateString() : '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openDetails(card.id)}
                        className="px-2.5 py-1 bg-sand-light/60 border border-sand-dark text-charcoal hover:bg-sand-dark/40 rounded-lg text-xs font-medium transition-colors"
                      >
                        Ledger
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAdjustCard(card);
                          setAdjustForm({ amount: '', reason: '' });
                        }}
                        className="px-2.5 py-1 bg-espresso/5 text-espresso border border-espresso/20 hover:bg-espresso/10 rounded-lg text-xs font-medium transition-colors"
                      >
                        Adjust
                      </button>

                      {card.status === 'suspended' ? (
                        <button
                          type="button"
                          onClick={() => handleActivate(card.id)}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-medium transition-colors"
                        >
                          Activate
                        </button>
                      ) : card.status === 'active' ? (
                        <button
                          type="button"
                          onClick={() => handleSuspend(card.id)}
                          className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-lg text-xs font-medium transition-colors"
                        >
                          Suspend
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => setDeleteCard(card)}
                        className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-sand-dark flex justify-between items-center text-xs text-charcoal-light">
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1.5 border border-sand-dark rounded-lg disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1.5 border border-sand-dark rounded-lg disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Issue Modal */}
      <AnimatePresence>
        {isIssueModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-sand-dark"
            >
              <div className="flex items-center justify-between pb-4 border-b border-sand-dark mb-6">
                <div>
                  <h3 className="font-serif text-lg text-charcoal">Issue Direct Gift Card</h3>
                  <p className="text-xs text-charcoal-light mt-0.5">Admin-created active stored value card</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="p-1 text-charcoal-light hover:text-charcoal rounded-lg hover:bg-sand-light transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleIssueSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="50"
                    step="50"
                    value={issueForm.amount}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm bg-sand-light/40 border border-sand-dark rounded-xl focus:outline-none focus:ring-1 focus:ring-espresso focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">Recipient Name</label>
                    <input
                      type="text"
                      value={issueForm.recipientName}
                      onChange={(e) => setIssueForm(prev => ({ ...prev, recipientName: e.target.value }))}
                      placeholder="e.g. VIP Customer"
                      className="w-full px-4 py-2.5 text-xs bg-sand-light/40 border border-sand-dark rounded-xl focus:outline-none focus:ring-1 focus:ring-espresso focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">Recipient Email</label>
                    <input
                      type="email"
                      value={issueForm.recipientEmail}
                      onChange={(e) => setIssueForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                      placeholder="customer@example.com"
                      className="w-full px-4 py-2.5 text-xs bg-sand-light/40 border border-sand-dark rounded-xl focus:outline-none focus:ring-1 focus:ring-espresso focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Sender Label</label>
                  <input
                    type="text"
                    value={issueForm.senderName}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, senderName: e.target.value }))}
                    className="w-full px-4 py-2.5 text-xs bg-sand-light/40 border border-sand-dark rounded-xl focus:outline-none focus:ring-1 focus:ring-espresso focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Reason / Personal Message</label>
                  <textarea
                    rows={2}
                    value={issueForm.personalMessage}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, personalMessage: e.target.value }))}
                    placeholder="e.g. Compensation for order delay / Special VIP reward"
                    className="w-full px-4 py-2 text-xs bg-sand-light/40 border border-sand-dark rounded-xl focus:outline-none focus:ring-1 focus:ring-espresso focus:bg-white resize-none"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsIssueModalOpen(false)}
                    className="flex-1 py-3 border border-sand-dark text-charcoal text-xs font-semibold rounded-xl hover:bg-sand-light"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={issuing}
                    className="flex-1 py-3 bg-espresso text-cream text-xs font-semibold rounded-xl hover:bg-charcoal disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {issuing ? <Loader2 size={14} className="animate-spin" /> : 'Issue Card'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Adjust Balance Modal */}
      <AnimatePresence>
        {adjustCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-sand-dark"
            >
              <div className="flex items-center justify-between pb-4 border-b border-sand-dark mb-5">
                <div>
                  <h3 className="font-serif text-lg text-charcoal">Adjust Card Balance</h3>
                  <p className="font-mono text-xs text-charcoal-light">{adjustCard.code}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAdjustCard(null)}
                  className="p-1 text-charcoal-light hover:text-charcoal rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-3 bg-sand-light/60 rounded-xl mb-5 text-xs text-charcoal">
                Current Balance: <strong className="text-sm">₹{adjustCard.currentBalance.toLocaleString('en-IN')}</strong>
              </div>

              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Amount Delta (₹) * <span className="text-[11px] font-normal text-charcoal-light">(use + to add, - to subtract)</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={adjustForm.amount}
                    onChange={(e) => setAdjustForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="e.g. 500 or -200"
                    className="w-full px-4 py-2.5 text-sm bg-sand-light/40 border border-sand-dark rounded-xl focus:outline-none focus:ring-1 focus:ring-espresso focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Audit Reason *</label>
                  <textarea
                    rows={2}
                    required
                    value={adjustForm.reason}
                    onChange={(e) => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="e.g. Customer support resolution / Goodwill balance top-up"
                    className="w-full px-4 py-2 text-xs bg-sand-light/40 border border-sand-dark rounded-xl focus:outline-none focus:ring-1 focus:ring-espresso focus:bg-white resize-none"
                  />
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustCard(null)}
                    className="flex-1 py-3 border border-sand-dark text-charcoal text-xs font-semibold rounded-xl hover:bg-sand-light"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adjusting}
                    className="flex-1 py-3 bg-espresso text-cream text-xs font-semibold rounded-xl hover:bg-charcoal disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {adjusting ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Adjustment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Details & Ledger Modal */}
      <AnimatePresence>
        {selectedCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-sand-dark max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-sand-dark">
                <div>
                  <h3 className="font-serif text-lg text-charcoal">Gift Card Audit Trail</h3>
                  <p className="font-mono text-xs text-charcoal-light tracking-wider mt-0.5">{selectedCard.code}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  className="p-1 text-charcoal-light hover:text-charcoal rounded-lg hover:bg-sand-light"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Card Meta overview */}
              <div className="grid grid-cols-2 gap-3 py-4 text-xs border-b border-sand-dark/40 bg-[#FAF8F5] p-3 rounded-xl my-4">
                <div>
                  <span className="text-charcoal-light">Current Balance:</span>
                  <p className="font-bold text-sm text-charcoal">₹{selectedCard.currentBalance.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-charcoal-light">Initial Value:</span>
                  <p className="font-medium text-charcoal">₹{selectedCard.initialAmount.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-charcoal-light">Buyer / Redeemer:</span>
                  <p className="font-medium text-charcoal truncate">{selectedCard.buyerEmail || selectedCard.redeemerEmail || 'Direct issue'}</p>
                </div>
                <div>
                  <span className="text-charcoal-light">Status:</span>
                  <div className="mt-0.5">{getStatusBadge(selectedCard.status)}</div>
                </div>
              </div>

              {/* Transaction list */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {ledgerLoading ? (
                  <div className="py-12 text-center text-charcoal-light text-xs">
                    <Loader2 size={20} className="animate-spin text-espresso mx-auto mb-2" />
                    <span>Loading audit records...</span>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="py-10 text-center text-xs text-charcoal-light">
                    No ledger records recorded for this card.
                  </div>
                ) : (
                  transactions.map((tx) => {
                    const isCredit = tx.amount > 0;
                    return (
                      <div
                        key={tx.id}
                        className="p-3.5 bg-sand-light/30 border border-sand-dark/40 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isCredit ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-700'
                          }`}>
                            {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                          </div>
                          <div>
                            <p className="font-semibold text-charcoal capitalize">
                              {tx.type} {tx.referenceId ? `(${tx.referenceId})` : ''}
                            </p>
                            <p className="text-[11px] text-charcoal-light">
                              {new Date(tx.createdAt).toLocaleString()}
                              {tx.performedByName ? ` • by ${tx.performedByName}` : ''}
                            </p>
                            {tx.description && (
                              <p className="text-[10px] text-charcoal-light italic mt-0.5">{tx.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`font-bold font-mono ${isCredit ? 'text-emerald-700' : 'text-charcoal'}`}>
                            {isCredit ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                          </p>
                          <p className="text-[10px] text-charcoal-light">
                            Bal: ₹{tx.balanceAfter.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-sand-dark text-left"
            >
              <div className="flex items-center gap-3 mb-4 text-red-600">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-charcoal">Delete Gift Card?</h3>
                  <p className="text-xs text-charcoal-light">This action is permanent and immediate.</p>
                </div>
              </div>

              <div className="bg-sand-light/50 border border-sand-dark rounded-xl p-4 space-y-2 mb-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-charcoal-light">Gift Card:</span>
                  <span className="font-mono font-bold text-charcoal">{deleteCard.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-light">Current Balance:</span>
                  <span className="font-semibold text-charcoal">₹{deleteCard.currentBalance.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-light">Recipient:</span>
                  <span className="font-medium text-charcoal">{deleteCard.recipientEmail || deleteCard.buyerEmail || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-light">Status:</span>
                  <span className="capitalize font-medium text-charcoal">{deleteCard.status}</span>
                </div>
              </div>

              <div className="p-3 bg-red-50/70 border border-red-200/60 rounded-xl mb-6 flex gap-2.5 items-start text-xs text-red-700">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Deleting this gift card will remove it from the customer's available gift cards and prevent further redemption.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setDeleteCard(null)}
                  className="px-4 py-2.5 bg-sand-light/60 border border-sand-dark text-charcoal text-xs font-semibold rounded-xl hover:bg-sand-dark/40 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteSubmit}
                  className="px-5 py-2.5 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete Gift Card</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminGiftCardsPage;
