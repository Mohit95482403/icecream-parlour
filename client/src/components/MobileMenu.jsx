import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Search, User, ShoppingBag, ArrowRight, Package, Bell, LogOut, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mainNavLinks } from '../constants/navigation';
import Logo from './Logo';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { useWishlist } from '../hooks/useWishlist';

/**
 * Full-screen mobile menu drawer with Framer Motion animation.
 */
const MobileMenu = ({ isOpen, onClose, onSearchClick }) => {
  const { itemCount, openDrawer } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();

  const isCustomer = isAuthenticated && user?.role === 'customer';

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate('/');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-espresso/20 backdrop-blur-sm z-[60]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-ivory z-[70] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5">
              <Logo />
              <button
                onClick={onClose}
                className="p-2 -mr-2 hover:bg-warm-taupe/10 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-6 py-4 overflow-y-auto" aria-label="Mobile navigation">
              <ul className="space-y-1">
                {mainNavLinks.map((link, index) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                  >
                    <Link
                      to={link.href}
                      onClick={onClose}
                      className="flex items-center justify-between py-4 text-lg font-display font-medium border-b border-warm-taupe/10 hover:pl-2 transition-all duration-300"
                    >
                      {link.label}
                      <ArrowRight size={16} strokeWidth={1.5} className="text-warm-taupe" />
                    </Link>
                  </motion.li>
                ))}
              </ul>

              {isCustomer && (
                <div className="mt-8 border-t border-warm-taupe/10 pt-6">
                  <p className="text-xs font-semibold text-warm-taupe uppercase tracking-wider mb-4 px-2">
                    My Account ({user?.firstName})
                  </p>
                  <ul className="space-y-2">
                    <li>
                      <Link to="/account" onClick={onClose} className="flex items-center gap-3 py-2 px-2 text-charcoal hover:bg-warm-taupe/10 rounded-lg transition-colors">
                        <User size={18} className="text-warm-taupe" />
                        My Profile
                      </Link>
                    </li>
                    <li>
                      <Link to="/account/orders" onClick={onClose} className="flex items-center gap-3 py-2 px-2 text-charcoal hover:bg-warm-taupe/10 rounded-lg transition-colors">
                        <Package size={18} className="text-warm-taupe" />
                        My Orders
                      </Link>
                    </li>
                    <li>
                      <Link to="/account/wishlist" onClick={onClose} className="flex items-center justify-between py-2 px-2 text-charcoal hover:bg-warm-taupe/10 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                          <Heart size={18} className="text-warm-taupe" />
                          Wishlist
                        </div>
                        {wishlistCount > 0 && (
                          <span className="w-5 h-5 flex items-center justify-center bg-theme-primary text-white text-[10px] font-bold rounded-full">
                            {wishlistCount}
                          </span>
                        )}
                      </Link>
                    </li>
                    <li>
                      <Link to="/account/notifications" onClick={onClose} className="flex items-center gap-3 py-2 px-2 text-charcoal hover:bg-warm-taupe/10 rounded-lg transition-colors">
                        <Bell size={18} className="text-warm-taupe" />
                        Notifications
                      </Link>
                    </li>
                    <li>
                      <button onClick={handleLogout} className="flex items-center gap-3 py-2 px-2 text-berry hover:bg-berry/5 rounded-lg transition-colors w-full text-left">
                        <LogOut size={18} className="text-berry/70" />
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </nav>

            {/* Bottom Actions */}
            <div className="px-6 py-6 border-t border-warm-taupe/10 space-y-3">
              <button
                onClick={onSearchClick}
                className="flex items-center gap-3 w-full py-3 text-sm font-medium text-charcoal hover:text-espresso transition-colors"
              >
                <Search size={18} strokeWidth={1.5} />
                Search
              </button>
              
              {!isCustomer && (
                <Link
                  to="/login-select"
                  onClick={onClose}
                  className="flex items-center gap-3 w-full py-3 text-sm font-medium text-charcoal hover:text-espresso transition-colors"
                >
                  <User size={18} strokeWidth={1.5} />
                  Sign In
                </Link>
              )}
              
              {isCustomer && (
                <button
                  onClick={() => {
                    onClose();
                    openDrawer();
                  }}
                  className="flex items-center gap-3 w-full py-3 text-sm font-medium text-charcoal hover:text-espresso transition-colors"
                >
                  <ShoppingBag size={18} strokeWidth={1.5} />
                  Cart ({itemCount})
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
