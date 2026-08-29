import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import AccountLayout from '../../layouts/AccountLayout';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, MapPin, ArrowLeft } from 'lucide-react';

const Addresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false
  });

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers/me/addresses');
      if (res.success && res.data?.addresses) {
        setAddresses(res.data.addresses);
      }
    } catch (error) {
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEdit = (addr) => {
    setFormData({
      fullName: addr.full_name,
      phone: addr.phone,
      addressLine1: addr.address_line_1,
      addressLine2: addr.address_line_2 || '',
      landmark: addr.landmark || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postal_code,
      country: addr.country || 'India',
      isDefault: Boolean(addr.is_default)
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    
    try {
      const res = await api.delete(`/customers/me/addresses/${id}`);
      if (res.success) {
        toast.success('Address deleted successfully');
        fetchAddresses();
      }
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (addr) => {
    try {
      const res = await api.put(`/customers/me/addresses/${addr.id}`, {
        fullName: addr.full_name,
        phone: addr.phone,
        addressLine1: addr.address_line_1,
        addressLine2: addr.address_line_2 || '',
        landmark: addr.landmark || '',
        city: addr.city,
        state: addr.state,
        postalCode: addr.postal_code,
        country: addr.country || 'India',
        isDefault: true
      });
      
      if (res.success) {
        toast.success('Default address updated');
        fetchAddresses();
      }
    } catch (error) {
      toast.error('Failed to set default address');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        // Update
        const res = await api.put(`/customers/me/addresses/${editingId}`, formData);
        if (res.success) {
          toast.success('Address updated successfully');
        }
      } else {
        // Create
        const payload = { ...formData, isDefault: addresses.length === 0 ? true : formData.isDefault };
        const res = await api.post('/customers/me/addresses', payload);
        if (res.success) {
          toast.success('Address added successfully');
        }
      }
      
      setShowForm(false);
      setEditingId(null);
      setFormData({
        fullName: '', phone: '', addressLine1: '', addressLine2: '', 
        landmark: '', city: '', state: '', postalCode: '', country: 'India', isDefault: false
      });
      fetchAddresses();
      
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to save address');
    }
  };

  return (
    <AccountLayout title="Saved Addresses">
      {!showForm ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-warm-taupe">Manage your delivery and billing locations.</p>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  fullName: '', phone: '', addressLine1: '', addressLine2: '', 
                  landmark: '', city: '', state: '', postalCode: '', country: 'India', isDefault: false
                });
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-espresso text-ivory text-xs uppercase tracking-widest font-medium rounded-pill hover:bg-charcoal transition-colors"
            >
              <Plus size={14} />
              Add New
            </button>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 gap-4">
               {[1, 2].map(i => (
                 <div key={i} className="p-6 border border-warm-taupe/20 rounded-xl bg-warm-taupe/5 animate-pulse h-48"></div>
               ))}
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-16 px-4 border border-dashed border-warm-taupe/30 rounded-2xl bg-cream/30">
              <MapPin className="mx-auto h-10 w-10 text-warm-taupe mb-3 opacity-60" />
              <h3 className="text-lg font-playfair text-espresso mb-1">No addresses saved yet</h3>
              <p className="text-sm text-charcoal/70 mb-6">Add a delivery address to ensure seamless checkout.</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary text-xs"
              >
                Add Your First Address
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div key={addr.id} className="p-5 border border-warm-taupe/20 rounded-xl relative group hover:border-espresso/40 transition-colors bg-white shadow-xs">
                  {addr.is_default ? (
                    <span className="absolute top-4 right-4 text-[10px] uppercase tracking-widest bg-espresso text-ivory px-2.5 py-0.5 rounded-full font-medium">
                      Default
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleSetDefault(addr)}
                      className="absolute top-4 right-4 text-[10px] uppercase tracking-wider text-espresso border border-espresso/30 px-2.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-espresso hover:text-ivory"
                    >
                      Set Default
                    </button>
                  )}
                  
                  <h4 className="font-playfair text-base font-semibold text-espresso mb-1 pr-16">{addr.full_name}</h4>
                  <div className="text-sm text-charcoal/75 space-y-1 mb-4">
                    <p className="text-xs text-warm-taupe">{addr.phone}</p>
                    <p className="mt-2 text-sm">{addr.address_line_1}</p>
                    {addr.address_line_2 && <p className="text-sm">{addr.address_line_2}</p>}
                    <p className="text-sm">{addr.city}, {addr.state} {addr.postal_code}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-4 border-t border-warm-taupe/15">
                    <button 
                      onClick={() => handleEdit(addr)}
                      className="flex items-center gap-1.5 text-xs text-charcoal hover:text-espresso font-medium transition-colors"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(addr.id)}
                      className="flex items-center gap-1.5 text-xs text-berry hover:text-berry/80 font-medium transition-colors"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <button 
              onClick={() => setShowForm(false)}
              className="p-2 hover:bg-warm-taupe/10 rounded-full transition-colors"
              aria-label="Back to addresses"
            >
              <ArrowLeft size={18} className="text-espresso" />
            </button>
            <h3 className="font-playfair text-xl font-medium text-espresso">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-1.5">Full Name *</label>
                <input required type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-warm-taupe/30 focus:border-espresso focus:ring-1 focus:ring-espresso bg-white text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-1.5">Phone Number *</label>
                <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-warm-taupe/30 focus:border-espresso focus:ring-1 focus:ring-espresso bg-white text-sm outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-1.5">Address Line 1 *</label>
              <input required type="text" name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-warm-taupe/30 focus:border-espresso focus:ring-1 focus:ring-espresso bg-white text-sm outline-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-1.5">Address Line 2 (Optional)</label>
              <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-warm-taupe/30 focus:border-espresso focus:ring-1 focus:ring-espresso bg-white text-sm outline-none" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-1.5">PIN Code *</label>
                <input required type="text" maxLength={6} name="postalCode" value={formData.postalCode} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-warm-taupe/30 focus:border-espresso focus:ring-1 focus:ring-espresso bg-white text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-1.5">City *</label>
                <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-warm-taupe/30 focus:border-espresso focus:ring-1 focus:ring-espresso bg-white text-sm outline-none" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-1.5">State *</label>
                <input required type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-warm-taupe/30 focus:border-espresso focus:ring-1 focus:ring-espresso bg-white text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-1.5">Country</label>
                <input readOnly type="text" value="India" className="w-full px-4 py-3 rounded-lg border border-warm-taupe/20 bg-cream/40 text-gray-500 cursor-not-allowed text-sm" />
              </div>
            </div>

            {!editingId && addresses.length > 0 && (
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleInputChange} className="w-4 h-4 text-espresso border-warm-taupe/40 rounded focus:ring-espresso" />
                  <span className="text-sm text-charcoal">Set as default address</span>
                </label>
              </div>
            )}

            <div className="pt-4 flex gap-3">
              <button type="submit" className="btn btn-primary text-xs">
                Save Address
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline text-xs">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </AccountLayout>
  );
};

export default Addresses;
