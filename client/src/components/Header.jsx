import React, { useState } from 'react';
import { Menu, Search, ShoppingBag } from 'lucide-react';
import useScrollPosition from '../hooks/useScrollPosition';
import Logo from './Logo';
import DesktopNav from './DesktopNav';
import MobileMenu from './MobileMenu';
import SearchModal from './SearchModal';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';

/**
 * Premium header with scroll behavior:
 * - At top: transparent background
 * - On scroll: solid background with backdrop blur and subtle shadow
 */
const Header = () => {
  const { scrolled } = useScrollPosition(50);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { itemCount, openDrawer } = useCart();
  const { user, isAuthenticated } = useAuth();

  const isCustomer = isAuthenticated && user?.role === 'customer';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-ivory/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(184,170,154,0.2)] py-3'
            : 'bg-transparent py-4 sm:py-5'
        }`}
        role="banner"
      >
        <div className="container-custom">
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between">
            <Logo />
            <DesktopNav onSearchClick={() => setSearchOpen(true)} />
          </div>

          {/* Mobile Layout */}
          <div className="flex lg:hidden items-center justify-between">
            <Logo />
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 hover:bg-warm-taupe/10 rounded-lg transition-colors text-charcoal"
                aria-label="Search"
              >
                <Search size={20} strokeWidth={1.5} />
              </button>

              {isCustomer && (
                <button
                  onClick={openDrawer}
                  className="p-2 hover:bg-warm-taupe/10 rounded-lg transition-colors relative text-charcoal"
                  aria-label="Cart"
                >
                  <ShoppingBag size={20} strokeWidth={1.5} />
                  {itemCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-espresso text-ivory text-[10px] font-medium rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 -mr-1 hover:bg-warm-taupe/10 rounded-lg transition-colors text-charcoal"
                aria-label="Open menu"
                aria-expanded={mobileMenuOpen}
              >
                <Menu size={22} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onSearchClick={() => {
          setMobileMenuOpen(false);
          setSearchOpen(true);
        }}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
};

export default Header;
