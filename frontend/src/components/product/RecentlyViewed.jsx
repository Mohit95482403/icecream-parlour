import React from 'react';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import Container from '../Container';
import ProductCard from '../ProductCard';

const RecentlyViewed = () => {
  const { recentlyViewed } = useRecentlyViewed();

  if (!recentlyViewed || recentlyViewed.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-sand/20">
      <Container>
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="font-display text-3xl md:text-4xl text-espresso mb-4">
              Recently Viewed
            </h2>
            <p className="body-lg text-charcoal/80 max-w-xl">
              Flavours you've explored recently.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {recentlyViewed.slice(0, 4).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default RecentlyViewed;
