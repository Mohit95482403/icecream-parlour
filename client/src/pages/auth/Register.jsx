import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (formData.password.length < 8) {
      return setError('Password must be at least 8 characters long');
    }

    setIsSubmitting(true);
    
    try {
      const { confirmPassword, ...submitData } = formData;
      await register(submitData);
      navigate('/account', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#FAFAFA] px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white p-8 border border-warm-taupe/20"
      >
        <div className="text-center mb-8">
          <h1 className="font-playfair text-3xl text-midnight-charcoal mb-2">Create Account</h1>
          <p className="text-warm-taupe">Join GLACÉ for an exclusive experience</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-midnight-charcoal mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#FAFAFA] border border-warm-taupe/30 focus:border-warm-taupe focus:ring-0 outline-none transition-colors"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm text-midnight-charcoal mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#FAFAFA] border border-warm-taupe/30 focus:border-warm-taupe focus:ring-0 outline-none transition-colors"
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-midnight-charcoal mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#FAFAFA] border border-warm-taupe/30 focus:border-warm-taupe focus:ring-0 outline-none transition-colors"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm text-midnight-charcoal mb-2">Phone (Optional)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#FAFAFA] border border-warm-taupe/30 focus:border-warm-taupe focus:ring-0 outline-none transition-colors"
              placeholder="Your phone number"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-midnight-charcoal mb-2">Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#FAFAFA] border border-warm-taupe/30 focus:border-warm-taupe focus:ring-0 outline-none transition-colors"
                placeholder="Min 8 chars"
              />
            </div>
            <div>
              <label className="block text-sm text-midnight-charcoal mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#FAFAFA] border border-warm-taupe/30 focus:border-warm-taupe focus:ring-0 outline-none transition-colors"
                placeholder="Confirm password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-midnight-charcoal text-white py-4 px-8 font-medium tracking-wide hover:bg-black transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-warm-taupe/20 text-center text-sm text-midnight-charcoal">
          Already have an account?{' '}
          <Link to="/login" className="font-medium underline hover:text-warm-taupe transition-colors">
            SIGN IN
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
