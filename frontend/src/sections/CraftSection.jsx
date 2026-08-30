import React from 'react';
import Container from '../components/Container';
import OptimizedImage from '../components/OptimizedImage';
import ScrollReveal from '../components/ScrollReveal';

const craftPrinciples = [
  {
    number: '01',
    title: 'Exceptional Ingredients',
    description: 'We source directly — Sicilian pistachios, Alphonso mangoes, Madagascar vanilla. Every flavour begins with an ingredient worth celebrating.',
  },
  {
    number: '02',
    title: 'Small-Batch Craft',
    description: 'Each batch is made by hand in limited quantities. We choose depth of flavour over volume, every single time.',
  },
  {
    number: '03',
    title: 'Slow Churning',
    description: 'Our signature texture comes from patience — a slower churn that creates a denser, creamier, more satisfying ice cream.',
  },
  {
    number: '04',
    title: 'Made Fresh',
    description: 'From kitchen to parlour in hours, not weeks. We believe freshness is the most underrated ingredient of all.',
  },
];

/**
 * Craft Section — shows the brand's 4 principles with ingredient imagery.
 */
const CraftSection = () => {
  return (
    <section className="py-24 md:py-32 lg:py-40 bg-cream" aria-label="Our Craft">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-start">
          {/* Content */}
          <div>
            <ScrollReveal>
              <p className="caption mb-4">Our Craft</p>
              <h2 className="display-lg mb-12 md:mb-16">
                Made with<br />intention.
              </h2>
            </ScrollReveal>

            <div className="space-y-10 md:space-y-12">
              {craftPrinciples.map((item, index) => (
                <ScrollReveal key={item.number} delay={index * 0.1}>
                  <div className="flex gap-6">
                    <span className="font-display text-3xl md:text-4xl text-warm-taupe/40 shrink-0 leading-none mt-1">
                      {item.number}
                    </span>
                    <div>
                      <h3 className="font-display text-lg md:text-xl font-medium mb-2">
                        {item.title}
                      </h3>
                      <p className="body-sm text-warm-taupe leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* Image */}
          <ScrollReveal delay={0.2} className="lg:sticky lg:top-32">
            <div className="overflow-hidden rounded-lg">
              <OptimizedImage
                src="/images/ingredients.jpg"
                alt="Exceptional raw ingredients — vanilla beans, pistachios, cocoa, strawberries, cream"
                className="aspect-[4/5] w-full"
              />
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
};

export default CraftSection;
