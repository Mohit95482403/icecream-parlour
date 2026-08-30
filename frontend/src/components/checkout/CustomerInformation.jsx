import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const CustomerInformation = ({ customer, setCustomer, nextStep, errors, setErrors }) => {
  const { isAuthenticated } = useAuth();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    let isValid = true;
    const newErrors = { ...errors };

    if (!customer.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }
    
    if (!customer.email.trim() || !/^\S+@\S+\.\S+$/.test(customer.email)) {
      newErrors.email = 'Valid email is required';
      isValid = false;
    }
    
    if (!customer.phone.trim() || !/^\+?[0-9]{10,14}$/.test(customer.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'Valid 10-digit phone number is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (validate()) {
      nextStep();
    }
  };

  return (
    <div className="mb-10 animate-fade-in">
      <div className="flex justify-between items-end mb-6 border-b border-sand-dark pb-4">
        <h2 className="text-2xl font-serif text-charcoal">Customer Information</h2>
        {!isAuthenticated && (
          <div className="text-sm">
            <Link to="/login-select" state={{ from: '/checkout' }} className="text-espresso font-medium hover:underline">Log in</Link>
            <span className="text-charcoal-light mx-2">or</span>
            <Link to="/register" state={{ from: '/checkout' }} className="text-espresso font-medium hover:underline">Create account</Link>
          </div>
        )}
      </div>
      
      <form onSubmit={handleContinue} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-charcoal mb-2">First Name *</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={customer.firstName}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border ${errors.firstName ? 'border-red-400 focus:ring-red-500' : 'border-sand-dark focus:ring-espresso'} bg-white text-charcoal focus:outline-none focus:ring-2 transition-colors`}
              placeholder="Narendra"
              autoComplete="given-name"
            />
            {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-charcoal mb-2">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={customer.lastName}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-sand-dark bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-espresso transition-colors"
              placeholder="Modi"
              autoComplete="family-name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={customer.email}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-red-400 focus:ring-red-500' : 'border-sand-dark focus:ring-espresso'} bg-white text-charcoal focus:outline-none focus:ring-2 transition-colors`}
            placeholder="narendra@example.com"
            autoComplete="email"
          />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-charcoal mb-2">Phone Number *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={customer.phone}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-lg border ${errors.phone ? 'border-red-400 focus:ring-red-500' : 'border-sand-dark focus:ring-espresso'} bg-white text-charcoal focus:outline-none focus:ring-2 transition-colors`}
            placeholder="e.g. 9876543210"
            autoComplete="tel"
          />
          {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
          <p className="mt-2 text-xs text-charcoal-light">We'll use this for delivery updates.</p>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full md:w-auto px-8 py-4 bg-espresso text-cream font-medium rounded-full hover:bg-charcoal transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-espresso"
          >
            Continue to Delivery
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerInformation;
