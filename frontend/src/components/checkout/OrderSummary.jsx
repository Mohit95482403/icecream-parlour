import React from 'react';
import { motion } from 'framer-motion';
import { Tag, X, CheckCircle2 } from 'lucide-react';

const OrderSummary = ({ 
  pricing, 
  validatedItems, 
  cartIssues, 
  loading,
  couponCode,
  setCouponCode,
  appliedCoupon,
  couponError,
  couponLoading,
  handleApplyCoupon,
  removeCoupon
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-sand-light rounded-xl p-6 lg:p-8 sticky top-24">
      <h2 className="text-xl font-serif text-charcoal mb-6">Order Summary</h2>

      {/* Cart Issues Notification */}
      {cartIssues.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md text-sm border border-red-100">
          <p className="font-semibold mb-2">Attention needed:</p>
          <ul className="list-disc pl-5 space-y-1">
            {cartIssues.map((issue, idx) => (
              <li key={idx}>{issue.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Item List */}
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        {validatedItems.map((item, index) => (
          <div key={`${item.productId}-${item.variantId}-${index}`} className="flex justify-between items-start text-sm">
            <div className="flex-1 pr-4">
              <h4 className="font-medium text-charcoal">{item.productName}</h4>
              <p className="text-charcoal-light">{item.variantName}</p>
              <p className="text-charcoal-light mt-1">Qty: {item.quantity}</p>
            </div>
            <div className="font-medium text-charcoal">
              {formatCurrency(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      <div className="h-px bg-sand-dark/30 mb-6"></div>

      {/* Totals */}
      <div className="space-y-3 text-sm text-charcoal mb-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-sand-light/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
             <div className="w-5 h-5 border-2 border-espresso border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-medium">{formatCurrency(pricing.subtotal)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Delivery</span>
          <span className="font-medium">
            {pricing.deliveryFee === 0 ? 'Free' : formatCurrency(pricing.deliveryFee)}
          </span>
        </div>
        
        {pricing.discount > 0 && (
          <div className="flex justify-between text-espresso">
            <span>Discount</span>
            <span className="font-medium">-{formatCurrency(pricing.discount)}</span>
          </div>
        )}

        {pricing.giftCardDeduction > 0 && (
          <div className="flex justify-between text-emerald-800 font-medium">
            <span className="flex items-center gap-1.5">
              <span>Gift Card Balance</span>
            </span>
            <span>-{formatCurrency(pricing.giftCardDeduction)}</span>
          </div>
        )}


      </div>

      <div className="h-px bg-sand-dark/30 mb-6"></div>

      {/* Promo Code Section */}
      <div className="mb-6">
        {!appliedCoupon ? (
          <div className="flex flex-col gap-2 relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-light">
                  <Tag size={16} />
                </div>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Promo code"
                  className="w-full pl-9 pr-4 py-2 bg-white border border-champagne rounded-lg focus:border-espresso focus:ring-1 focus:ring-espresso outline-none text-sm uppercase tracking-wide"
                  disabled={couponLoading}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon(couponCode)}
                />
              </div>
              <button
                onClick={() => handleApplyCoupon(couponCode)}
                disabled={!couponCode.trim() || couponLoading}
                className="px-4 py-2 bg-charcoal text-white text-sm font-medium rounded-lg hover:bg-espresso disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {couponLoading ? 'Applying...' : 'Apply'}
              </button>
            </div>
            {couponError && (
              <p className="text-xs text-red-600 mt-1">{couponError}</p>
            )}
          </div>
        ) : (
          <div className="bg-matcha/10 border border-matcha/30 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-matcha" />
              <div>
                <p className="text-sm font-medium text-charcoal flex items-center gap-2">
                  <span className="tracking-widest uppercase">{appliedCoupon.code}</span>
                  <span className="text-xs font-normal text-matcha bg-white px-2 py-0.5 rounded-full border border-matcha/20">Applied</span>
                </p>
                <p className="text-xs text-charcoal-light mt-0.5">
                  {appliedCoupon.discount_type === 'free_delivery' 
                    ? 'Free delivery applied' 
                    : `Discount applied to order`}
                </p>
              </div>
            </div>
            <button 
              onClick={removeCoupon}
              className="p-1.5 text-charcoal-light hover:text-red-500 hover:bg-white rounded-md transition-colors"
              title="Remove coupon"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="h-px bg-sand-dark/30 mb-6"></div>

      <div className="flex justify-between items-center text-lg font-serif text-charcoal">
        <span>Total</span>
        <span>{formatCurrency(pricing.grandTotal || (pricing.subtotal + pricing.deliveryFee - pricing.discount))}</span>
      </div>
    </div>
  );
};

export default OrderSummary;
