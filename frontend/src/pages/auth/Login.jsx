import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = (typeof location.state?.from === 'string' ? location.state.from : location.state?.from?.pathname) || '/account';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#FAFAFA] px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 border border-warm-taupe/20"
      >
        <div className="text-center mb-8">
          <h1 className="font-playfair text-3xl text-midnight-charcoal mb-2">Welcome Back</h1>
          <p className="text-warm-taupe">Sign in to your GLACÉ account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-midnight-charcoal mb-2">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#FAFAFA] border border-warm-taupe/30 focus:border-warm-taupe focus:ring-0 outline-none transition-colors"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm text-midnight-charcoal mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#FAFAFA] border border-warm-taupe/30 focus:border-warm-taupe focus:ring-0 outline-none transition-colors"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-midnight-charcoal text-white py-4 px-8 font-medium tracking-wide hover:bg-black transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-warm-taupe/20 text-center text-sm text-midnight-charcoal flex flex-col gap-3">
          <div>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium underline hover:text-warm-taupe transition-colors">
              CREATE ACCOUNT
            </Link>
          </div>
          <div>
            <Link to="/login-select" state={{ from: location.state?.from }} className="font-medium hover:text-warm-taupe transition-colors">
              ← Back to Login Options
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
