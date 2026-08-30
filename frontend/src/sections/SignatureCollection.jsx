import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Container from '../components/Container';
import OptimizedImage from '../components/OptimizedImage';
import ScrollReveal from '../components/ScrollReveal';

/**
 * Signature Collection — Premium Asymmetrical Editorial Layout
 */
const SignatureCollection = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Very subtle image parallax
  const yImage = useTransform(scrollYProgress, [0, 1], [-15, 15]);

  return (
    <section 
      ref={containerRef}
      className="py-24 md:py-32 lg:py-48 relative overflow-hidden bg-[#FAFAFA]" 
      aria-label="Signature Collection"
    >
      {/* Extremely subtle background depth / noise */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-multiply z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      <Container className="relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-[5%]">
          
          {/* Left: Image (approx 55% on desktop) */}
          <div className="w-full lg:w-[55%] relative group">
            {/* Small floating label */}
            <ScrollReveal delay={0.1} distance={10}>
              <div className="absolute -top-4 -left-2 md:-left-4 z-20 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-warm-taupe/20 shadow-sm">
                <span className="text-[9px] uppercase tracking-[0.2em] text-espresso/80 font-medium">
                  The Original Six
                </span>
              </div>
            </ScrollReveal>

            <ScrollReveal distance={40} duration={1}>
              <div className="overflow-hidden rounded-xl border border-warm-taupe/10 relative">
                <motion.div style={{ y: yImage }} className="h-full w-full">
                  <OptimizedImage
                    src="/images/signature-collection.jpg"
                    alt="The GLACÉ Signature Collection"
                    className="w-full aspect-[4/5] sm:aspect-[4/3] lg:aspect-[3/4] object-cover object-center transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-[1.04]"
                  />
                </motion.div>
                {/* Subtle overlay */}
                <div className="absolute inset-0 bg-espresso/5 pointer-events-none transition-opacity duration-700 group-hover:opacity-0"></div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: Content (approx 40% on desktop) */}
          <div className="w-full lg:w-[40%] flex flex-col justify-center mt-4 lg:mt-16">
            
            <ScrollReveal delay={0.2} distance={20}>
              <div className="flex items-center gap-4 mb-8">
                <span className="text-[10px] md:text-xs font-medium uppercase tracking-[0.25em] text-warm-taupe/80">
                  Collection
                </span>
                <div className="w-12 h-[1px] bg-warm-taupe/30"></div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3} distance={20}>
              <h2 className="font-display flex flex-col mb-8 text-espresso">
                <span className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.1]">The Signature</span>
                <span className="text-3xl md:text-4xl lg:text-5xl font-light italic text-warm-taupe mt-1">Collection</span>
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={0.4} distance={20}>
              <p className="font-serif italic text-lg md:text-xl text-espresso/80 leading-relaxed mb-6">
                Six flavours. One unmistakable character.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.5} distance={20}>
              <p className="text-sm md:text-base text-charcoal/60 leading-[1.8] max-w-[480px] mb-10 font-light">
                Our founding recipes — refined over years, unchanged in their commitment to exceptional ingredients and patient craftsmanship.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.6} distance={20}>
              <div className="flex flex-col items-start gap-6">
                {/* Primary Button */}
                <Link 
                  to="/shop" 
                  className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-espresso text-cream overflow-hidden rounded-full transition-all duration-500 hover:bg-charcoal hover:shadow-lg hover:-translate-y-0.5"
                >
                  <span className="text-xs uppercase tracking-[0.15em] font-medium relative z-10">
                    Explore Collection
                  </span>
                  <ArrowRight size={14} className="relative z-10 transition-transform duration-500 group-hover:translate-x-1.5" />
                </Link>

                {/* Secondary Micro CTA */}
                <Link 
                  to="/our-story" 
                  className="group flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-warm-taupe hover:text-espresso transition-colors duration-300"
                >
                  Discover the story behind the flavours
                  <ArrowRight size={10} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </Container>
    </section>
  );
};

export default SignatureCollection;
