import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from '../components/notifications/NotificationBell';

const AccountLayout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', path: '/account' },
    { label: 'Profile', path: '/account/profile' },
    { label: 'Orders', path: '/account/orders' },
    { label: 'Gift Cards', path: '/account/gift-cards' },
    { label: 'My Reviews', path: '/account/reviews' },
    { label: 'Wishlist', path: '/account/wishlist' },
    { label: 'Addresses', path: '/account/addresses' },
  ];

  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-20 sm:pt-24 pb-16">
      <div className="container-custom max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Sidebar (Desktop) & Tab Bar (Mobile) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full md:w-64 shrink-0"
          >
            <div className="bg-white p-4 sm:p-6 border border-warm-taupe/20 md:sticky md:top-32 rounded-xl md:rounded-none">
              <div className="mb-4 md:mb-8 flex md:block items-center justify-between">
                <div>
                  <h2 className="font-playfair text-lg sm:text-xl text-midnight-charcoal mb-0.5 md:mb-1">My Account</h2>
                  <p className="text-xs sm:text-sm text-warm-taupe">Welcome back, {user?.firstName}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="md:hidden text-xs text-berry font-medium px-3 py-1.5 border border-berry/30 rounded-lg hover:bg-berry/5"
                >
                  Log Out
                </button>
              </div>

              {/* Navigation — Horizontal scrollable pills on mobile, Vertical stack on desktop */}
              <nav className="flex md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`whitespace-nowrap px-4 py-2.5 md:py-3 text-xs sm:text-sm transition-colors rounded-lg md:rounded-none ${
                        isActive
                          ? 'bg-midnight-charcoal text-white font-medium shadow-xs'
                          : 'text-midnight-charcoal hover:bg-warm-taupe/10 bg-warm-taupe/5 md:bg-transparent'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className="hidden md:block w-full text-left px-4 py-3 text-sm text-midnight-charcoal hover:bg-warm-taupe/10 transition-colors mt-4 border-t border-warm-taupe/20"
                >
                  Log Out
                </button>
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 min-w-0"
          >
            <div className="bg-white p-4 sm:p-6 md:p-8 border border-warm-taupe/20 rounded-xl md:rounded-none min-h-[500px]">
              <div className="flex justify-between items-center mb-6 sm:mb-8 pb-4 border-b border-warm-taupe/20">
                <h1 className="font-playfair text-xl sm:text-2xl text-midnight-charcoal">
                  {title}
                </h1>
                <NotificationBell />
              </div>
              {children}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AccountLayout;
