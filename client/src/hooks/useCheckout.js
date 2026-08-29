import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import checkoutService from '../services/checkoutService';
import giftCardService from '../services/giftCardService';
import { useCart } from '../context/CartContext';
import { useAuth } from './useAuth';

export const useCheckout = () => {
  const { items: cartItems, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);

  // Form State
  const [customer, setCustomer] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const [address, setAddress] = useState({
    id: null,
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);
  const [isUsingSavedAddress, setIsUsingSavedAddress] = useState(false);

  const [deliveryMethod, setDeliveryMethod] = useState('delivery');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isPaymentValid, setIsPaymentValid] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [retryOrder, setRetryOrder] = useState(null);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Gift Card State
  const [giftCardCode, setGiftCardCode] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState(null);
  const [giftCardError, setGiftCardError] = useState(null);
  const [giftCardLoading, setGiftCardLoading] = useState(false);

  // Authoritative Pricing & Cart State from Server
  const [validatedItems, setValidatedItems] = useState([]);
  const [pricing, setPricing] = useState({
    subtotal: 0,
    deliveryFee: 0,
    tax: 0,
    discount: 0,
    giftCardDeduction: 0,
    grandTotal: 0
  });

  // UI State
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [cartIssues, setCartIssues] = useState([]);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [orderDraft, setOrderDraft] = useState(null);

  // Gift Order State
  const [isGiftOrder, setIsGiftOrderRaw] = useState(false);
  const [giftRecipient, setGiftRecipient] = useState({
    name: '', phone: '', address: '', city: '', state: '', postalCode: ''
  });
  const [giftMessage, setGiftMessage] = useState('');
  const [giftErrors, setGiftErrors] = useState({});

  // When toggling to "Myself", clear gift state
  const setIsGiftOrder = (val) => {
    setIsGiftOrderRaw(val);
    if (!val) {
      setGiftRecipient({ name: '', phone: '', address: '', city: '', state: '', postalCode: '' });
      setGiftMessage('');
      setGiftErrors({});
    }
  };

  const [couponError, setCouponError] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  /**
   * Helper: calculate grand total from components
   */
  const calcGrandTotal = (subtotal, deliveryFee, discount, giftCardDeduction = 0) => {
    const s = parseFloat(subtotal) || 0;
    const d = parseFloat(deliveryFee) || 0;
    const disc = parseFloat(discount) || 0;
    const gc = parseFloat(giftCardDeduction) || 0;
    return Math.max(0, Math.round((s + d - disc - gc) * 100) / 100);
  };

  /**
   * 1. Cart Validation
   * Called initially and when items change.
   */
  const validateCart = useCallback(async () => {
    if (cartItems.length === 0 || isOrderPlaced) return;

    try {
      setLoading(true);
      const res = await checkoutService.validateCart(cartItems);

      if (res.success) {
        setValidatedItems(res.data.items);
        const subtotal = parseFloat(res.data.subtotal) || 0;
        setPricing((prev) => ({
          ...prev,
          subtotal,
          tax: 0,
          grandTotal: calcGrandTotal(subtotal, prev.deliveryFee, prev.discount)
        }));
        setCartIssues(res.data.issues || []);
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, cart: 'Failed to validate cart. Please try again.' }));
    } finally {
      setLoading(false);
    }
  }, [cartItems, isOrderPlaced]);

  useEffect(() => {
    validateCart();
  }, [validateCart]);

  /**
   * 2. Check Delivery (Triggered when PIN code is entered or loaded from address)
   */
  const checkDelivery = useCallback(async (postalCode, customSubtotal = null) => {
    if (!postalCode || postalCode.length !== 6) return;

    try {
      setLoading(true);
      const currentSubtotal = customSubtotal !== null ? customSubtotal : (pricing.subtotal || 0);
      const res = await checkoutService.checkDelivery(postalCode, currentSubtotal);

      if (res.success && res.data.serviceable) {
        setDeliveryInfo(res.data);
        setErrors((prev) => ({ ...prev, delivery: null }));
        const newDelivery = res.data.finalDeliveryFee !== undefined ? parseFloat(res.data.finalDeliveryFee) : (parseFloat(res.data.deliveryFee) || 0);
        
        setPricing((prev) => ({
          ...prev,
          deliveryFee: newDelivery,
          tax: 0,
          grandTotal: calcGrandTotal(prev.subtotal || currentSubtotal, newDelivery, prev.discount)
        }));
      } else {
        setDeliveryInfo(null);
        setPricing((prev) => ({
          ...prev,
          deliveryFee: 0,
          tax: 0,
          grandTotal: calcGrandTotal(prev.subtotal, 0, prev.discount)
        }));
        setErrors((prev) => ({ ...prev, delivery: res.data?.reason || 'We do not deliver to this area.' }));
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, delivery: 'Failed to check delivery.' }));
    } finally {
      setLoading(false);
    }
  }, [pricing.subtotal]);

  // Fetch saved addresses
  const fetchAddresses = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/customers/me/addresses');
      if (response.success && response.data?.addresses) {
        const addresses = response.data.addresses;
        setSavedAddresses(addresses);

        // Auto-select default address if none is currently selected
        if (addresses.length > 0 && !address.id && !address.addressLine1) {
          const defaultAddress = addresses.find((a) => a.is_default) || addresses[0];
          setAddress({
            id: defaultAddress.id,
            addressLine1: defaultAddress.address_line_1,
            addressLine2: defaultAddress.address_line_2 || '',
            landmark: defaultAddress.landmark || '',
            city: defaultAddress.city,
            state: defaultAddress.state,
            postalCode: defaultAddress.postal_code,
            country: defaultAddress.country || 'India'
          });
          setIsUsingSavedAddress(true);

          setCustomer((prev) => ({
            ...prev,
            firstName: prev.firstName || defaultAddress.full_name.split(' ')[0],
            lastName: prev.lastName || defaultAddress.full_name.split(' ').slice(1).join(' '),
            phone: prev.phone || defaultAddress.phone
          }));

          // Trigger delivery check for the auto-selected postal code
          if (defaultAddress.postal_code && defaultAddress.postal_code.length === 6) {
            checkDelivery(defaultAddress.postal_code);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    }
  }, [isAuthenticated, address.id, address.addressLine1, checkDelivery]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  /**
   * 2.5 Apply Coupon
   */
  const handleApplyCoupon = async (code) => {
    if (!code) return;
    try {
      setCouponLoading(true);
      setCouponError(null);
      const res = await checkoutService.applyCoupon(code, pricing.subtotal);

      if (res.success) {
        setAppliedCoupon({
          code: res.data.code,
          discount_amount: res.data.discount_amount,
          discount_type: res.data.discount_type
        });

        setPricing((prev) => {
          let newDeliveryFee = prev.deliveryFee;
          let newDiscount = parseFloat(res.data.discount_amount) || 0;

          if (res.data.discount_type === 'free_delivery') {
            newDeliveryFee = 0;
            newDiscount = 0;
          }

          return {
            ...prev,
            deliveryFee: newDeliveryFee,
            discount: newDiscount,
            tax: 0,
            grandTotal: calcGrandTotal(prev.subtotal, newDeliveryFee, newDiscount)
          };
        });
      }
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);

    setPricing((prev) => {
      const restoredDeliveryFee = deliveryInfo
        ? (deliveryInfo.finalDeliveryFee !== undefined ? parseFloat(deliveryInfo.finalDeliveryFee) : parseFloat(deliveryInfo.deliveryFee))
        : 0;

      return {
        ...prev,
        deliveryFee: restoredDeliveryFee,
        discount: 0,
        tax: 0,
        grandTotal: calcGrandTotal(prev.subtotal, restoredDeliveryFee, 0, prev.giftCardDeduction)
      };
    });
  };

  /**
   * 2.6 Apply Gift Card
   */
  const handleApplyGiftCard = async (code) => {
    if (!code) return;
    try {
      setGiftCardLoading(true);
      setGiftCardError(null);
      const res = await giftCardService.validateForCheckout(code);

      if (res.success && res.data) {
        const card = res.data;
        const currentPayable = Math.max(0, (pricing.subtotal || 0) + (pricing.deliveryFee || 0) - (pricing.discount || 0));
        const deduction = Math.min(parseFloat(card.currentBalance), currentPayable);

        setAppliedGiftCard({
          id: card.id,
          code: card.code,
          balance: parseFloat(card.currentBalance),
          deduction
        });

        setPricing((prev) => ({
          ...prev,
          giftCardDeduction: deduction,
          grandTotal: calcGrandTotal(prev.subtotal, prev.deliveryFee, prev.discount, deduction)
        }));
      }
    } catch (err) {
      setGiftCardError(err.message || 'Invalid or expired gift card code');
      setAppliedGiftCard(null);
    } finally {
      setGiftCardLoading(false);
    }
  };

  const removeGiftCard = () => {
    setAppliedGiftCard(null);
    setGiftCardCode('');
    setGiftCardError(null);

    setPricing((prev) => ({
      ...prev,
      giftCardDeduction: 0,
      grandTotal: calcGrandTotal(prev.subtotal, prev.deliveryFee, prev.discount, 0)
    }));
  };

  /**
   * 3. Integrated Create Order + Authoritative Server-Side Payment
   */
  const createAndPayOrder = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      setLoading(true);
      setPaymentError(null);

      // 1. Create order on server (which calculates authoritative total)
      const payload = {
        customer,
        address,
        deliveryMethod,
        items: cartItems,
        notes: deliveryNotes,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        giftCardCode: appliedGiftCard ? appliedGiftCard.code : null,
        paymentMethod,
        isGiftOrder,
        ...(isGiftOrder ? {
          giftRecipientName: giftRecipient.name,
          giftRecipientPhone: giftRecipient.phone,
          giftRecipientAddress: giftRecipient.address,
          giftRecipientCity: giftRecipient.city,
          giftRecipientState: giftRecipient.state,
          giftRecipientPostalCode: giftRecipient.postalCode,
          giftMessage: giftMessage
        } : {})
      };

      const res = await checkoutService.createOrder(payload);

      if (!res.success || !res.data?.orderNumber) {
        throw new Error(res.message || 'Failed to create order');
      }

      const createdOrderNumber = res.data.orderNumber;
      setOrderDraft(res.data);

      // Save address asynchronously if requested
      if (isAuthenticated && saveAddressForFuture && !isUsingSavedAddress) {
        try {
          await api.post('/customers/me/addresses', {
            fullName: `${customer.firstName} ${customer.lastName}`.trim(),
            phone: customer.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            landmark: address.landmark,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
            isDefault: savedAddresses.length === 0
          });
        } catch (addrErr) {
          console.error('Non-blocking address save error:', addrErr);
        }
      }

      // If fully paid with gift card (0 remaining balance to pay)
      if (res.data?.isFullyPaid || res.data?.status === 'paid' || res.data?.grandTotal === 0) {
        setIsOrderPlaced(true);
        clearCart();
        navigate(`/checkout/success/${createdOrderNumber}`, { replace: true });
        return;
      }

      // 2. Process authoritative internal payment for remaining balance
      const payRes = await checkoutService.processPayment({
        orderNumber: createdOrderNumber,
        paymentMethod
      });

      if (payRes.success && payRes.data?.status === 'paid') {
        // Mark order as placed BEFORE clearing cart so Checkout.jsx does not redirect to /cart
        setIsOrderPlaced(true);
        clearCart();
        navigate(`/checkout/success/${createdOrderNumber}`, { replace: true });
      } else {
        setRetryOrder(createdOrderNumber);
        setPaymentError('Payment processing could not be completed. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      if (err.code === 'CART_INVALID' && err.issues) {
        setCartIssues(err.issues);
        setErrors((prev) => ({
          ...prev,
          prepare: 'Your cart contains items that are out of stock or have changed. Please review your cart.'
        }));
      } else {
        setPaymentError(err.message || 'Unable to complete checkout. Please try again.');
      }
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  /**
   * 4. Retry Payment for an existing order
   */
  const handleRetryPayment = async () => {
    if (!retryOrder || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      setLoading(true);
      setPaymentError(null);

      // 1. Re-initiate / retry payment on server
      await checkoutService.retryPayment(retryOrder, paymentMethod);

      // 2. Process payment
      const payRes = await checkoutService.processPayment({
        orderNumber: retryOrder,
        paymentMethod
      });

      if (payRes.success && payRes.data?.status === 'paid') {
        setIsOrderPlaced(true);
        clearCart();
        navigate(`/checkout/success/${retryOrder}`, { replace: true });
      } else {
        setPaymentError('Retry payment failed. Please try again or choose another payment method.');
      }
    } catch (err) {
      console.error('Retry payment error:', err);
      setPaymentError(err.message || 'Payment retry failed.');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const goToStep = (targetStep) => {
    if (targetStep < step) setStep(targetStep);
  };

  // Ensure grandTotal is computed correctly
  const effectiveGrandTotal = calcGrandTotal(
    pricing.subtotal,
    pricing.deliveryFee,
    pricing.discount,
    pricing.giftCardDeduction
  );

  const effectivePricing = {
    ...pricing,
    grandTotal: effectiveGrandTotal
  };

  return {
    customer,
    setCustomer,
    address,
    setAddress,
    savedAddresses,
    saveAddressForFuture,
    setSaveAddressForFuture,
    isUsingSavedAddress,
    setIsUsingSavedAddress,
    deliveryMethod,
    setDeliveryMethod,
    deliveryNotes,
    setDeliveryNotes,
    paymentMethod,
    setPaymentMethod,
    isPaymentValid,
    setIsPaymentValid,
    isOrderPlaced,
    paymentError,
    retryOrder,
    couponCode,
    setCouponCode,
    appliedCoupon,
    setAppliedCoupon,
    giftCardCode,
    setGiftCardCode,
    appliedGiftCard,
    setAppliedGiftCard,
    giftCardError,
    giftCardLoading,
    pricing: effectivePricing,
    validatedItems,
    step,
    loading,
    errors,
    setErrors,
    cartIssues,
    deliveryInfo,
    orderDraft,
    couponError,
    couponLoading,

    checkDelivery,
    createAndPayOrder,
    handleRetryPayment,
    handleApplyCoupon,
    removeCoupon,
    handleApplyGiftCard,
    removeGiftCard,
    nextStep,
    prevStep,
    goToStep,

    // Gift Order
    isGiftOrder,
    setIsGiftOrder,
    giftRecipient,
    setGiftRecipient,
    giftMessage,
    setGiftMessage,
    giftErrors,
    setGiftErrors
  };
};
