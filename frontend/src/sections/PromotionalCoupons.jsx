import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, Copy, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Container from '../components/Container';
import ScrollReveal from '../components/ScrollReveal';
import couponService from '../services/couponService';

const PromotionalCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await couponService.getActiveCoupons();
        if (response?.success && response.data?.length > 0) {
          setCoupons(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch coupons:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  if (loading || coupons.length === 0) {
    return null;
  }

  const getDiscountDisplay = (coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${parseFloat(coupon.discount_value)}% OFF`;
    }
    if (coupon.discount_type === 'fixed') {
      return `₹${parseFloat(coupon.discount_value)} OFF`;
    }
    return 'Free Delivery';
  };

  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-white" aria-label="Current Promotions">
      <Container>
        <div className="flex flex-col items-center text-center mb-16">
          <ScrollReveal>
            <div className="flex items-center gap-4 mb-6 justify-center">
              <div className="w-8 h-[1px] bg-warm-taupe/30"></div>
              <span className="text-[10px] md:text-xs font-medium uppercase tracking-[0.25em] text-warm-taupe/80">
                Exclusive Offers
              </span>
              <div className="w-8 h-[1px] bg-warm-taupe/30"></div>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-espresso mb-4">
              Seasonal <span className="font-light italic text-warm-taupe">Privileges</span>
            </h2>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {coupons.map((coupon, index) => (
            <ScrollReveal key={coupon.code} delay={0.1 * (index + 1)} distance={20}>
              <div className="group relative bg-[#FAFAFA] rounded-xl border border-champagne overflow-hidden flex flex-col h-full hover:shadow-lg hover:border-warm-taupe/30 transition-all duration-500">
                
                {/* Top Banner Area */}
                <div className="bg-espresso text-ivory p-6 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-700">
                    <Tag size={64} />
                  </div>
                  <h3 className="font-display text-3xl mb-1 relative z-10">{getDiscountDisplay(coupon)}</h3>
                  <p className="text-xs uppercase tracking-widest text-cream/70 font-medium relative z-10">
                    {coupon.minimum_order_amount > 0 
                      ? `On orders above ₹${parseFloat(coupon.minimum_order_amount)}`
                      : 'Applicable to all orders'}
                  </p>
                </div>

                {/* Bottom Content Area */}
                <div className="p-6 flex-1 flex flex-col items-center text-center justify-between">
                  <div className="mb-6 w-full">
                    <div className="text-xs text-warm-taupe uppercase tracking-wider mb-2">Use Code</div>
                    <button 
                      onClick={() => handleCopy(coupon.code)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white border border-champagne border-dashed rounded-lg group/btn hover:border-espresso hover:bg-sand/30 transition-colors"
                    >
                      <span className="font-mono text-lg font-bold text-espresso tracking-widest">
                        {coupon.code}
                      </span>
                      {copiedCode === coupon.code ? (
                        <CheckCircle2 size={18} className="text-matcha" />
                      ) : (
                        <Copy size={18} className="text-warm-taupe group-hover/btn:text-espresso transition-colors" />
                      )}
                    </button>
                    {copiedCode === coupon.code && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-matcha mt-2 font-medium"
                      >
                        Code copied to clipboard
                      </motion.div>
                    )}
                  </div>
                  
                  <Link 
                    to="/shop" 
                    className="text-xs uppercase tracking-[0.15em] font-medium text-espresso hover:text-warm-taupe transition-colors inline-block relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[1px] after:bg-espresso/20 hover:after:bg-warm-taupe/50"
                  >
                    Shop Collection
                  </Link>
                </div>
                
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default PromotionalCoupons;
