import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Container from '../components/Container';
import OptimizedImage from '../components/OptimizedImage';
import ScrollReveal from '../components/ScrollReveal';

/**
 * Parlour Experience — introduces the physical store experience.
 */
const ParlourSection = () => {
  return (
    <section className="relative overflow-hidden" aria-label="Parlour Experience">
      {/* Full-width background image */}
      <div className="relative">
        <OptimizedImage
          src="/images/parlour-interior.jpg"
          alt="GLACÉ parlour interior — warm lighting, marble counters, customers enjoying ice cream"
          className="w-full aspect-[16/9] md:aspect-[21/9]"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-espresso/40 to-transparent" />

        {/* Content overlaid on image */}
        <div className="absolute inset-0 flex items-end">
          <Container className="pb-16 md:pb-24">
            <ScrollReveal>
              <div className="max-w-xl text-ivory">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-ivory/60 mb-4">
                  The Parlour
                </p>
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-normal leading-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
                  Come for the scoop.<br />
                  Stay for the moment.
                </h2>
                <p className="text-sm md:text-base text-ivory/70 leading-relaxed mb-8 max-w-md">
                  Our parlours are designed for slow afternoons, 
                  late-night cravings and everything between.
                </p>
                <Link to="/stores" className="btn bg-ivory text-espresso hover:bg-ivory/90 gap-2">
                  Find a Parlour
                  <ArrowRight size={14} strokeWidth={2} />
                </Link>
              </div>
            </ScrollReveal>
          </Container>
        </div>
      </div>
    </section>
  );
};

export default ParlourSection;
