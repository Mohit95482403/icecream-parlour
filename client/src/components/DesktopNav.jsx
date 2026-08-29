import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, User, ShoppingBag } from 'lucide-react';
import { mainNavLinks } from '../constants/navigation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import CustomerProfileDropdown from './CustomerProfileDropdown';
import NotificationBell from './notifications/NotificationBell';

/**
 * Desktop navigation with nav links and action icons.
 */
const DesktopNav = ({ onSearchClick }) => {
  const location = useLocation();
  const { itemCount, openDrawer } = useCart();
  const { user, isAuthenticated } = useAuth();
  
  const isCustomer = isAuthenticated && user?.role === 'customer';

  return (
    <div className="flex items-center gap-1">
      {/* Main Navigation Links */}
      <nav className="flex items-center gap-1 mr-8" aria-label="Main navigation">
        {mainNavLinks.map((link) => {
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.href}
              to={link.href}
              className={`px-4 py-2 text-sm font-medium tracking-wide transition-colors duration-300 rounded-pill ${
                isActive
                  ? 'text-espresso bg-warm-taupe/10'
                  : 'text-charcoal hover:text-espresso hover:bg-warm-taupe/5'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Action Icons */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onSearchClick}
          className="p-2.5 hover:bg-warm-taupe/10 rounded-full transition-colors duration-300"
          aria-label="Search"
        >
          <Search size={18} strokeWidth={1.5} />
        </button>

        {isCustomer ? (
          <div className="flex items-center gap-1 ml-1 mr-1">
            <NotificationBell />
            <CustomerProfileDropdown />
          </div>
        ) : (
          <Link
            to="/login-select"
            className="p-2.5 hover:bg-warm-taupe/10 rounded-full transition-colors duration-300"
            aria-label="Account"
          >
            <User size={18} strokeWidth={1.5} />
          </Link>
        )}

        {isCustomer && (
          <button
            onClick={openDrawer}
            className="p-2.5 hover:bg-warm-taupe/10 rounded-full transition-colors duration-300 relative ml-1"
            aria-label="Cart"
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-espresso text-ivory text-[10px] font-medium rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default DesktopNav;
