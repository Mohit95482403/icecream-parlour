import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Container from '../components/Container';
import { bannerService } from '../services/bannerService';

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/uploads')) {
    const backendBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
    return `${backendBase}${url}`;
  }
  return url;
};

/**
 * Premium New Flavour Banner Section positioned below the Homepage Hero.
 * Managed dynamically by the Admin.
 */
const NewFlavourBanner = () => {
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchBanner = async () => {
      try {
        setLoading(true);
        const data = await bannerService.getActiveBanner();
        if (isMounted) {
          setBanner(data);
        }
      } catch (err) {
        console.warn('Unable to load new flavour banner:', err);
        if (isMounted) setBanner(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBanner();
    return () => {
      isMounted = false;
    };
  }, []);

  // Loading Skeleton
  if (loading) {
    return (
      <section className="w-full py-6 md:py-10 bg-ivory" aria-label="Loading New Flavour Banner">
        <Container>
          <div className="w-full h-[460px] md:h-[540px] rounded-2xl md:rounded-3xl bg-cream/70 border border-warm-taupe/20 relative overflow-hidden animate-pulse flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-warm-taupe/40">
              <div className="w-10 h-10 rounded-full bg-warm-taupe/10 animate-pulse" />
              <div className="h-6 w-48 bg-warm-taupe/15 rounded-full" />
              <div className="h-4 w-72 bg-warm-taupe/10 rounded-full" />
            </div>
          </div>
        </Container>
      </section>
    );
  }

  // Gracefully hide if no active banner
  if (!banner || banner.status !== 'active') {
    return null;
  }

  const desktopImg = resolveImageUrl(banner.desktop_image);
  const mobileImg = resolveImageUrl(banner.mobile_image) || desktopImg;
  const productUrl = banner.product_slug ? `/product/${banner.product_slug}` : '/shop';
  const displayPrice = banner.product_price ? `₹${parseFloat(banner.product_price).toFixed(0)}` : null;

  return (
    <section className="w-full py-6 md:py-10 bg-ivory overflow-hidden" aria-label="New Flavour Announcement">
      <Container>
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-espresso text-ivory shadow-xl border border-warm-taupe/15 group">
          
          {/* Responsive Background Images (<picture> for optimal desktop/mobile switching) */}
          <div className="absolute inset-0 z-0">
            <picture>
              {banner.mobile_image && (
                <source media="(max-width: 767px)" srcSet={mobileImg} />
              )}
              <img
                src={desktopImg}
                alt={banner.title}
                className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
                loading="lazy"
              />
            </picture>
            
            {/* Multi-stage Luxury Gradient Overlay for readable contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-espresso/95 via-espresso/70 to-espresso/20 md:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-transparent to-espresso/30 md:hidden" />
          </div>

          {/* Banner Content Container */}
          <div className="relative z-10 p-8 sm:p-12 md:p-16 lg:p-20 min-h-[460px] md:min-h-[520px] flex flex-col justify-center max-w-xl lg:max-w-2xl">
            
            {/* Eyebrow / Badge */}
            {banner.badge && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 mb-4 md:mb-6"
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 backdrop-blur-md border border-gold/35 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  <Sparkles size={12} className="shrink-0" />
                  {banner.badge}
                </span>
              </motion.div>
            )}

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-ivory font-normal leading-[1.1] mb-4 tracking-tight"
            >
              {banner.title}
            </motion.h2>

            {/* Short Description */}
            {banner.description && (
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-sm sm:text-base md:text-lg text-ivory/80 font-light leading-relaxed mb-6 max-w-lg"
              >
                {banner.description}
              </motion.p>
            )}

            {/* Price & CTA Row */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-5 sm:gap-8 pt-2"
            >
              {displayPrice && (
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-warm-taupe/80 font-medium">Starting from</span>
                  <span className="font-display text-2xl sm:text-3xl text-gold font-medium">{displayPrice}</span>
                </div>
              )}

              <Link
                to={productUrl}
                className="inline-flex items-center justify-center gap-3 px-7 sm:px-9 py-3.5 sm:py-4 rounded-pill bg-ivory text-espresso hover:bg-white hover:shadow-lg font-medium text-xs sm:text-sm uppercase tracking-[0.15em] transition-all duration-300 transform active:scale-95 group/btn"
              >
                <span>{banner.cta_text || 'Discover Now'}</span>
                <ArrowRight size={16} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
              </Link>
            </motion.div>

          </div>

          {/* Decorative Corner Accent */}
          <div className="hidden lg:block absolute bottom-6 right-8 z-10 pointer-events-none">
            <span className="text-[10px] uppercase tracking-[0.3em] text-ivory/30 font-light">
              Crafted in Limited Batches
            </span>
          </div>

        </div>
      </Container>
    </section>
  );
};

export default NewFlavourBanner;
