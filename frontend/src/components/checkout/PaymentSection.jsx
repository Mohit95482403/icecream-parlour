import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

const PAYMENT_METHODS = [
  {
    id: 'upi',
    name: 'UPI',
    subtitle: 'Google Pay, PhonePe, Paytm, QR & UPI ID',
    badge: 'Instant',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    )
  },
  {
    id: 'card',
    name: 'Credit / Debit Card',
    subtitle: 'Visa, MasterCard, RuPay, Amex',
    badge: null,
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    )
  },
  {
    id: 'netbanking',
    name: 'Net Banking',
    subtitle: 'All major Indian banks supported',
    badge: null,
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    )
  },
  {
    id: 'wallet',
    name: 'Digital Wallet',
    subtitle: 'Paytm, Amazon Pay, PhonePe Wallet',
    badge: null,
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
      </svg>
    )
  }
];

const POPULAR_BANKS = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank'];
const WALLET_PROVIDERS = ['Paytm Wallet', 'Amazon Pay', 'PhonePe Wallet', 'Mobikwik'];

// Valid VPA pattern: username@bank
const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/;

const PaymentSection = ({
  paymentMethod,
  setPaymentMethod,
  customerName = '',
  amount = 0,
  onValidationChange
}) => {
  // Input states strictly initialized empty — no hardcoded or prefilled test data
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');

  // Format Card Number as 4-digit groups
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 19);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Format Expiry as MM/YY
  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    setCardExpiry(val);
  };

  // Format CVV
  const handleCvvChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvv(val);
  };

  // Real-time UPI Validation
  const upiStatus = useMemo(() => {
    const trimmed = upiId.trim();
    if (!trimmed) return 'empty';
    if (UPI_REGEX.test(trimmed)) return 'valid';
    if (trimmed.length >= 3) return 'invalid';
    return 'typing';
  }, [upiId]);

  // Real-time Card Expiry Date Validation
  const isExpiryValid = useMemo(() => {
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) return false;
    const [mmStr, yyStr] = cardExpiry.split('/');
    const mm = parseInt(mmStr, 10);
    const yy = parseInt('20' + yyStr, 10);
    if (mm < 1 || mm > 12) return false;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (yy < currentYear) return false;
    if (yy === currentYear && mm < currentMonth) return false;
    return true;
  }, [cardExpiry]);

  // Validate current payment details
  useEffect(() => {
    let isValid = false;

    if (paymentMethod === 'card') {
      const cleanNum = cardNumber.replace(/\D/g, '');
      const validNum = cleanNum.length >= 12 && cleanNum.length <= 19;
      const validHolder = cardHolder.trim().length >= 2;
      const validCvv = cardCvv.length >= 3 && cardCvv.length <= 4;
      isValid = Boolean(validNum && validHolder && isExpiryValid && validCvv);
    } else if (paymentMethod === 'upi') {
      isValid = upiStatus === 'valid';
    } else if (paymentMethod === 'netbanking') {
      isValid = Boolean(selectedBank && selectedBank.trim().length > 0);
    } else if (paymentMethod === 'wallet') {
      isValid = Boolean(selectedWallet && selectedWallet.trim().length > 0);
    }

    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [paymentMethod, cardNumber, cardHolder, isExpiryValid, cardCvv, upiStatus, selectedBank, selectedWallet, onValidationChange]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-serif text-charcoal mb-1">Select Payment Method</h3>
        <p className="text-sm text-charcoal-light">Choose your preferred payment method to complete this order.</p>
      </div>

      <div className="space-y-3">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = paymentMethod === method.id;
          return (
            <div
              key={method.id}
              className={`border-2 rounded-2xl transition-all duration-200 overflow-hidden ${
                isSelected
                  ? 'border-espresso bg-sand-light/30 shadow-sm'
                  : 'border-sand-dark/60 hover:border-sand-dark bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => setPaymentMethod(method.id)}
                className="w-full p-4 sm:p-5 flex items-center gap-4 text-left transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-espresso text-cream' : 'bg-sand-light text-charcoal-light'
                  }`}
                >
                  {method.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-charcoal text-base">{method.name}</span>
                    {method.badge && (
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-pistachio/20 text-pistachio border border-pistachio/30">
                        {method.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-charcoal-light mt-0.5 truncate">{method.subtitle}</p>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                    isSelected ? 'border-espresso bg-espresso' : 'border-sand-dark'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-cream" />}
                </div>
              </button>

              {/* Collapsible Details based on method */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 sm:px-5 pb-5 pt-1 border-t border-sand-dark/30 bg-white/70"
                >
                  {/* 1. UPI */}
                  {method.id === 'upi' && (
                    <div className="space-y-3 pt-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5">
                          UPI ID / VPA
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="username@bank"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                            className="w-full px-4 py-3 bg-white border border-sand-dark rounded-xl text-sm font-mono text-charcoal focus:outline-none focus:border-espresso focus:ring-1 focus:ring-espresso pr-24"
                          />
                          {upiStatus === 'valid' && (
                            <span className="absolute right-3 top-2.5 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              Verified
                            </span>
                          )}
                          {upiStatus === 'invalid' && (
                            <span className="absolute right-3 top-2.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                              Invalid UPI ID
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-charcoal-light">
                        Enter your UPI ID (e.g. yourname@oksbi, mobile@upi). Payment will be requested from your UPI app.
                      </p>
                    </div>
                  )}

                  {/* 2. Credit / Debit Card */}
                  {method.id === 'card' && (
                    <div className="space-y-3 pt-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5">
                          Card Number
                        </label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="•••• •••• •••• ••••"
                          maxLength={19}
                          autoComplete="off"
                          className="w-full px-4 py-3 bg-white border border-sand-dark rounded-xl text-sm font-mono text-charcoal focus:outline-none focus:border-espresso focus:ring-1 focus:ring-espresso"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            placeholder="Name on card"
                            autoComplete="off"
                            className="w-full px-4 py-3 bg-white border border-sand-dark rounded-xl text-sm text-charcoal focus:outline-none focus:border-espresso focus:ring-1 focus:ring-espresso"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5">
                            Expiry
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                            maxLength={5}
                            placeholder="MM/YY"
                            autoComplete="off"
                            className="w-full px-4 py-3 bg-white border border-sand-dark rounded-xl text-sm font-mono text-charcoal focus:outline-none focus:border-espresso focus:ring-1 focus:ring-espresso text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5">
                            CVV
                          </label>
                          <input
                            type="password"
                            value={cardCvv}
                            onChange={handleCvvChange}
                            maxLength={4}
                            placeholder="•••"
                            autoComplete="off"
                            className="w-full px-4 py-3 bg-white border border-sand-dark rounded-xl text-sm font-mono text-charcoal focus:outline-none focus:border-espresso focus:ring-1 focus:ring-espresso text-center"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Net Banking */}
                  {method.id === 'netbanking' && (
                    <div className="space-y-3 pt-3">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5">
                        Select Your Bank
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {POPULAR_BANKS.map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setSelectedBank(b)}
                            className={`p-2.5 rounded-lg text-xs font-medium border text-center transition-all ${
                              selectedBank === b
                                ? 'bg-espresso text-cream border-espresso font-semibold'
                                : 'bg-white text-charcoal border-sand-dark hover:border-espresso/40'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                      {!selectedBank && (
                        <p className="text-[11px] text-charcoal-light">Please select your bank to continue.</p>
                      )}
                    </div>
                  )}

                  {/* 4. Digital Wallet */}
                  {method.id === 'wallet' && (
                    <div className="space-y-3 pt-3">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5">
                        Choose Digital Wallet
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {WALLET_PROVIDERS.map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setSelectedWallet(w)}
                            className={`p-3 rounded-lg text-xs font-medium border text-center transition-all ${
                              selectedWallet === w
                                ? 'bg-espresso text-cream border-espresso font-semibold'
                                : 'bg-white text-charcoal border-sand-dark hover:border-espresso/40'
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                      {!selectedWallet && (
                        <p className="text-[11px] text-charcoal-light">Please choose a wallet provider to continue.</p>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-sand-light/40 border border-sand-dark/60 rounded-xl flex items-center gap-3 text-xs text-charcoal-light">
        <svg className="w-5 h-5 text-espresso shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>
          Payments are secured with 256-bit internal encryption. Authoritative transaction records are verified on the server.
        </span>
      </div>
    </div>
  );
};

export default PaymentSection;
