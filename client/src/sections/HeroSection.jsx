import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Container from '../components/Container';
import OptimizedImage from '../components/OptimizedImage';

/**
 * Hero section — the most important section of Day 2.
 * Full-viewport editorial hero with staggered Framer Motion animations.
 */
const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" aria-label="Hero">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <OptimizedImage
          src="/images/hero-main.jpg"
          alt="Artisan ice cream crafted with exceptional ingredients"
          className="w-full h-full"
          priority
        />
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-ivory/95 via-ivory/80 to-ivory/30 md:from-ivory/90 md:via-ivory/70 md:to-transparent" />
      </div>

      {/* Content */}
      <Container className="relative z-10 py-32 md:py-40">
        <div className="max-w-2xl">
          {/* Caption */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="caption mb-6"
          >
            Artisan Ice Cream
          </motion.p>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="display-xl mb-6"
          >
            Crafted<br />
            for the<br />
            slow moments.
          </motion.h1>

          {/* Supporting text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
            className="body-lg text-charcoal/70 mb-10 max-w-lg"
          >
            Small-batch ice cream made with exceptional ingredients
            and a little more patience.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-wrap gap-4"
          >
            <Link to="/shop" className="btn btn-primary gap-2">
              Explore Flavours
              <ArrowRight size={14} strokeWidth={2} />
            </Link>
            <Link to="/our-story" className="btn btn-outline">
              Our Story
            </Link>
          </motion.div>
        </div>
      </Container>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:block"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="w-5 h-8 rounded-pill border-2 border-espresso/30 flex items-start justify-center p-1"
        >
          <div className="w-1 h-2 rounded-full bg-espresso/40" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
