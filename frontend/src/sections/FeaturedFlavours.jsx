import React from 'react';
import Container from '../components/Container';
import SectionHeading from '../components/SectionHeading';
import ProductCard from '../components/ProductCard';
import ScrollReveal from '../components/ScrollReveal';
import { demoProducts } from '../constants/demoProducts';

/**
 * Featured Flavours section — displays signature products in a premium grid.
 */
const FeaturedFlavours = () => {
  // Show first 4 featured products
  const featured = demoProducts.slice(0, 4);

  return (
    <section className="py-24 md:py-32 lg:py-40" aria-label="Signature Flavours">
      <Container>
        <ScrollReveal>
          <SectionHeading
            caption="Our Flavours"
            title="Signature Flavours"
            description="A few favourites, made to be remembered."
            className="mb-16 md:mb-20"
          />
        </ScrollReveal>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {featured.map((product, index) => (
            <ScrollReveal key={product.id} delay={index * 0.1}>
              <ProductCard product={product} />
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default FeaturedFlavours;
