import React from 'react';
import PaymentSection from './PaymentSection';
import GiftCardSection from './GiftCardSection';
import { Gift, CheckCircle2 } from 'lucide-react';

const CheckoutReview = ({
  customer,
  address,
  paymentMethod,
  setPaymentMethod,
  isPaymentValid = false,
  setIsPaymentValid,
  pricing,
  createAndPayOrder,
  loading,
  prevStep,
  goToStep,
  cartIssues = [],
  paymentError = null,
  retryOrder = null,
  handleRetryPayment = null,
  appliedGiftCard = null,
  giftCardCode = '',
  setGiftCardCode = () => {},
  handleApplyGiftCard = () => {},
  removeGiftCard = () => {},
  giftCardLoading = false,
  giftCardError = null,
  isGiftOrder = false,
  giftRecipient = {},
  giftMessage = ''
}) => {
  const hasBlockingIssues = cartIssues.some((i) =>
    ['OUT_OF_STOCK', 'INSUFFICIENT_STOCK', 'UNAVAILABLE', 'PRODUCT_NOT_FOUND'].includes(i.code)
  );

  // Authoritative Grand Total calculation
  const subtotal = parseFloat(pricing?.subtotal) || 0;
  const deliveryFee = parseFloat(pricing?.deliveryFee) || 0;
  const discount = parseFloat(pricing?.discount) || 0;
  const giftCardDeduction = parseFloat(pricing?.giftCardDeduction) || 0;
  const grandTotal = pricing?.grandTotal !== undefined
    ? pricing.grandTotal
    : Math.max(0, Math.round((subtotal + deliveryFee - discount - giftCardDeduction) * 100) / 100);

  const isFullyCoveredByGiftCard = grandTotal === 0 && appliedGiftCard && giftCardDeduction > 0;
  const customerFullName = `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim();
  const isPayDisabled = loading || hasBlockingIssues || (!isFullyCoveredByGiftCard && (grandTotal < 0 || !isPaymentValid));

  return (
    <div className="mb-10 animate-fade-in space-y-8">
      {/* 1. Review Summary Cards */}
      <div>
        <h2 className="text-2xl font-serif text-charcoal mb-4">Review Order Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Customer Summary */}
          <div className="p-5 bg-white border border-sand-dark rounded-xl flex justify-between items-start shadow-xs">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-light mb-1">Customer</p>
              <p className="font-semibold text-charcoal text-sm">{customerFullName || 'Guest'}</p>
              <p className="text-charcoal-light text-xs mt-0.5">{customer.email}</p>
              <p className="text-charcoal-light text-xs">{customer.phone}</p>
            </div>
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="text-xs font-semibold text-espresso hover:underline uppercase tracking-wider"
            >
              Edit
            </button>
          </div>

          {/* Delivery / Gift Recipient Summary */}
          {isGiftOrder ? (
            <div className="p-5 bg-white border-2 border-espresso/20 rounded-xl flex justify-between items-start shadow-xs">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Gift size={14} className="text-espresso" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-espresso">Gift Delivery Recipient</p>
                </div>
                <p className="text-charcoal text-sm font-semibold">{giftRecipient.name}</p>
                <p className="text-charcoal-light text-xs mt-0.5">{giftRecipient.phone}</p>
                <p className="text-charcoal text-xs mt-1">{giftRecipient.address}</p>
                <p className="text-charcoal-light text-xs">
                  {giftRecipient.city}, {giftRecipient.state} - {giftRecipient.postalCode}
                </p>
                {giftMessage && (
                  <div className="mt-2.5 p-2 bg-amber-50/60 border border-amber-200/60 rounded text-xs text-charcoal italic">
                    "{giftMessage}"
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="text-xs font-semibold text-espresso hover:underline uppercase tracking-wider shrink-0 ml-2"
              >
                Edit
              </button>
            </div>
          ) : (
            <div className="p-5 bg-white border border-sand-dark rounded-xl flex justify-between items-start shadow-xs">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-light mb-1">Delivery Address</p>
                <p className="text-charcoal text-sm font-medium">{address.addressLine1}</p>
                {address.addressLine2 && <p className="text-charcoal-light text-xs">{address.addressLine2}</p>}
                <p className="text-charcoal-light text-xs">
                  {address.city}, {address.state} - {address.postalCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="text-xs font-semibold text-espresso hover:underline uppercase tracking-wider"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Gift Card Redemption Section */}
      <div>
        <GiftCardSection
          appliedGiftCard={appliedGiftCard}
          giftCardCode={giftCardCode}
          setGiftCardCode={setGiftCardCode}
          handleApplyGiftCard={handleApplyGiftCard}
          removeGiftCard={removeGiftCard}
          giftCardLoading={giftCardLoading}
          giftCardError={giftCardError}
          currentPayableAmount={subtotal + deliveryFee - discount}
        />
      </div>

      {/* 3. Payment Section */}
      {isFullyCoveredByGiftCard ? (
        <div className="p-5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-3">
          <CheckCircle2 size={22} className="text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-emerald-900 text-sm">Fully Covered by Gift Card</h4>
            <p className="text-xs text-emerald-700 mt-1">
              Your gift card covers 100% of this order total (₹{giftCardDeduction.toLocaleString('en-IN')}). No additional payment method is required.
            </p>
          </div>
        </div>
      ) : (
        <div className="pt-2">
          <PaymentSection
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            customerName={customerFullName}
            amount={grandTotal}
            onValidationChange={setIsPaymentValid}
          />
        </div>
      )}

      {/* Error Banner */}
      {paymentError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold">Payment Failed</p>
            <p className="text-xs mt-0.5">{paymentError}</p>
          </div>
        </div>
      )}

      {/* 4. Action Buttons */}
      <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center">
        <button
          type="button"
          onClick={prevStep}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-4 text-charcoal font-medium text-sm hover:text-espresso transition-colors disabled:opacity-50"
        >
          ← Back to Delivery
        </button>

        {retryOrder ? (
          <button
            type="button"
            onClick={handleRetryPayment}
            disabled={isPayDisabled}
            className="w-full sm:flex-1 py-4 px-8 bg-espresso text-cream text-sm font-semibold rounded-full uppercase tracking-widest hover:bg-charcoal transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <span>Retry Payment (₹{grandTotal.toLocaleString('en-IN')})</span>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={createAndPayOrder}
            disabled={isPayDisabled}
            className="w-full sm:flex-1 py-4 px-8 bg-espresso text-cream text-sm font-semibold rounded-full uppercase tracking-widest hover:bg-charcoal transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                <span>Processing Order...</span>
              </>
            ) : hasBlockingIssues ? (
              <span>Please Fix Cart Issues</span>
            ) : isFullyCoveredByGiftCard ? (
              <>
                <Gift size={16} />
                <span>CONFIRM ORDER (100% GIFT CARD)</span>
              </>
            ) : !isPaymentValid ? (
              <span>Enter Valid Payment Details</span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>PAY ₹{grandTotal.toLocaleString('en-IN')}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default CheckoutReview;
