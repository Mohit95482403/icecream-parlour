import { useState } from 'react';
import AccountLayout from '../../layouts/AccountLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, checkAuth } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.patch('/customers/me', formData);
      await checkAuth(); // refresh user context
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AccountLayout title="Profile Settings">
      <p className="text-sm text-warm-taupe mb-8">Manage your personal information and contact preferences.</p>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-2">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#FAFAFA] border border-warm-taupe/30 rounded-lg focus:border-espresso focus:ring-1 focus:ring-espresso outline-none text-sm transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-2">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#FAFAFA] border border-warm-taupe/30 rounded-lg focus:border-espresso focus:ring-1 focus:ring-espresso outline-none text-sm transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-2">Email Address (Read-only)</label>
          <input
            type="email"
            readOnly
            value={user?.email || ''}
            className="w-full px-4 py-3 bg-cream/40 border border-warm-taupe/20 rounded-lg text-gray-500 cursor-not-allowed outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-2">Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+91 98765 43210"
            className="w-full px-4 py-3 bg-[#FAFAFA] border border-warm-taupe/30 rounded-lg focus:border-espresso focus:ring-1 focus:ring-espresso outline-none text-sm transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary text-xs"
        >
          {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
        </button>
      </form>
    </AccountLayout>
  );
};

export default Profile;
