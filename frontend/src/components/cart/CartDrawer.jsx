import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';

const CartDrawer = () => {
  const { isDrawerOpen, closeDrawer, items, subtotal, cartIssues, isValidating } = useCart();
  const drawerRef = useRef(null);
  const navigate = useNavigate();

  // Trap focus and close on escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isDrawerOpen) return;
      if (e.key === 'Escape') closeDrawer();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen, closeDrawer]);

  const handleCheckoutClick = () => {
    closeDrawer();
    navigate('/cart'); // For Day 4, redirect to the Cart page. Day 5 will be Checkout.
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-50"
            onClick={closeDrawer}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Your Cart"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-ivory shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-sand">
              <h2 className="text-xs font-medium uppercase tracking-widest text-espresso flex items-center gap-2">
                <ShoppingBag size={16} strokeWidth={1.5} />
                Your Scoop Bag
              </h2>
              <button 
                onClick={closeDrawer}
                className="p-2 -mr-2 text-charcoal/60 hover:text-espresso transition-colors"
                aria-label="Close cart"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-2">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-sand rounded-full flex items-center justify-center text-2xl">🍦</div>
                  <h3 className="font-display text-2xl text-espresso">Your bag is empty</h3>
                  <p className="text-charcoal/70 body-sm max-w-[250px]">
                    There is always room for another flavour. Explore our collections.
                  </p>
                  <Link 
                    to="/shop" 
                    onClick={closeDrawer}
                    className="mt-4 text-xs font-medium uppercase tracking-widest text-espresso border-b border-espresso pb-1 hover:text-gold hover:border-gold transition-colors"
                  >
                    Explore Flavours
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col">
                  {items.map(item => {
                    const issue = cartIssues.find(i => i.productId === item.productId && i.variantId === item.variantId);
                    return (
                      <CartItem key={`${item.productId}-${item.variantId}`} item={item} issue={issue} />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 bg-sand/30 border-t border-sand">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-medium uppercase tracking-widest text-charcoal">Subtotal</span>
                  <span className="font-display text-xl text-espresso">₹{subtotal}</span>
                </div>
                
                <p className="text-xs text-charcoal/60 text-center mb-6">
                  Delivery calculated at checkout.
                </p>

                <div className="space-y-3">
                  {cartIssues.length > 0 ? (
                    <button
                      disabled
                      className="block text-center w-full py-4 px-6 bg-sand text-warm-taupe cursor-not-allowed font-medium uppercase tracking-widest text-sm"
                    >
                      Update Cart to Checkout
                    </button>
                  ) : (
                    <Link
                      to="/checkout"
                      onClick={closeDrawer}
                      className="block text-center w-full py-4 px-6 bg-espresso text-cream font-medium hover:bg-charcoal transition-colors uppercase tracking-widest text-sm"
                    >
                      Checkout
                    </Link>
                  )}
                  <button 
                    onClick={() => { closeDrawer(); navigate('/cart'); }}
                    className="w-full py-4 border border-espresso text-espresso text-sm font-medium uppercase tracking-widest transition-colors hover:bg-espresso hover:text-ivory"
                  >
                    View Cart
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
