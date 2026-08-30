import React from 'react';
import Container from '../components/Container';
import Newsletter from '../components/Newsletter';
import ScrollReveal from '../components/ScrollReveal';

/**
 * Newsletter Section — premium editorial intro + signup form.
 */
const NewsletterSection = () => {
  return (
    <section className="py-24 md:py-32 lg:py-40 bg-cream" aria-label="Newsletter signup">
      <Container>
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal>
            <p className="caption mb-4">Stay Connected</p>
            <h2 className="heading-xl mb-4">
              The scoop, in your inbox.
            </h2>
            <p className="body-lg text-warm-taupe mb-10">
              New flavours, seasonal drops and stories
              from behind the counter.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="flex justify-center">
              <Newsletter />
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
};

export default NewsletterSection;
