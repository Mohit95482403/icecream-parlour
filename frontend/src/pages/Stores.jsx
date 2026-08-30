import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Clock, Phone } from 'lucide-react';
import Container from '../components/Container';
import OptimizedImage from '../components/OptimizedImage';
import ScrollReveal from '../components/ScrollReveal';
import NewsletterSection from '../sections/NewsletterSection';
import SEO from '../components/seo/SEO';

/**
 * Stores Page — A premium hybrid page for the physical store experience and shopping.
 */
const Stores = () => {

  return (
    <>
      <SEO
        title="Store | GLACÉ"
        description="Discover our collection of carefully crafted flavors and sweet essentials, made to bring a little more joy to every moment."
      />

      {/* ─── SECTION 1 — STORE HERO ─────────────────────────────────── */}
      <section className="relative min-h-[85vh] md:min-h-screen flex items-center overflow-hidden" aria-label="Store Hero">
        <div className="absolute inset-0 z-0">
          <OptimizedImage
            src="/images/store-hero.jpg"
            alt="The elegant GLACÉ ice cream parlour at golden hour"
            className="w-full h-full object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ivory/95 via-ivory/85 to-ivory/40 md:from-ivory/90 md:via-ivory/70 md:to-transparent" />
        </div>

        <Container className="relative z-10 py-32 md:py-40">
          <div className="max-w-2xl">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="caption mb-6 uppercase tracking-[0.2em] font-semibold text-warm-taupe"
            >
              The GLACÉ Store
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="display-xl mb-6 text-espresso leading-[1.1]"
            >
              A Little More Sweetness,<br />Wherever You Are.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
              className="body-lg text-charcoal/70 max-w-lg mb-10"
            >
              Discover our collection of carefully crafted flavors and sweet essentials,
              made to bring a little more joy to every moment.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Link
                to="/shop"
                className="btn btn-primary gap-2"
              >
                Shop Online
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ─── SECTION 1.5 — THE PARLOUR EXPERIENCE ───────────────────── */}
      <section className="py-24 md:py-32 lg:py-40 bg-cream overflow-hidden" aria-label="The Parlour Experience">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-center">
            
            {/* Left: Collage */}
            <div className="relative order-2 md:order-1 mt-10 md:mt-0">
              <ScrollReveal>
                <div className="relative z-10 w-4/5 rounded-2xl md:rounded-[1.5rem] overflow-hidden shadow-2xl">
                  <OptimizedImage
                    src="/images/journal-craft.jpg"
                    alt="Artisan crafting ice cream"
                    className="w-full aspect-[4/5] object-cover hover:scale-105 transition-transform duration-[2s] ease-out"
                  />
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.2} className="absolute -bottom-16 -right-4 md:-right-8 w-2/3 z-20">
                <div className="rounded-2xl md:rounded-[1.5rem] overflow-hidden shadow-2xl border-8 border-cream">
                  <OptimizedImage
                    src="/images/our-story-moments.jpg"
                    alt="Enjoying ice cream at the parlour"
                    className="w-full aspect-square object-cover hover:scale-105 transition-transform duration-[2s] ease-out"
                  />
                </div>
              </ScrollReveal>
              {/* Decorative element */}
              <div className="absolute top-1/3 -left-12 w-32 h-32 bg-warm-taupe/10 rounded-full blur-[40px] pointer-events-none"></div>
            </div>

            {/* Right: Text Content */}
            <div className="order-1 md:order-2 md:pl-10 lg:pl-16">
              <ScrollReveal delay={0.1}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px w-8 bg-warm-taupe/40"></div>
                  <span className="text-[10px] md:text-xs font-medium uppercase tracking-[0.25em] text-warm-taupe/80">
                    The Experience
                  </span>
                </div>
                
                <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-normal text-espresso leading-[1.1] tracking-tight mb-8">
                  More Than <br className="hidden lg:block" /> <span className="font-serif italic font-light text-warm-taupe">Just a Scoop.</span>
                </h2>
                
                <p className="text-base md:text-lg text-espresso/60 leading-[1.8] font-light mb-8 max-w-md">
                  Our parlour is designed to be a sanctuary. A place where time slows down, flavors are savored, and every detail — from the heavy brass spoons to the curved marble counter — is considered.
                </p>

                <p className="text-sm md:text-[15px] text-espresso/50 leading-[1.8] font-light mb-12 max-w-md">
                  Whether you're stopping by for a quick treat or settling in for an afternoon of tasting, we've created a space that celebrates the ritual of ice cream making and sharing.
                </p>

                <div className="flex items-center gap-12 border-t border-espresso/10 pt-10">
                  <div>
                    <span className="block font-display text-3xl text-espresso mb-2">12</span>
                    <span className="text-[9px] font-medium uppercase tracking-[0.25em] text-warm-taupe/80">Daily Flavors</span>
                  </div>
                  <div className="w-px h-12 bg-espresso/10"></div>
                  <div>
                    <span className="block font-display text-3xl text-espresso mb-2">04</span>
                    <span className="text-[9px] font-medium uppercase tracking-[0.25em] text-warm-taupe/80">Seasonal Editions</span>
                  </div>
                </div>
              </ScrollReveal>
            </div>
            
          </div>
        </Container>
      </section>

      {/* ─── SECTION 2 — VISIT OUR STORE ────────────────────────────── */}
      <section className="py-24 md:py-32 lg:py-40 bg-espresso text-ivory" aria-label="Visit Our Store">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Store Information */}
            <div>
              <ScrollReveal>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory/60 mb-6">Our Location</p>
                <h2 className="display-lg mb-8">Come Find Us</h2>
                <p className="body-lg text-ivory/80 leading-relaxed mb-12">
                  There’s something special about enjoying a scoop right where it’s made.
                  Visit our flagship parlour to taste exclusive seasonal releases, chat with
                  our team, and take a moment to unwind.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.1}>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <MapPin className="text-ivory/60 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <h4 className="font-medium text-lg mb-1">Flagship Parlour</h4>
                      <p className="text-ivory/70 text-sm">124 Artisan Ave, Culinary District<br />New York, NY 10012</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Clock className="text-ivory/60 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <h4 className="font-medium text-lg mb-1">Hours</h4>
                      <p className="text-ivory/70 text-sm">Monday – Sunday<br />11:00 AM – 10:00 PM</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <Phone className="text-ivory/60 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <h4 className="font-medium text-lg mb-1">Contact</h4>
                      <p className="text-ivory/70 text-sm">hello@glace-artisan.com<br />(555) 123-4567</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.2}>
                <div className="mt-12">
                  <a href="#" className="btn bg-ivory text-espresso hover:bg-white transition-colors duration-300">
                    Get Directions
                  </a>
                </div>
              </ScrollReveal>
            </div>

            {/* Store Image */}
            <ScrollReveal delay={0.3}>
              <div className="relative rounded-lg overflow-hidden shadow-2xl h-[500px]">
                <OptimizedImage
                  src="/images/parlour-interior.jpg"
                  alt="Inside the GLACÉ parlour"
                  className="w-full h-full object-cover"
                />
              </div>
            </ScrollReveal>
          </div>
        </Container>
      </section>

      {/* ─── SECTION 5 — NEWSLETTER ─────────────────────────────────── */}
      <NewsletterSection />
    </>
  );
};

export default Stores;
