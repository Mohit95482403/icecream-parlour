import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

/**
 * Premium newsletter signup with frontend validation and success/error states.
 * Backend integration will be added in a later day.
 */
const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setStatus('error');
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (!validateEmail(email)) {
      setStatus('error');
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    // Simulate success (no backend yet)
    setStatus('success');
    setEmail('');
  };

  if (status === 'success') {
    return (
      <div className="flex items-center gap-3 text-pistachio">
        <div className="w-8 h-8 rounded-full bg-pistachio/20 flex items-center justify-center">
          <Check size={16} strokeWidth={2} />
        </div>
        <p className="text-sm font-medium text-espresso">
          Welcome to the scoop. Check your inbox soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md" noValidate>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === 'error') setStatus('idle');
            }}
            placeholder="Your email"
            className="w-full px-5 py-3.5 bg-white border border-warm-taupe/25 rounded-pill text-sm focus:outline-none focus:ring-1 focus:ring-espresso focus:border-espresso transition-colors text-center sm:text-left"
            aria-label="Email address for newsletter"
            aria-invalid={status === 'error'}
            aria-describedby={status === 'error' ? 'newsletter-error' : undefined}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary shrink-0 gap-2 w-full sm:w-auto"
          aria-label="Subscribe to newsletter"
        >
          Subscribe
          <ArrowRight size={14} strokeWidth={2} />
        </button>
      </div>
      {status === 'error' && (
        <p id="newsletter-error" className="text-sm text-berry mt-2 ml-1 text-center sm:text-left" role="alert">
          {errorMsg}
        </p>
      )}
    </form>
  );
};

export default Newsletter;
