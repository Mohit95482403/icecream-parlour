import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCheckout } from '../hooks/useCheckout';
import OrderSummary from '../components/checkout/OrderSummary';
import CustomerInformation from '../components/checkout/CustomerInformation';
import AddressForm from '../components/checkout/AddressForm';
import GiftOrderSection from '../components/checkout/GiftOrderSection';
import CheckoutReview from '../components/checkout/CheckoutReview';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';

const Checkout = () => {
  const { items: cartItems } = useCart();
  const checkout = useCheckout();

  // If cart is empty and order is not yet placed, show graceful empty cart UI
  if (cartItems.length === 0 && !checkout.isOrderPlaced) {
    return (
      <div className="min-h-[75vh] bg-[#FDFBF7] pt-32 pb-24 flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-md text-center">
          <div className="w-20 h-20 bg-espresso/5 rounded-full flex items-center justify-center text-espresso mx-auto mb-6">
            <ShoppingBag size={32} strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-3xl text-charcoal mb-3">Your Scoop Bag is Empty</h1>
          <p className="text-sm text-charcoal-light mb-8 leading-relaxed">
            There are no items in your cart to checkout. Explore our handcrafted artisanal gelato and seasonal flavors.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-espresso text-cream text-xs font-semibold uppercase tracking-widest rounded-full hover:bg-charcoal transition-all shadow-sm"
          >
            <span>Explore Flavours</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Header / Logo */}
        <div className="flex justify-center mb-10 md:mb-16">
          <span className="text-2xl font-serif tracking-widest text-charcoal uppercase">Glacé</span>
        </div>

        {/* Global Prepare Error */}
        {checkout.errors.prepare && checkout.step === 3 && (
           <div className="max-w-4xl mx-auto mb-8 p-4 bg-red-50 text-red-700 rounded-md border border-red-100 flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                 <p className="font-semibold">Unable to process checkout</p>
                 <p className="text-sm mt-1">{checkout.errors.prepare}</p>
              </div>
           </div>
        )}

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          {/* Left Column - Forms */}
          <div className="lg:w-3/5">
            
            {/* Checkout Progress Indicator */}
            <div className="flex items-center text-sm font-medium text-charcoal-light mb-10 pb-4 border-b border-sand-dark overflow-x-auto whitespace-nowrap">
              <button 
                onClick={() => checkout.goToStep(1)} 
                className={`${checkout.step >= 1 ? 'text-charcoal font-semibold' : ''} hover:text-charcoal transition-colors`}
              >
                1. Customer
              </button>
              <span className="mx-3 text-sand-dark">›</span>
              <button 
                onClick={() => checkout.step > 1 && checkout.goToStep(2)} 
                className={`${checkout.step >= 2 ? 'text-charcoal font-semibold' : ''} ${checkout.step > 1 ? 'hover:text-charcoal cursor-pointer' : 'cursor-default'} transition-colors`}
              >
                2. Delivery
              </button>
              <span className="mx-3 text-sand-dark">›</span>
              <span className={`${checkout.step >= 3 ? 'text-charcoal font-semibold' : ''}`}>
                3. Payment & Review
              </span>
            </div>

            {/* Form Steps container with animation */}
            <AnimatePresence mode="wait">
              {checkout.step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <CustomerInformation 
                    customer={checkout.customer} 
                    setCustomer={checkout.setCustomer} 
                    nextStep={checkout.nextStep} 
                    errors={checkout.errors}
                    setErrors={checkout.setErrors}
                  />
                </motion.div>
              )}
              {checkout.step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <AddressForm 
                    address={checkout.address} 
                    setAddress={checkout.setAddress}
                    savedAddresses={checkout.savedAddresses}
                    isUsingSavedAddress={checkout.isUsingSavedAddress}
                    setIsUsingSavedAddress={checkout.setIsUsingSavedAddress}
                    saveAddressForFuture={checkout.saveAddressForFuture}
                    setSaveAddressForFuture={checkout.setSaveAddressForFuture}
                    nextStep={checkout.nextStep}
                    prevStep={checkout.prevStep}
                    errors={checkout.errors}
                    setErrors={checkout.setErrors}
                    checkDelivery={checkout.checkDelivery}
                    deliveryInfo={checkout.deliveryInfo}
                  />
                  <GiftOrderSection
                    isGiftOrder={checkout.isGiftOrder}
                    setIsGiftOrder={checkout.setIsGiftOrder}
                    giftRecipient={checkout.giftRecipient}
                    setGiftRecipient={checkout.setGiftRecipient}
                    giftMessage={checkout.giftMessage}
                    setGiftMessage={checkout.setGiftMessage}
                    giftErrors={checkout.giftErrors}
                  />
                </motion.div>
              )}
              {checkout.step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <CheckoutReview 
                    customer={checkout.customer}
                    address={checkout.address}
                    paymentMethod={checkout.paymentMethod}
                    setPaymentMethod={checkout.setPaymentMethod}
                    isPaymentValid={checkout.isPaymentValid}
                    setIsPaymentValid={checkout.setIsPaymentValid}
                    pricing={checkout.pricing}
                    createAndPayOrder={checkout.createAndPayOrder}
                    handleRetryPayment={checkout.handleRetryPayment}
                    paymentError={checkout.paymentError}
                    retryOrder={checkout.retryOrder}
                    loading={checkout.loading}
                    prevStep={checkout.prevStep}
                    goToStep={checkout.goToStep}
                    cartIssues={checkout.cartIssues}
                    appliedGiftCard={checkout.appliedGiftCard}
                    giftCardCode={checkout.giftCardCode}
                    setGiftCardCode={checkout.setGiftCardCode}
                    handleApplyGiftCard={checkout.handleApplyGiftCard}
                    removeGiftCard={checkout.removeGiftCard}
                    giftCardLoading={checkout.giftCardLoading}
                    giftCardError={checkout.giftCardError}
                    isGiftOrder={checkout.isGiftOrder}
                    giftRecipient={checkout.giftRecipient}
                    giftMessage={checkout.giftMessage}
                  />
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:w-2/5">
            <OrderSummary 
              pricing={checkout.pricing}
              validatedItems={checkout.validatedItems}
              cartIssues={checkout.cartIssues}
              loading={checkout.loading}
              couponCode={checkout.couponCode}
              setCouponCode={checkout.setCouponCode}
              appliedCoupon={checkout.appliedCoupon}
              couponError={checkout.couponError}
              couponLoading={checkout.couponLoading}
              handleApplyCoupon={checkout.handleApplyCoupon}
              removeCoupon={checkout.removeCoupon}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
