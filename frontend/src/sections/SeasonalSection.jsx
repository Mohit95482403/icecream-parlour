import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Container from '../components/Container';
import OptimizedImage from '../components/OptimizedImage';
import ScrollReveal from '../components/ScrollReveal';

/**
 * Seasonal Collection — visually distinct limited-time section.
 */
const SeasonalSection = () => {
  return (
    <section className="py-24 md:py-32 lg:py-40 overflow-hidden" aria-label="Seasonal Collection">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Content — order reversed on desktop for visual variety */}
          <ScrollReveal className="order-2 lg:order-1">
            <div className="lg:pr-4">
              <span className="inline-block px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] bg-gold/15 text-gold border border-gold/20 rounded-pill mb-6">
                Limited Season
              </span>
              <h2 className="display-lg mb-4">
                Alphonso<br />Mango
              </h2>
              <p className="caption mb-6">For a Limited Season</p>
              <p className="body-lg text-warm-taupe mb-4 max-w-md">
                The king of mangoes, turned into a bright, sun-kissed sorbet — 
                available only while the season lasts.
              </p>
              <p className="body-sm text-charcoal/50 mb-10 max-w-md">
                Made with hand-selected Alphonso mangoes from Ratnagiri. 
                No artificial colours, no concentrates. Just the real fruit, 
                churned slowly into something remarkable.
              </p>
              <Link to="/product/alphonso-mango" className="btn btn-primary gap-2">
                Discover Seasonal
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>
          </ScrollReveal>

          {/* Image */}
          <ScrollReveal delay={0.15} className="order-1 lg:order-2">
            <div className="overflow-hidden rounded-lg">
              <OptimizedImage
                src="/images/seasonal-mango.jpg"
                alt="Limited season Alphonso Mango sorbet with fresh Ratnagiri mangoes"
                className="aspect-[4/3] lg:aspect-[3/2] w-full"
              />
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
};

export default SeasonalSection;
