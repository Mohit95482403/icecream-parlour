import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Package, Bell, ChevronDown, Heart, Gift } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useWishlist } from '../hooks/useWishlist';

const CustomerProfileDropdown = () => {
  const { user, logout } = useAuth();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const closeDropdown = () => setIsOpen(false);

  // If no user or not customer, theoretically shouldn't render, but fallback
  if (!user) return null;

  const getInitial = () => {
    if (user.firstName) return user.firstName.charAt(0).toUpperCase();
    return 'C';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pl-2 pr-3 bg-white/50 backdrop-blur-sm border border-warm-taupe/30 rounded-full hover:border-warm-taupe/60 transition-all duration-300"
        aria-expanded={isOpen}
      >
        <div className="w-7 h-7 rounded-full bg-espresso text-ivory flex items-center justify-center text-xs font-medium">
          {getInitial()}
        </div>
        <span className="text-sm font-medium text-charcoal hidden sm:block truncate max-w-[100px]">
          {user.firstName || 'Customer'}
        </span>
        <ChevronDown size={14} className={`text-charcoal/70 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white border border-warm-taupe/20 rounded-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] py-2 z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-warm-taupe/10 mb-1 bg-warm-taupe/5">
            <p className="text-sm font-medium text-charcoal truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-charcoal/60 truncate mt-0.5">
              {user.email}
            </p>
          </div>
          
          <div className="px-2 py-1 space-y-1">
            <Link 
              to="/account" 
              onClick={closeDropdown}
              className="flex items-center gap-3 px-3 py-2 text-sm text-charcoal hover:bg-warm-taupe/10 rounded-lg transition-colors"
            >
              <User size={16} className="text-charcoal/70" />
              My Profile
            </Link>
            
            <Link 
              to="/account/orders" 
              onClick={closeDropdown}
              className="flex items-center gap-3 px-3 py-2 text-sm text-charcoal hover:bg-warm-taupe/10 rounded-lg transition-colors"
            >
              <Package size={16} className="text-charcoal/70" />
              My Orders
            </Link>

            <Link 
              to="/account/gift-cards" 
              onClick={closeDropdown}
              className="flex items-center gap-3 px-3 py-2 text-sm text-charcoal hover:bg-warm-taupe/10 rounded-lg transition-colors"
            >
              <Gift size={16} className="text-charcoal/70" />
              Gift Cards
            </Link>

            <Link 
              to="/account/wishlist" 
              onClick={closeDropdown}
              className="flex items-center justify-between px-3 py-2 text-sm text-charcoal hover:bg-warm-taupe/10 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Heart size={16} className="text-charcoal/70" />
                Wishlist
              </div>
              {wishlistCount > 0 && (
                <span className="w-5 h-5 flex items-center justify-center bg-theme-primary text-white text-[10px] font-bold rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link 
              to="/account/notifications" 
              onClick={closeDropdown}
              className="flex items-center gap-3 px-3 py-2 text-sm text-charcoal hover:bg-warm-taupe/10 rounded-lg transition-colors"
            >
              <Bell size={16} className="text-charcoal/70" />
              Notifications
            </Link>
          </div>

          <div className="px-2 pt-1 mt-1 border-t border-warm-taupe/10">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-berry hover:bg-berry/5 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfileDropdown;
