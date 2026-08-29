import React from 'react';
import Container from '../components/Container';
import ReviewCard from '../components/ReviewCard';
import ScrollReveal from '../components/ScrollReveal';
import { demoReviews } from '../constants/demoReviews';

/**
 * Reviews Section — premium testimonials, not a generic carousel.
 */
const ReviewsSection = () => {
  return (
    <section className="py-24 md:py-32 lg:py-40" aria-label="Customer Reviews">
      <Container>
        <ScrollReveal>
          <div className="text-center mb-12 md:mb-16">
            <p className="caption mb-4">From Our Customers</p>
            <h2 className="heading-xl">
              Words that warm us.
            </h2>
          </div>
        </ScrollReveal>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 md:divide-x md:divide-warm-taupe/15">
          {demoReviews.map((review, index) => (
            <ScrollReveal key={review.id} delay={index * 0.1}>
              <ReviewCard review={review} />
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default ReviewsSection;
