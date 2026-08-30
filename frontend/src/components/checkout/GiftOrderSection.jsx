import React from 'react';
import { Gift, User, Heart, MapPin } from 'lucide-react';

const GiftOrderSection = ({
  isGiftOrder,
  setIsGiftOrder,
  giftRecipient,
  setGiftRecipient,
  giftMessage,
  setGiftMessage,
  giftErrors = {}
}) => {
  const handleRecipientChange = (field, value) => {
    setGiftRecipient(prev => ({ ...prev, [field]: value }));
  };

  const handleToggle = (isGift) => {
    setIsGiftOrder(isGift);
  };

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-1.5">
        <Gift size={20} className="text-espresso" />
        <h3 className="text-lg font-serif text-charcoal">Buying this for someone?</h3>
      </div>
      <p className="text-xs text-charcoal-light mb-5 ml-8">Make this order a special gift.</p>

      {/* Radio Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {/* Myself */}
        <button
          type="button"
          onClick={() => handleToggle(false)}
          className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
            !isGiftOrder
              ? 'border-espresso bg-espresso/[0.03] shadow-sm'
              : 'border-sand-dark bg-white hover:border-charcoal-light/40'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              !isGiftOrder ? 'border-espresso' : 'border-charcoal-light/40'
            }`}>
              {!isGiftOrder && <div className="w-2.5 h-2.5 rounded-full bg-espresso" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <User size={14} className="text-charcoal-light" />
                <span className="text-sm font-semibold text-charcoal">Myself</span>
              </div>
              <p className="text-xs text-charcoal-light leading-relaxed">
                Deliver to my saved/current address
              </p>
            </div>
          </div>
        </button>

        {/* Someone else */}
        <button
          type="button"
          onClick={() => handleToggle(true)}
          className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
            isGiftOrder
              ? 'border-espresso bg-espresso/[0.03] shadow-sm'
              : 'border-sand-dark bg-white hover:border-charcoal-light/40'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              isGiftOrder ? 'border-espresso' : 'border-charcoal-light/40'
            }`}>
              {isGiftOrder && <div className="w-2.5 h-2.5 rounded-full bg-espresso" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Heart size={14} className="text-rose-400" />
                <span className="text-sm font-semibold text-charcoal">Someone else</span>
              </div>
              <p className="text-xs text-charcoal-light leading-relaxed">
                Send this order directly to the recipient
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Recipient Form (only when "Someone else" is selected) */}
      {isGiftOrder && (
        <div className="animate-fade-in">
          <div className="p-5 sm:p-6 bg-white border border-sand-dark rounded-xl shadow-xs">
            <div className="flex items-center gap-2 mb-5">
              <MapPin size={16} className="text-espresso" />
              <h4 className="text-sm font-semibold text-charcoal uppercase tracking-wider">Gift Recipient</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Recipient Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-charcoal mb-1.5">
                  Recipient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={giftRecipient.name}
                  onChange={(e) => handleRecipientChange('name', e.target.value)}
                  placeholder="Enter recipient's full name"
                  maxLength={150}
                  className={`w-full px-4 py-3 border rounded-lg text-sm text-charcoal placeholder-charcoal-light/50 outline-none transition-colors focus:border-espresso focus:ring-1 focus:ring-espresso/20 ${
                    giftErrors.name ? 'border-red-400 bg-red-50/30' : 'border-sand-dark'
                  }`}
                />
                {giftErrors.name && <p className="text-xs text-red-500 mt-1">{giftErrors.name}</p>}
              </div>

              {/* Recipient Phone */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-charcoal mb-1.5">
                  Recipient Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={giftRecipient.phone}
                  onChange={(e) => handleRecipientChange('phone', e.target.value)}
                  placeholder="10-digit mobile number"
                  maxLength={15}
                  className={`w-full px-4 py-3 border rounded-lg text-sm text-charcoal placeholder-charcoal-light/50 outline-none transition-colors focus:border-espresso focus:ring-1 focus:ring-espresso/20 ${
                    giftErrors.phone ? 'border-red-400 bg-red-50/30' : 'border-sand-dark'
                  }`}
                />
                {giftErrors.phone && <p className="text-xs text-red-500 mt-1">{giftErrors.phone}</p>}
              </div>

              {/* Recipient Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-charcoal mb-1.5">
                  Recipient Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={giftRecipient.address}
                  onChange={(e) => handleRecipientChange('address', e.target.value)}
                  placeholder="Street address, building, area"
                  className={`w-full px-4 py-3 border rounded-lg text-sm text-charcoal placeholder-charcoal-light/50 outline-none transition-colors focus:border-espresso focus:ring-1 focus:ring-espresso/20 ${
                    giftErrors.address ? 'border-red-400 bg-red-50/30' : 'border-sand-dark'
                  }`}
                />
                {giftErrors.address && <p className="text-xs text-red-500 mt-1">{giftErrors.address}</p>}
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1.5">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={giftRecipient.city}
                  onChange={(e) => handleRecipientChange('city', e.target.value)}
                  placeholder="City"
                  className={`w-full px-4 py-3 border rounded-lg text-sm text-charcoal placeholder-charcoal-light/50 outline-none transition-colors focus:border-espresso focus:ring-1 focus:ring-espresso/20 ${
                    giftErrors.city ? 'border-red-400 bg-red-50/30' : 'border-sand-dark'
                  }`}
                />
                {giftErrors.city && <p className="text-xs text-red-500 mt-1">{giftErrors.city}</p>}
              </div>

              {/* State */}
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1.5">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={giftRecipient.state}
                  onChange={(e) => handleRecipientChange('state', e.target.value)}
                  placeholder="State"
                  className={`w-full px-4 py-3 border rounded-lg text-sm text-charcoal placeholder-charcoal-light/50 outline-none transition-colors focus:border-espresso focus:ring-1 focus:ring-espresso/20 ${
                    giftErrors.state ? 'border-red-400 bg-red-50/30' : 'border-sand-dark'
                  }`}
                />
                {giftErrors.state && <p className="text-xs text-red-500 mt-1">{giftErrors.state}</p>}
              </div>

              {/* Postal Code */}
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1.5">
                  Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={giftRecipient.postalCode}
                  onChange={(e) => handleRecipientChange('postalCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit PIN"
                  maxLength={6}
                  className={`w-full px-4 py-3 border rounded-lg text-sm text-charcoal placeholder-charcoal-light/50 outline-none transition-colors focus:border-espresso focus:ring-1 focus:ring-espresso/20 ${
                    giftErrors.postalCode ? 'border-red-400 bg-red-50/30' : 'border-sand-dark'
                  }`}
                />
                {giftErrors.postalCode && <p className="text-xs text-red-500 mt-1">{giftErrors.postalCode}</p>}
              </div>

              {/* Gift Message */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-charcoal mb-1.5">
                  Gift Message <span className="text-charcoal-light font-normal">(optional)</span>
                </label>
                <textarea
                  value={giftMessage}
                  onChange={(e) => {
                    if (e.target.value.length <= 300) setGiftMessage(e.target.value);
                  }}
                  placeholder="Wishing you a sweet day filled with delicious moments!"
                  rows={3}
                  maxLength={300}
                  className={`w-full px-4 py-3 border rounded-lg text-sm text-charcoal placeholder-charcoal-light/50 outline-none resize-none transition-colors focus:border-espresso focus:ring-1 focus:ring-espresso/20 ${
                    giftErrors.message ? 'border-red-400 bg-red-50/30' : 'border-sand-dark'
                  }`}
                />
                <div className="flex justify-between items-center mt-1">
                  {giftErrors.message ? (
                    <p className="text-xs text-red-500">{giftErrors.message}</p>
                  ) : <span />}
                  <span className={`text-xs ${giftMessage.length >= 280 ? 'text-amber-600 font-medium' : 'text-charcoal-light'}`}>
                    {giftMessage.length} / 300
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftOrderSection;
