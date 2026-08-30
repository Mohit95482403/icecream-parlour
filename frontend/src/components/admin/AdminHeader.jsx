import React, { useState, useRef, useEffect } from 'react';
import { Menu, User, LogOut, Settings } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../notifications/NotificationBell';

const AdminHeader = ({ openMobileMenu }) => {
  const { adminUser, adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <header className="h-16 bg-ivory border-b border-warm-taupe/20 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={openMobileMenu}
          className="p-2 -ml-2 text-espresso lg:hidden hover:bg-warm-taupe/10 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <NotificationBell />

        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 pl-2 pr-3 bg-white border border-warm-taupe/30 rounded-full hover:border-warm-taupe/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-espresso text-ivory flex items-center justify-center text-sm font-medium">
              {adminUser?.first_name?.charAt(0) || 'A'}
            </div>
            <span className="text-sm font-medium hidden sm:block">
              {adminUser?.first_name || 'Admin'}
            </span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-warm-taupe/20 rounded-xl shadow-lg py-2 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-warm-taupe/10 mb-2">
                <p className="text-sm font-medium text-espresso truncate">
                  {adminUser?.first_name ? `${adminUser.first_name} ${adminUser.last_name || ''}`.trim() : 'Administrator'}
                </p>
                <p className="text-xs text-espresso/60 truncate">{adminUser?.email || 'admin@glace.com'}</p>
              </div>

              <button 
                onClick={() => { setShowProfileMenu(false); navigate('/admin/settings'); }}
                className="w-full px-4 py-2 text-left text-sm text-espresso/80 hover:bg-warm-taupe/10 flex items-center gap-2 transition-colors"
              >
                <Settings size={16} />
                Settings
              </button>

              <button 
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-berry hover:bg-berry/10 flex items-center gap-2 transition-colors border-t border-warm-taupe/10 mt-2 pt-2"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
