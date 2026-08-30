import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, ShieldCheck } from 'lucide-react';
import SEO from '../../components/seo/SEO';

const LoginSelect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // If we came from a specific page (like checkout), we want to pass that state forward
  const fromState = location.state?.from || null;

  const handleCustomerLogin = () => {
    navigate('/login', { state: { from: fromState } });
  };

  const handleAdminLogin = () => {
    navigate('/admin/login');
  };

  const handleBack = () => {
    if (fromState) {
      navigate(fromState);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-cream pt-32 pb-20 px-4">
      <SEO title="Login Options - GLACÉ" description="Select how you would like to sign in to your GLACÉ account." />
      
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={handleBack}
          className="flex items-center text-warm-taupe hover:text-espresso transition-colors mb-12"
        >
          <ArrowLeft size={20} className="mr-2" />
          <span className="font-medium tracking-wide">Back</span>
        </button>

        <div className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl text-espresso mb-4">WELCOME BACK</h1>
          <p className="text-lg text-warm-taupe font-medium tracking-wide">How would you like to continue?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-3xl mx-auto">
          {/* Customer Login Card */}
          <div 
            onClick={handleCustomerLogin}
            className="group cursor-pointer bg-ivory rounded-2xl p-8 md:p-10 border border-warm-taupe/10 hover:border-espresso/30 hover:shadow-xl transition-all duration-300 flex flex-col h-full text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-espresso transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>
            
            <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-6 text-espresso group-hover:scale-110 transition-transform duration-300">
              <User size={32} strokeWidth={1.5} />
            </div>
            
            <h2 className="font-display text-2xl text-espresso mb-4">CUSTOMER LOGIN</h2>
            <p className="text-warm-taupe leading-relaxed mb-8 flex-grow">
              Shop, order, and manage your premium ice cream experience. View your past orders and saved addresses.
            </p>
            
            <button className="btn btn-outline w-full group-hover:bg-espresso group-hover:text-ivory transition-colors duration-300">
              Continue
            </button>
          </div>

          {/* Admin Login Card */}
          <div 
            onClick={handleAdminLogin}
            className="group cursor-pointer bg-ivory rounded-2xl p-8 md:p-10 border border-warm-taupe/10 hover:border-espresso/30 hover:shadow-xl transition-all duration-300 flex flex-col h-full text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gold transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>
            
            <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-6 text-espresso group-hover:scale-110 transition-transform duration-300">
              <ShieldCheck size={32} strokeWidth={1.5} />
            </div>
            
            <h2 className="font-display text-2xl text-espresso mb-4">ADMIN LOGIN</h2>
            <p className="text-warm-taupe leading-relaxed mb-8 flex-grow">
              Manage orders, products, inventory, and customers. Secure administration access portal.
            </p>
            
            <button className="btn btn-outline w-full group-hover:bg-espresso group-hover:text-ivory transition-colors duration-300">
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSelect;
