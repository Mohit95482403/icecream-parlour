import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  Settings,
  Truck,
  Star,
  CreditCard,
  Sparkles,
  Gift,
  X
} from 'lucide-react';

const AdminSidebar = ({ isMobileOpen, closeMobileMenu }) => {
  const navGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' }
      ]
    },
    {
      title: 'COMMERCE',
      items: [
        { label: 'Orders', icon: ShoppingBag, path: '/admin/orders' },
        { label: 'Payments', icon: CreditCard, path: '/admin/payments' },
        { label: 'Gift Cards', icon: Gift, path: '/admin/gift-cards' },
        { label: 'Cancellations', icon: ShoppingBag, path: '/admin/cancellations' },
        { label: 'Products', icon: Package, path: '/admin/products' },
        { label: 'Inventory', icon: Package, path: '/admin/inventory' },
        { label: 'Delivery', icon: Truck, path: '/admin/deliveries' },
        { label: 'Reviews', icon: Star, path: '/admin/reviews' },
      ]
    },
    {
      title: 'MARKETING',
      items: [
        { label: 'New Flavour Banner', icon: Sparkles, path: '/admin/banner' },
        { label: 'Coupons', icon: ShoppingBag, path: '/admin/coupons' }
      ]
    },
    {
      title: 'CUSTOMERS',
      items: [
        { label: 'Users', icon: Users, path: '/admin/users' }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Settings', icon: Settings, path: '/admin/settings' }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-espresso/50 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-ivory border-r border-warm-taupe/20
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-warm-taupe/20">
          <span className="font-display text-2xl font-bold tracking-wider">GLACÉ</span>
          <button 
            onClick={closeMobileMenu}
            className="p-1 -mr-2 lg:hidden text-espresso/60 hover:text-espresso"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 hide-scrollbar">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h3 className="caption mb-3 px-2">{group.title}</h3>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={closeMobileMenu}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                        ${isActive 
                          ? 'bg-espresso text-ivory' 
                          : 'text-espresso/70 hover:bg-warm-taupe/10 hover:text-espresso'
                        }
                      `}
                    >
                      <item.icon size={18} />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
