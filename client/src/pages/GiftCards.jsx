import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Sparkles, ShieldCheck, Clock, Heart, Send, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import giftCardService from '../services/giftCardService';
import checkoutService from '../services/checkoutService';
import { useAuth } from '../hooks/useAuth';

const DENOMINATIONS = [250, 500, 1000, 2000, 5000];

const GiftCards = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [amount, setAmount] = useState(1000);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderName, setSenderName] = useState(
    user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''
  );
  const [personalMessage, setPersonalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);

  const handlePurchase = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please sign in or create an account to purchase a gift card');
      navigate('/login-select', { state: { from: '/gift-cards' } });
      return;
    }

    if (!recipientEmail.trim()) {
      toast.error('Recipient email is required');
      return;
    }

    try {
      setLoading(true);
      const res = await giftCardService.purchaseGiftCard({
        amount,
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName.trim(),
        senderName: senderName.trim(),
        personalMessage: personalMessage.trim()
      });

      if (res.success && res.data) {
        const { orderNumber, giftCard } = res.data;

        // Auto-pay via internal payment engine
        const payRes = await checkoutService.processPayment({
          orderNumber,
          paymentMethod: 'upi'
        });

        if (payRes.success) {
          toast.success(`Gift Card of ₹${amount} purchased successfully!`);
          setPurchaseSuccess({
            amount,
            orderNumber,
            recipientName: recipientName.trim() || 'Valued Recipient',
            recipientEmail: recipientEmail.trim(),
            code: giftCard?.code,
            status: 'Active'
          });
        } else {
          toast.error('Payment processing failed. Please retry.');
          navigate(`/order/${orderNumber}`);
        }
      }
    } catch (err) {
      console.error('Gift card purchase error:', err);
      toast.error(err.message || 'Failed to complete gift card purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-28 pb-24">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-espresso/5 border border-espresso/10 text-espresso text-xs font-semibold uppercase tracking-widest mb-4">
            <Sparkles size={14} className="text-espresso" />
            <span>Digital Stored-Value Experience</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-charcoal font-normal tracking-tight">
            The Gift of Artisanal Indulgence
          </h1>
          <p className="mt-4 text-charcoal-light text-base md:text-lg leading-relaxed font-light">
            Share our slow-churned gelato and handcrafted ice creams. Delivered instantly to their inbox with a personalized note.
          </p>
        </div>

        {/* Main 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Interactive Card Preview & Perks */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Visual Card Mockup */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative aspect-[1.58/1] rounded-2xl p-7 flex flex-col justify-between overflow-hidden shadow-2xl text-cream bg-gradient-to-br from-[#1E1916] via-[#2A231E] to-[#14100D] border border-amber-900/30"
            >
              {/* Subtle gold foil shine overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/15 via-transparent to-transparent pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

              {/* Card Top */}
              <div className="flex justify-between items-start z-10">
                <div>
                  <span className="text-xs font-mono uppercase tracking-[0.3em] text-amber-200/70">Stored Value</span>
                  <p className="text-2xl font-serif tracking-widest text-cream uppercase font-light">Glacé</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-amber-200/60 uppercase">Amount</span>
                  <p className="text-2xl md:text-3xl font-serif font-bold text-amber-300">
                    ₹{amount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Card Middle: Personalized Message Snippet */}
              <div className="z-10 py-2">
                {recipientName ? (
                  <p className="text-xs text-amber-100/90 font-light truncate">
                    For: <span className="font-semibold text-white">{recipientName}</span>
                  </p>
                ) : (
                  <p className="text-xs text-amber-200/40 italic font-light">Recipient's name will appear here</p>
                )}
                {personalMessage && (
                  <p className="text-[11px] text-cream/70 italic line-clamp-2 mt-1 font-light">
                    "{personalMessage}"
                  </p>
                )}
              </div>

              {/* Card Bottom */}
              <div className="flex justify-between items-end z-10 pt-2 border-t border-white/10">
                <div>
                  <p className="text-[10px] font-mono text-amber-200/60 uppercase tracking-wider">From</p>
                  <p className="text-xs font-medium text-cream truncate max-w-[160px]">
                    {senderName || 'A thoughtful friend'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-300/80 bg-amber-900/40 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  <ShieldCheck size={12} />
                  <span>Never Expires</span>
                </div>
              </div>
            </motion.div>

            {/* Value Props */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-white border border-sand-dark rounded-xl shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-matcha/10 flex items-center justify-center text-matcha mb-3">
                  <Send size={16} />
                </div>
                <h4 className="font-semibold text-charcoal text-xs mb-1">Instant Digital Delivery</h4>
                <p className="text-[11px] text-charcoal-light leading-relaxed">
                  Sent directly to recipient's email address with redemption instructions.
                </p>
              </div>

              <div className="p-4 bg-white border border-sand-dark rounded-xl shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-espresso/5 flex items-center justify-center text-espresso mb-3">
                  <Clock size={16} />
                </div>
                <h4 className="font-semibold text-charcoal text-xs mb-1">100% Stored Value</h4>
                <p className="text-[11px] text-charcoal-light leading-relaxed">
                  Can be used across multiple orders until the balance is fully exhausted.
                </p>
              </div>
            </div>

            {/* Wallet Link Banner */}
            <div className="p-5 bg-sand-light border border-sand-dark rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-charcoal">Already have a Gift Card?</p>
                <p className="text-xs text-charcoal-light mt-0.5">Check balance or claim it into your wallet</p>
              </div>
              <Link 
                to="/account/gift-cards"
                className="px-3.5 py-2 bg-white text-espresso text-xs font-semibold rounded-lg border border-sand-dark hover:bg-sand-light transition-colors shrink-0"
              >
                Go to Wallet →
              </Link>
            </div>

          </div>

          {/* Right Column: Customization & Purchase Form */}
          <div className="lg:col-span-7 bg-white border border-sand-dark rounded-2xl p-6 md:p-10 shadow-xs">
            <form onSubmit={handlePurchase} className="space-y-7">
              
              {/* Step 1: Select Denomination */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-3">
                  1. Select Amount
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {DENOMINATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setAmount(d)}
                      className={`py-3.5 px-3 rounded-xl border text-sm font-semibold transition-all ${
                        amount === d
                          ? 'border-espresso bg-espresso text-cream shadow-sm scale-[1.02]'
                          : 'border-sand-dark bg-[#FAF8F5] text-charcoal hover:border-charcoal/40 hover:bg-white'
                      }`}
                    >
                      ₹{d.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Recipient Details */}
              <div className="pt-2 border-t border-sand-dark/40 space-y-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal">
                  2. Recipient Information
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-charcoal-light mb-1.5">Recipient's Name</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g., Jane Doe"
                      className="w-full px-4 py-3 text-sm bg-sand-light/40 border border-sand-dark rounded-xl focus:outline-none focus:ring-1 focus:ring-espresso focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-charcoal-light mb-1.5">
                      Recipient's Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full px-4 py-3 text-sm bg-sand-light/40 border border-sand-dark rounded-xl focus:outline-none focus:ring-1 focus:ring-espresso focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Sender Details & Message */}
              <div className="pt-2 border-t border-sand-dark/40 space-y-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal">
                  3. Personal Touch
                </label>

                <div>
                  <label className="block text-xs text-charcoal-light mb-1.5">Your Name (Sender)</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g., Alex Smith"
                    className="w-full px-4 py-3 text-sm bg-sand-light/40 border border-sand-dark rounded-xl focus:outline-none focus:ring-1 focus:ring-espresso focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs text-charcoal-light mb-1.5">Personal Message (Optional)</label>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    placeholder="Wishing you sweet moments and delicious treats!"
                    className="w-full px-4 py-3 text-sm bg-sand-light/40 border border-sand-dark rounded-xl focus:outline-none focus:ring-1 focus:ring-espresso focus:bg-white resize-none transition-all"
                  />
                  <p className="text-[11px] text-charcoal-light text-right mt-1">
                    {personalMessage.length}/300
                  </p>
                </div>
              </div>

              {/* Purchase CTA */}
              <div className="pt-4 border-t border-sand-dark/40">
                <button
                  type="submit"
                  disabled={loading || !recipientEmail.trim()}
                  className="w-full py-4 px-8 bg-espresso text-cream text-sm font-semibold rounded-full uppercase tracking-widest hover:bg-charcoal transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Processing Purchase...</span>
                    </>
                  ) : (
                    <>
                      <Gift size={16} />
                      <span>PURCHASE GIFT CARD (₹{amount.toLocaleString('en-IN')})</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-charcoal-light text-center mt-3">
                  Instant activation upon checkout. Stored value never expires.
                </p>
              </div>

            </form>
          </div>

        </div>

        {/* FAQ / Trust Section */}
        <div className="mt-24 pt-16 border-t border-sand-dark/50">
          <h3 className="text-2xl font-serif text-charcoal text-center mb-10">Frequently Asked Questions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white border border-sand-dark rounded-2xl shadow-xs">
              <h4 className="font-semibold text-charcoal text-sm mb-2">How does redemption work?</h4>
              <p className="text-xs text-charcoal-light leading-relaxed">
                Recipients receive a unique 16-character code (e.g., GC-XXXX-XXXX-XXXX). They can either claim it to their account wallet or enter it directly in checkout.
              </p>
            </div>

            <div className="p-6 bg-white border border-sand-dark rounded-2xl shadow-xs">
              <h4 className="font-semibold text-charcoal text-sm mb-2">Can it be used partially?</h4>
              <p className="text-xs text-charcoal-light leading-relaxed">
                Yes! Any remaining balance stays stored on the card and will be automatically applied to future orders whenever used.
              </p>
            </div>

            <div className="p-6 bg-white border border-sand-dark rounded-2xl shadow-xs">
              <h4 className="font-semibold text-charcoal text-sm mb-2">Do gift cards expire?</h4>
              <p className="text-xs text-charcoal-light leading-relaxed">
                Glacé Gift Cards carry a generous 1-year validity from activation date, giving the recipient plenty of time to explore all our seasonal flavors.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Purchase Success Modal */}
      {purchaseSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full p-8 md:p-10 shadow-2xl border border-sand-dark text-center relative overflow-hidden"
          >
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <CheckCircle2 size={32} />
            </div>

            <span className="text-xs font-mono uppercase tracking-widest text-emerald-800 font-semibold bg-emerald-50 px-3 py-1 rounded-full">
              Payment Confirmed • Card Active
            </span>

            <h2 className="text-2xl md:text-3xl font-serif text-charcoal mt-3 mb-2">
              Gift Card Purchased Successfully!
            </h2>
            <p className="text-xs text-charcoal-light max-w-sm mx-auto mb-6">
              Order #{purchaseSuccess.orderNumber} has been processed and your gift card is ready.
            </p>

            {/* Card Details Box */}
            <div className="p-5 bg-sand-light/60 border border-sand-dark rounded-2xl text-left space-y-3 mb-8">
              <div className="flex justify-between items-center text-xs">
                <span className="text-charcoal-light">Amount:</span>
                <span className="font-serif font-bold text-charcoal text-base">₹{purchaseSuccess.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-charcoal-light">Recipient:</span>
                <span className="font-semibold text-charcoal">{purchaseSuccess.recipientName} ({purchaseSuccess.recipientEmail})</span>
              </div>
              {purchaseSuccess.code && (
                <div className="flex justify-between items-center text-xs pt-2 border-t border-sand-dark/40">
                  <span className="text-charcoal-light">Gift Card Code:</span>
                  <span className="font-mono font-bold text-espresso tracking-wider bg-white px-2.5 py-1 rounded-lg border border-sand-dark">
                    {purchaseSuccess.code}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                to="/account/gift-cards"
                className="w-full py-3.5 px-6 bg-espresso text-cream text-xs font-semibold uppercase tracking-widest rounded-xl hover:bg-charcoal transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>View in Wallet</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                to="/shop"
                className="block w-full py-3 px-6 text-charcoal text-xs font-semibold uppercase tracking-widest rounded-xl hover:bg-sand-light transition-all"
              >
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default GiftCards;
