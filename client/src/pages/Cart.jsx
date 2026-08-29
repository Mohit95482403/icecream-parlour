import React from 'react';
import { Link } from 'react-router-dom';
import Container from '../components/Container';
import CartItem from '../components/cart/CartItem';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const { items, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-24 min-h-[70vh] flex flex-col items-center justify-center text-center">
        <Container>
          <div className="w-20 h-20 bg-sand rounded-full flex items-center justify-center text-3xl mx-auto mb-6">🍦</div>
          <h1 className="font-display text-4xl text-espresso mb-4 uppercase tracking-wider">
            Your Scoop Bag is Empty
          </h1>
          <p className="body-lg text-charcoal/70 max-w-md mx-auto mb-10">
            There is always room for another flavour. Explore our collections and discover something new.
          </p>
          <Link 
            to="/shop" 
            className="px-8 py-4 bg-espresso text-ivory text-sm font-medium uppercase tracking-widest transition-colors hover:bg-charcoal"
          >
            Explore Flavours
          </Link>
        </Container>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 min-h-screen bg-ivory">
      <Container>
        <h1 className="font-display text-4xl text-espresso mb-12 uppercase tracking-wider">
          Your Cart
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Cart Items (Left side on desktop) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col border-t border-warm-taupe/20">
            {/* Desktop Headers */}
            <div className="hidden md:grid grid-cols-12 gap-4 py-4 border-b border-warm-taupe/20 text-xs font-medium uppercase tracking-widest text-warm-taupe">
              <div className="col-span-6">Product</div>
              <div className="col-span-3 text-center">Quantity</div>
              <div className="col-span-3 text-right">Total</div>
            </div>
            
            {/* Items */}
            {items.map(item => (
              <CartItem key={`${item.productId}-${item.variantId}`} item={item} />
            ))}
          </div>

          {/* Order Summary (Right side on desktop) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-sand/30 border border-sand p-8 rounded-xl sticky top-32">
              <h2 className="font-display text-2xl text-espresso mb-6 uppercase tracking-wider">
                Order Summary
              </h2>
              
              <div className="space-y-4 mb-8 text-sm text-charcoal/80">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="font-medium text-espresso">₹{subtotal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Delivery</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-6 border-t border-warm-taupe/20 mb-8">
                <span className="text-sm font-medium uppercase tracking-widest text-espresso">Estimated Total</span>
                <span className="font-display text-2xl text-espresso">₹{subtotal}</span>
              </div>
              
              <Link
                to="/checkout"
                className="w-full flex justify-center items-center py-4 px-6 bg-espresso text-ivory text-sm font-medium uppercase tracking-widest transition-colors hover:bg-charcoal"
              >
                Proceed to Checkout
              </Link>
              
              <Link 
                to="/shop" 
                className="block w-full text-center mt-6 text-xs font-medium uppercase tracking-widest text-charcoal/60 hover:text-espresso transition-colors underline underline-offset-4"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Cart;
