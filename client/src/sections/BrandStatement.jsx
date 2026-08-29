import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Container from '../components/Container';
import OptimizedImage from '../components/OptimizedImage';

/**
 * Brand Statement — full-width editorial typography section.
 * Premium luxury food/fashion brand visual language with parallax imagery.
 */
const BrandStatement = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  // Sophisticated parallax effects for a premium feel
  const yImage = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const yText = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);
  
  return (
    <section 
      ref={containerRef}
      className="relative flex items-center justify-center min-h-[80vh] md:min-h-screen py-24 overflow-hidden bg-espresso text-ivory" 
      aria-label="Brand philosophy"
    >
      {/* Background Image with Parallax & Dramatic Vignette */}
      <motion.div 
        className="absolute inset-0 z-0 opacity-40"
        style={{ y: yImage, scale: 1.1 }}
      >
        <OptimizedImage
          src="/images/signature-collection.jpg"
          alt="GLACÉ Artisan Ice Cream"
          className="w-full h-full object-cover object-center grayscale-[30%]"
        />
        {/* Luxury moody vignette overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/40 to-espresso"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-espresso/80 via-transparent to-espresso/80 md:opacity-100 opacity-60"></div>
      </motion.div>

      {/* Subtle Noise Texture for Organic Film Feel */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      <Container className="relative z-10 w-full h-full flex items-center justify-center">
        <motion.div 
          style={{ y: yText }}
          className="max-w-5xl mx-auto flex flex-col items-center text-center px-4 md:px-8"
        >
          {/* Subtle Top Label */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center mb-14 md:mb-20"
          >
            <span className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.3em] text-warm-taupe/90 mb-6">
              01 &nbsp; / &nbsp; Philosophy
            </span>
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-warm-taupe/50 to-transparent"></div>
          </motion.div>

          {/* Main Hero Statement */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12 md:mb-16 relative"
          >
            <h2 className="font-display text-3xl sm:text-5xl md:text-7xl lg:text-[6.5rem] font-normal leading-[1.1] text-ivory tracking-tight mx-auto relative z-10 drop-shadow-sm">
              We don't just make<br />
              <span className="relative inline-block mt-2 sm:mt-3 md:mt-6">
                <span className="font-serif italic text-warm-taupe font-light">ice cream.</span>
                <span className="absolute -bottom-2 md:-bottom-4 left-0 w-full h-px bg-warm-taupe/30"></span>
              </span>
            </h2>
          </motion.div>

          {/* Secondary Editorial Statement */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <p className="font-sans text-sm sm:text-lg md:text-xl lg:text-[1.35rem] text-ivory/70 leading-[1.8] max-w-[28ch] md:max-w-2xl mx-auto font-light tracking-wide">
              A slower way to make something simple<br className="hidden md:block" />
              <span className="text-ivory italic pr-1">taste extraordinary.</span>
            </p>
          </motion.div>

          {/* Bottom Brand Stamp */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-20 md:mt-28 flex items-center justify-center gap-6 w-full"
          >
            <div className="w-12 md:w-20 h-px bg-gradient-to-r from-transparent to-warm-taupe/20"></div>
            <span className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-ivory/40">
              Crafted with Patience
            </span>
            <div className="w-12 md:w-20 h-px bg-gradient-to-l from-transparent to-warm-taupe/20"></div>
          </motion.div>

        </motion.div>
      </Container>
    </section>
  );
};

export default BrandStatement;

