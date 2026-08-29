import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, 
  Plus, 
  Copy, 
  Check, 
  Clock, 
  Receipt, 
  ChevronRight, 
  Sparkles, 
  AlertCircle, 
  X, 
  ArrowUpRight,
  ArrowDownLeft,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import AccountLayout from '../../layouts/AccountLayout';
import giftCardService from '../../services/giftCardService';

const MyGiftCards = () => {
  const [cards, setCards] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Ledger modal state
  const [selectedCard, setSelectedCard] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      const res = await giftCardService.getMyGiftCards();
      if (res.success && res.data) {
        setCards(res.data.cards || []);
        setTotalBalance(res.data.totalBalance || 0);
      }
    } catch (err) {
      console.error('Failed to load gift cards:', err);
      toast.error('Failed to load gift cards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!redeemCode.trim()) return;

    try {
      setRedeeming(true);
      const res = await giftCardService.redeemCard(redeemCode.trim());
      if (res.success) {
        toast.success(res.message || 'Gift card added to your wallet!');
        setRedeemCode('');
        fetchCards();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to claim gift card');
    } finally {
      setRedeeming(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Gift card code copied!');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const openTransactions = async (card) => {
    setSelectedCard(card);
    setLedgerLoading(true);
    try {
      const res = await giftCardService.getCardTransactions(card.id);
      if (res.success && res.data) {
        setTransactions(res.data.transactions || []);
      }
    } catch (err) {
      toast.error('Failed to load transaction history');
    } finally {
      setLedgerLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Active</span>;
      case 'exhausted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-sand-dark/40 text-charcoal-light">Exhausted</span>;
      case 'suspended':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Suspended</span>;
      case 'expired':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Expired</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-sand-light text-charcoal">{status}</span>;
    }
  };

  return (
    <AccountLayout title="My Gift Cards">
      <div className="space-y-8">
        
        {/* Top Summary Banner */}
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#1E1916] via-[#2A231E] to-[#14100D] text-cream flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
          
          <div className="z-10">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-mono uppercase tracking-widest mb-1.5">
              <Sparkles size={14} />
              <span>Available Gift Card Balance</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-cream tracking-tight">
              ₹{totalBalance.toLocaleString('en-IN')}
            </h2>
            <p className="text-xs text-amber-200/70 mt-1 font-light">
              Usable on any artisanal gelato or ice cream order at checkout
            </p>
          </div>

          <div className="flex flex-wrap gap-3 z-10 w-full md:w-auto">
            <Link
              to="/gift-cards"
              className="flex-1 md:flex-initial px-5 py-3 bg-amber-300 text-espresso text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-amber-200 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus size={16} />
              <span>Buy Gift Card</span>
            </Link>
          </div>
        </div>

        {/* Claim / Redeem Code Box */}
        <div className="p-6 bg-white border border-sand-dark rounded-2xl shadow-xs">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-espresso/5 flex items-center justify-center text-espresso">
              <Gift size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-charcoal text-sm">Claim a Gift Card Code</h3>
              <p className="text-xs text-charcoal-light">Received a digital gift card? Add it directly to your wallet</p>
            </div>
          </div>

          <form onSubmit={handleRedeem} className="flex flex-col sm:flex-row gap-3 pt-2">
            <input
              type="text"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              placeholder="e.g. GC-XXXX-XXXX-XXXX"
              className="flex-1 px-4 py-3 text-xs sm:text-sm font-mono uppercase bg-sand-light/40 border border-sand-dark rounded-xl focus:outline-none focus:ring-1 focus:ring-espresso focus:bg-white placeholder:font-sans placeholder:normal-case transition-all"
              disabled={redeeming}
            />
            <button
              type="submit"
              disabled={redeeming || !redeemCode.trim()}
              className="px-6 py-3 bg-espresso text-cream text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-charcoal transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
            >
              {redeeming ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Claiming...</span>
                </>
              ) : (
                <span>Add to Wallet</span>
              )}
            </button>
          </form>
        </div>

        {/* Cards Listing */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-serif text-xl text-charcoal">Your Gift Cards ({cards.length})</h3>
          </div>

          {loading ? (
            <div className="py-16 text-center text-charcoal-light text-sm flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-espresso border-t-transparent rounded-full animate-spin" />
              <span>Loading gift cards...</span>
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white border border-sand-dark rounded-2xl">
              <div className="w-14 h-14 rounded-full bg-espresso/5 text-espresso mx-auto flex items-center justify-center mb-4">
                <Gift size={24} />
              </div>
              <h4 className="font-serif text-lg text-charcoal mb-1">No Gift Cards Yet</h4>
              <p className="text-xs text-charcoal-light max-w-sm mx-auto mb-6">
                You haven't claimed or purchased any gift cards. Treat a friend or yourself today!
              </p>
              <Link
                to="/gift-cards"
                className="inline-flex items-center gap-2 px-6 py-3 bg-espresso text-cream text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-charcoal transition-colors shadow-sm"
              >
                <span>Explore Gift Cards</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {cards.map((card) => {
                const isUsable = card.status === 'active' && card.currentBalance > 0;
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-white border border-sand-dark rounded-2xl shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      {/* Top status & amount */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[11px] font-mono uppercase tracking-wider text-charcoal-light">
                            {card.purchasedBy ? 'Purchased by you' : 'Claimed Card'}
                          </p>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-2xl font-serif font-bold text-charcoal">
                              ₹{card.currentBalance.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-charcoal-light">
                              of ₹{card.initialAmount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(card.status)}
                      </div>

                      {/* Code Pill with copy */}
                      <div className="p-3 bg-sand-light/60 rounded-xl border border-sand-dark/60 flex items-center justify-between mb-4">
                        <span className="font-mono text-xs font-bold text-charcoal tracking-widest">
                          {card.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(card.code)}
                          className="text-charcoal-light hover:text-espresso p-1 rounded transition-colors"
                          title="Copy Code"
                        >
                          {copiedCode === card.code ? (
                            <Check size={16} className="text-emerald-600" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>

                      {/* Sender/Recipient notes if any */}
                      {(card.senderName || card.recipientName) && (
                        <div className="text-xs text-charcoal-light mb-3 space-y-0.5 font-light">
                          {card.senderName && <p>From: <span className="font-normal text-charcoal">{card.senderName}</span></p>}
                          {card.recipientName && <p>To: <span className="font-normal text-charcoal">{card.recipientName}</span></p>}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-sand-dark/40 flex items-center justify-between text-xs text-charcoal-light">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} />
                        <span>
                          {card.expiresAt 
                            ? `Expires ${new Date(card.expiresAt).toLocaleDateString()}` 
                            : 'No expiration'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => openTransactions(card)}
                        className="text-espresso font-semibold hover:underline flex items-center gap-1"
                      >
                        <Receipt size={13} />
                        <span>History ({card.transactionCount || 0})</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Transaction History Modal / Drawer */}
      <AnimatePresence>
        {selectedCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-sand-dark max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-sand-dark">
                <div>
                  <h3 className="font-serif text-lg text-charcoal">Gift Card Ledger</h3>
                  <p className="font-mono text-xs text-charcoal-light tracking-wider mt-0.5">
                    {selectedCard.code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  className="p-1 text-charcoal-light hover:text-charcoal rounded-lg hover:bg-sand-light transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body: Transaction list */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar">
                {ledgerLoading ? (
                  <div className="py-12 text-center text-charcoal-light text-xs flex flex-col items-center gap-2">
                    <Loader2 size={20} className="animate-spin text-espresso" />
                    <span>Loading transactions...</span>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="py-10 text-center text-xs text-charcoal-light">
                    No transactions recorded for this card yet.
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
                              {tx.type} {tx.referenceId ? `(#${tx.referenceId})` : ''}
                            </p>
                            <p className="text-[11px] text-charcoal-light mt-0.5">
                              {new Date(tx.createdAt).toLocaleString()}
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

              {/* Modal Footer */}
              <div className="pt-4 border-t border-sand-dark flex justify-between items-center text-xs">
                <span className="text-charcoal-light">Current Balance</span>
                <span className="font-bold text-charcoal text-sm">
                  ₹{selectedCard.currentBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AccountLayout>
  );
};

export default MyGiftCards;
