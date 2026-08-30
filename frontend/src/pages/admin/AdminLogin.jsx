import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import SEO from '../../components/seo/SEO';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { adminLogin } = useAdminAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      await adminLogin({ email, password });
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center items-center p-4">
      <SEO title="Admin Login - GLACÉ" noindex={true} />
      
      <div className="w-full max-w-md bg-ivory p-8 rounded-xl shadow-sm border border-warm-taupe/10">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold tracking-widest text-espresso mb-2">GLACÉ</h1>
          <p className="caption">Admin Portal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-berry/10 border border-berry/20 rounded-lg text-sm text-berry">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block label text-espresso/80 mb-2">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="admin@glace.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="block label text-espresso/80">Password</label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-12"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-espresso/50 hover:text-espresso"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full mt-2"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-ivory border-t-transparent rounded-full animate-spin"></div>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-warm-taupe/20 text-center">
          <Link to="/login-select" className="text-sm font-medium text-espresso/70 hover:text-espresso transition-colors">
            ← Back to Login Options
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
