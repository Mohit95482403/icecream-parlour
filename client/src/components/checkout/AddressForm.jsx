import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { MapPin, Check, Plus, Edit2 } from 'lucide-react';

const AddressForm = ({ 
  address, setAddress, 
  savedAddresses = [], 
  isUsingSavedAddress, setIsUsingSavedAddress,
  saveAddressForFuture, setSaveAddressForFuture,
  nextStep, prevStep, errors, setErrors, checkDelivery, deliveryInfo 
}) => {
  const typingTimer = useRef(null);
  const { isAuthenticated, user } = useAuth();
  
  // Local state to toggle showing the list of addresses
  const [showAddressList, setShowAddressList] = useState(
    isAuthenticated && savedAddresses.length > 0 && !isUsingSavedAddress
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    
    // Automatically check delivery if postal code is exactly 6 digits
    if (name === 'postalCode') {
      const sanitized = value.replace(/\D/g, '');
      if (sanitized !== value) {
        setAddress(prev => ({ ...prev, postalCode: sanitized }));
      }
      
      clearTimeout(typingTimer.current);
      if (sanitized.length === 6) {
        typingTimer.current = setTimeout(() => {
          checkDelivery(sanitized);
        }, 500); // debounce check
      }
    }
  };

  const validate = () => {
    let isValid = true;
    const newErrors = { ...errors };

    if (!address.addressLine1?.trim()) {
      newErrors.addressLine1 = 'Address line 1 is required';
      isValid = false;
    }
    if (!address.city?.trim()) {
      newErrors.city = 'City is required';
      isValid = false;
    }
    if (!address.state?.trim()) {
      newErrors.state = 'State is required';
      isValid = false;
    }
    if (!address.postalCode?.trim() || address.postalCode.length !== 6) {
      newErrors.postalCode = 'Valid 6-digit PIN code is required';
      isValid = false;
    }

    // Must have successfully checked delivery
    if (isValid && (!deliveryInfo || !deliveryInfo.serviceable)) {
      newErrors.delivery = 'We cannot deliver to this address. Please change your PIN code.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (validate()) {
      nextStep();
    }
  };

  const selectSavedAddress = (savedAddress) => {
    setAddress({
      id: savedAddress.id,
      addressLine1: savedAddress.address_line_1,
      addressLine2: savedAddress.address_line_2 || '',
      landmark: savedAddress.landmark || '',
      city: savedAddress.city,
      state: savedAddress.state,
      postalCode: savedAddress.postal_code,
      country: savedAddress.country || 'India'
    });
    setIsUsingSavedAddress(true);
    setShowAddressList(false);
    checkDelivery(savedAddress.postal_code);
  };

  const startNewAddress = () => {
    setAddress({
      id: null,
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India'
    });
    setIsUsingSavedAddress(false);
    setShowAddressList(false);
    setSaveAddressForFuture(true); // Default to saving new addresses
  };

  const editCurrentAddress = () => {
    setIsUsingSavedAddress(false);
    setSaveAddressForFuture(true);
  };

  return (
    <div className="mb-10 animate-fade-in">
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl font-serif text-charcoal">Delivery Address</h2>
        {isAuthenticated && savedAddresses.length > 0 && !showAddressList && (
          <button 
            type="button" 
            onClick={() => setShowAddressList(true)}
            className="text-sm font-medium text-theme-primary hover:underline"
          >
            Saved Addresses
          </button>
        )}
      </div>
      
      {showAddressList ? (
        <div className="space-y-4 mb-6">
          <p className="text-sm text-charcoal/70 mb-4">Select a saved address or add a new one.</p>
          
          <div className="grid gap-4">
            {savedAddresses.map((addr) => (
              <div 
                key={addr.id} 
                onClick={() => selectSavedAddress(addr)}
                className={`p-4 border rounded-xl cursor-pointer transition-colors ${
                  address.id === addr.id 
                    ? 'border-theme-primary bg-theme-primary/5' 
                    : 'border-warm-taupe/30 bg-white hover:border-warm-taupe'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-charcoal">{addr.full_name}</h4>
                      {addr.is_default ? (
                         <span className="text-[10px] uppercase tracking-wider bg-theme-primary text-white px-2 py-0.5 rounded-full">Default</span>
                      ) : null}
                    </div>
                    <p className="text-sm text-charcoal/70 mt-1">{addr.address_line_1}</p>
                    {addr.address_line_2 && <p className="text-sm text-charcoal/70">{addr.address_line_2}</p>}
                    <p className="text-sm text-charcoal/70">{addr.city}, {addr.state} {addr.postal_code}</p>
                  </div>
                  {address.id === addr.id && (
                    <div className="w-6 h-6 rounded-full bg-theme-primary text-white flex items-center justify-center">
                      <Check size={14} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <button
            type="button"
            onClick={startNewAddress}
            className="w-full mt-4 flex items-center justify-center gap-2 py-4 border border-dashed border-warm-taupe text-charcoal font-medium rounded-xl hover:bg-warm-taupe/5 transition-colors"
          >
            <Plus size={18} />
            Add New Address
          </button>
        </div>
      ) : isUsingSavedAddress ? (
        <div className="mb-6">
          <div className="p-6 border border-theme-primary bg-theme-primary/5 rounded-xl relative">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <MapPin size={20} className="text-theme-primary" />
                <h3 className="font-medium text-lg text-charcoal">Using Saved Address</h3>
              </div>
              <button 
                type="button" 
                onClick={editCurrentAddress}
                className="text-sm flex items-center gap-1 text-charcoal/70 hover:text-charcoal transition-colors"
              >
                <Edit2 size={14} />
                Edit
              </button>
            </div>
            
            <div className="pl-7 space-y-1 text-charcoal/80">
              <p>{address.addressLine1}</p>
              {address.addressLine2 && <p>{address.addressLine2}</p>}
              <p>{address.city}, {address.state} {address.postalCode}</p>
              <p>{address.country}</p>
            </div>

            {deliveryInfo && deliveryInfo.serviceable && !errors.delivery && (
              <div className="mt-4 pl-7">
                <p className="text-green-600 flex items-center gap-1 font-medium text-sm">
                  <Check size={16} />
                  Delivery available in approx. {deliveryInfo.estimatedMinutes} mins
                </p>
              </div>
            )}
            
            {errors.delivery && (
               <div className="mt-4 pl-7">
                 <p className="text-red-500 font-medium text-sm">{errors.delivery}</p>
               </div>
            )}
          </div>
          
          <div className="pt-6 flex flex-col md:flex-row gap-4 items-center">
            <button
              type="button"
              onClick={prevStep}
              className="w-full md:w-auto px-6 py-4 text-charcoal font-medium hover:text-espresso transition-colors"
            >
              Back to Customer
            </button>
            
            <button
              type="button"
              onClick={handleContinue}
              className="w-full md:w-auto px-8 py-4 bg-espresso text-cream font-medium rounded-full hover:bg-charcoal transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-espresso"
            >
              Continue to Review
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleContinue} className="space-y-5">
          {/* Postal Code with Status Indicator */}
          <div className="relative">
            <label htmlFor="postalCode" className="block text-sm font-medium text-charcoal mb-2">PIN Code *</label>
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              value={address.postalCode}
              onChange={handleChange}
              maxLength={6}
              className={`w-full md:w-1/2 px-4 py-3 rounded-lg border ${errors.postalCode || errors.delivery ? 'border-red-400 focus:ring-red-500' : 'border-sand-dark focus:ring-espresso'} bg-white text-charcoal focus:outline-none focus:ring-2 transition-colors`}
              placeholder="e.g. 422001"
              autoComplete="postal-code"
            />
            
            {/* Delivery Status Message */}
            <div className="mt-2 min-h-6 text-sm">
               {errors.postalCode && <p className="text-red-500">{errors.postalCode}</p>}
               {!errors.postalCode && errors.delivery && <p className="text-red-500 font-medium">{errors.delivery}</p>}
               {deliveryInfo && deliveryInfo.serviceable && !errors.delivery && (
                  <p className="text-green-600 flex items-center gap-1 font-medium">
                    <Check size={16} />
                    Delivery available in approx. {deliveryInfo.estimatedMinutes} mins
                  </p>
               )}
            </div>
          </div>

          <div>
            <label htmlFor="addressLine1" className="block text-sm font-medium text-charcoal mb-2">Address Line 1 (Flat, House no., Building) *</label>
            <input
              type="text"
              id="addressLine1"
              name="addressLine1"
              value={address.addressLine1}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border ${errors.addressLine1 ? 'border-red-400 focus:ring-red-500' : 'border-sand-dark focus:ring-espresso'} bg-white text-charcoal focus:outline-none focus:ring-2 transition-colors`}
              autoComplete="address-line1"
            />
            {errors.addressLine1 && <p className="mt-1 text-sm text-red-500">{errors.addressLine1}</p>}
          </div>

          <div>
            <label htmlFor="addressLine2" className="block text-sm font-medium text-charcoal mb-2">Address Line 2 (Area, Street, Sector) - Optional</label>
            <input
              type="text"
              id="addressLine2"
              name="addressLine2"
              value={address.addressLine2}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-sand-dark bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-espresso transition-colors"
              autoComplete="address-line2"
            />
          </div>

          <div>
            <label htmlFor="landmark" className="block text-sm font-medium text-charcoal mb-2">Landmark - Optional</label>
            <input
              type="text"
              id="landmark"
              name="landmark"
              value={address.landmark}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-sand-dark bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-espresso transition-colors"
              placeholder="e.g. Near Apollo Hospital"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-charcoal mb-2">City *</label>
              <input
                type="text"
                id="city"
                name="city"
                value={address.city}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${errors.city ? 'border-red-400 focus:ring-red-500' : 'border-sand-dark focus:ring-espresso'} bg-white text-charcoal focus:outline-none focus:ring-2 transition-colors`}
                autoComplete="address-level2"
              />
              {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
            </div>
            
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-charcoal mb-2">State *</label>
              <input
                type="text"
                id="state"
                name="state"
                value={address.state}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${errors.state ? 'border-red-400 focus:ring-red-500' : 'border-sand-dark focus:ring-espresso'} bg-white text-charcoal focus:outline-none focus:ring-2 transition-colors`}
                autoComplete="address-level1"
              />
              {errors.state && <p className="mt-1 text-sm text-red-500">{errors.state}</p>}
            </div>
          </div>

          {isAuthenticated && (
            <div className="mt-4 flex items-center">
              <input
                id="saveAddressForFuture"
                name="saveAddressForFuture"
                type="checkbox"
                checked={saveAddressForFuture}
                onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                className="h-4 w-4 text-espresso focus:ring-espresso border-sand-dark rounded"
              />
              <label htmlFor="saveAddressForFuture" className="ml-2 block text-sm text-charcoal">
                Save this address for future orders
              </label>
            </div>
          )}

          <div className="pt-6 flex flex-col md:flex-row gap-4 items-center">
            <button
              type="button"
              onClick={prevStep}
              className="w-full md:w-auto px-6 py-4 text-charcoal font-medium hover:text-espresso transition-colors"
            >
              Back to Customer
            </button>
            
            <button
              type="submit"
              className="w-full md:w-auto px-8 py-4 bg-espresso text-cream font-medium rounded-full hover:bg-charcoal transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-espresso"
            >
              Continue to Review
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddressForm;
