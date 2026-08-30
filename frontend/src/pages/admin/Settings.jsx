import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { adminSettingsApi } from '../../services/admin/adminSettingsApi';
import { toast } from 'react-hot-toast';
import { Store, Bell, Lock, Activity, Save, Loader2, ChevronRight, Info } from 'lucide-react';

const Settings = () => {
  const { adminUser: user } = useAdminAuth();
  
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [settings, setSettings] = useState({
    store_name: '',
    store_email: '',
    store_phone: '',
    store_address: '',
    store_description: '',
    store_status: 'open',
    currency: 'INR',
    tax_rate: '18',
    min_order_amount: '500',
    notify_new_order: 'true',
    notify_low_stock: 'true',
    maintenance_mode: 'false'
  });
  
  const [originalSettings, setOriginalSettings] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await adminSettingsApi.getSettings();
      if (res.success && res.data) {
        setSettings(prev => ({ ...prev, ...res.data }));
        setOriginalSettings(res.data);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const payload = Object.keys(settings).map(key => ({
        key,
        value: settings[key]
      }));
      
      const res = await adminSettingsApi.updateSettings(payload);
      
      if (res.success) {
        setOriginalSettings(settings);
        setHasChanges(false);
        toast.success('Settings Saved');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Store & General', icon: Store },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'account', label: 'Account & Security', icon: Lock },
    { id: 'system', label: 'System', icon: Activity },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-espresso/40" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="caption mb-2">ADMIN SETTINGS</p>
          <h1 className="display-sm mb-2">Settings</h1>
          <p className="body-md text-espresso/60 max-w-lg">
            Manage your store, orders, notifications, account, and system preferences.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {hasChanges && (
            <span className="text-sm font-medium text-amber-600 animate-pulse">
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`btn gap-2 ${hasChanges ? 'btn-primary' : 'bg-warm-taupe/20 text-espresso/50 cursor-not-allowed'}`}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Sidebar Nav */}
        <div className="lg:col-span-3">
          <nav className="flex flex-col gap-1 sticky top-24">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.id 
                  ? 'bg-white shadow-sm border border-warm-taupe/20 text-espresso font-medium'
                  : 'text-espresso/60 hover:bg-warm-taupe/10 hover:text-espresso'
                }`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon size={18} className={activeTab === tab.id ? 'text-gold' : ''} />
                  <span>{tab.label}</span>
                </div>
                {activeTab === tab.id && <ChevronRight size={16} className="text-espresso/40" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-9 space-y-8">
          
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-8">
              {/* Basic Info */}
              <div className="bg-white rounded-xl border border-warm-taupe/20 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-warm-taupe/10 bg-[#FAFAFA]">
                  <h3 className="font-display text-xl mb-1">Store Information</h3>
                  <p className="text-sm text-espresso/60">Manage your basic store details and contact information.</p>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-espresso/80 mb-2">Store Name</label>
                    <input 
                      type="text" 
                      value={settings.store_name}
                      onChange={(e) => handleChange('store_name', e.target.value)}
                      className="w-full bg-ivory border border-warm-taupe/30 rounded-lg px-4 py-2.5 focus:outline-none focus:border-espresso transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-espresso/80 mb-2">Store Email</label>
                    <input 
                      type="email" 
                      value={settings.store_email}
                      onChange={(e) => handleChange('store_email', e.target.value)}
                      className="w-full bg-ivory border border-warm-taupe/30 rounded-lg px-4 py-2.5 focus:outline-none focus:border-espresso transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-espresso/80 mb-2">Store Phone</label>
                    <input 
                      type="text" 
                      value={settings.store_phone}
                      onChange={(e) => handleChange('store_phone', e.target.value)}
                      className="w-full bg-ivory border border-warm-taupe/30 rounded-lg px-4 py-2.5 focus:outline-none focus:border-espresso transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-espresso/80 mb-2">Store Address</label>
                    <textarea 
                      value={settings.store_address}
                      onChange={(e) => handleChange('store_address', e.target.value)}
                      rows={3}
                      className="w-full bg-ivory border border-warm-taupe/30 rounded-lg px-4 py-2.5 focus:outline-none focus:border-espresso transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Store Operations */}
              <div className="bg-white rounded-xl border border-warm-taupe/20 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-warm-taupe/10 bg-[#FAFAFA]">
                  <h3 className="font-display text-xl mb-1">Store Operations</h3>
                  <p className="text-sm text-espresso/60">Control store status, currency, and minimum orders.</p>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-espresso/80 mb-2">Store Status</label>
                    <select
                      value={settings.store_status}
                      onChange={(e) => handleChange('store_status', e.target.value)}
                      className="w-full bg-ivory border border-warm-taupe/30 rounded-lg px-4 py-2.5 focus:outline-none focus:border-espresso transition-colors appearance-none"
                    >
                      <option value="open">Open (Accepting Orders)</option>
                      <option value="closed">Closed (Temporarily)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-espresso/80 mb-2">Currency</label>
                    <input 
                      type="text" 
                      value={settings.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      className="w-full bg-ivory border border-warm-taupe/30 rounded-lg px-4 py-2.5 focus:outline-none focus:border-espresso transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-espresso/80 mb-2">Minimum Order Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-espresso/50">₹</span>
                      <input 
                        type="number" 
                        value={settings.min_order_amount}
                        onChange={(e) => handleChange('min_order_amount', e.target.value)}
                        className="w-full bg-ivory border border-warm-taupe/30 rounded-lg pl-8 pr-4 py-2.5 focus:outline-none focus:border-espresso transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-espresso/80 mb-2">Tax Rate (%)</label>
                    <input 
                      type="number" 
                      value={settings.tax_rate}
                      onChange={(e) => handleChange('tax_rate', e.target.value)}
                      className="w-full bg-ivory border border-warm-taupe/30 rounded-lg px-4 py-2.5 focus:outline-none focus:border-espresso transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-warm-taupe/20 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-warm-taupe/10 bg-[#FAFAFA]">
                <h3 className="font-display text-xl mb-1">Notification Preferences</h3>
                <p className="text-sm text-espresso/60">Choose which events trigger an alert in your admin dashboard.</p>
              </div>
              <div className="p-6 space-y-6">
                
                {/* Toggle Item */}
                <div className="flex items-center justify-between pb-6 border-b border-warm-taupe/10 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-espresso mb-1">New Order Notifications</p>
                    <p className="text-sm text-espresso/60">Receive an alert whenever a customer places a new order.</p>
                  </div>
                  <button 
                    onClick={() => handleChange('notify_new_order', settings.notify_new_order === 'true' ? 'false' : 'true')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.notify_new_order === 'true' ? 'bg-gold' : 'bg-warm-taupe/40'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.notify_new_order === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between pb-6 border-b border-warm-taupe/10 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-espresso mb-1">Low Stock Alerts</p>
                    <p className="text-sm text-espresso/60">Get notified when a product inventory falls below the threshold.</p>
                  </div>
                  <button 
                    onClick={() => handleChange('notify_low_stock', settings.notify_low_stock === 'true' ? 'false' : 'true')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.notify_low_stock === 'true' ? 'bg-gold' : 'bg-warm-taupe/40'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.notify_low_stock === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                
              </div>
            </div>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === 'account' && (
            <div className="bg-white rounded-xl border border-warm-taupe/20 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-warm-taupe/10 bg-[#FAFAFA]">
                <h3 className="font-display text-xl mb-1">Admin Profile</h3>
                <p className="text-sm text-espresso/60">Your personal administrator details.</p>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-full bg-espresso text-cream flex items-center justify-center text-3xl font-display">
                    {user?.firstName?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <p className="text-xl font-medium text-espresso">{user?.firstName} {user?.lastName}</p>
                    <p className="text-espresso/60 mb-2">{user?.email}</p>
                    <span className="inline-block px-2.5 py-1 rounded bg-warm-taupe/20 text-xs font-medium uppercase tracking-widest text-espresso/80">
                      Administrator
                    </span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800 text-sm">
                  <Info size={18} className="shrink-0 mt-0.5" />
                  <p>Profile and password management is currently handled by the super-admin. If you need to change your password, please contact support.</p>
                </div>
              </div>
            </div>
          )}

          {/* SYSTEM TAB */}
          {activeTab === 'system' && (
            <div className="space-y-8">
              <div className="bg-white rounded-xl border border-warm-taupe/20 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-warm-taupe/10 bg-[#FAFAFA]">
                  <h3 className="font-display text-xl mb-1">System Status</h3>
                  <p className="text-sm text-espresso/60">Manage technical parameters of your application.</p>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between pb-6 border-b border-warm-taupe/10">
                    <div>
                      <p className="font-medium text-espresso mb-1 flex items-center gap-2">
                        Maintenance Mode
                        {settings.maintenance_mode === 'true' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-berry/10 text-berry">Active</span>
                        )}
                      </p>
                      <p className="text-sm text-espresso/60 max-w-md">When active, the customer-facing website will display a "Coming Soon" or "Under Maintenance" page. Admins can still access the dashboard.</p>
                    </div>
                    <button 
                      onClick={() => handleChange('maintenance_mode', settings.maintenance_mode === 'true' ? 'false' : 'true')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.maintenance_mode === 'true' ? 'bg-berry' : 'bg-warm-taupe/40'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.maintenance_mode === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  
                  <div className="pt-6 grid grid-cols-2 gap-4">
                    <div className="bg-ivory rounded-lg p-4 border border-warm-taupe/20">
                      <p className="text-xs text-espresso/50 uppercase tracking-wider mb-1">Platform Version</p>
                      <p className="font-medium">GLACÉ Commerce v1.2.0</p>
                    </div>
                    <div className="bg-ivory rounded-lg p-4 border border-warm-taupe/20">
                      <p className="text-xs text-espresso/50 uppercase tracking-wider mb-1">Database</p>
                      <p className="font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Connected
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
