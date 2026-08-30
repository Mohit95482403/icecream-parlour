import React, { useState, useEffect } from 'react';
import Container from '../components/Container';
import SectionHeading from '../components/SectionHeading';
import ProductCard from '../components/ProductCard';
import ScrollReveal from '../components/ScrollReveal';
import { productService } from '../services/productService';

/**
 * Featured Flavours section — dynamically displays signature flavours from the authoritative database.
 */
const FeaturedFlavours = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const res = await productService.getProducts({ limit: 4, sort: 'featured' });
        if (isMounted && res.success && res.data?.products) {
          setProducts(res.data.products);
        }
      } catch (err) {
        console.error('Failed to load featured flavours:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFeatured();
    return () => { isMounted = false; };
  }, []);

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

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="animate-pulse space-y-4">
                <div className="bg-sand/60 aspect-[3/4] rounded-lg"></div>
                <div className="h-3 bg-sand/80 rounded w-1/3"></div>
                <div className="h-5 bg-sand/80 rounded w-3/4"></div>
                <div className="h-4 bg-sand/60 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Product Grid from Live Catalog */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {products.map((product, index) => (
              <ScrollReveal key={product.id} delay={index * 0.1}>
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        )}

        {/* Fallback empty state if catalog has no active products */}
        {!loading && products.length === 0 && (
          <div className="text-center py-12 text-warm-taupe">
            <p>Our seasonal batch is currently being prepared. Check back shortly!</p>
          </div>
        )}
      </Container>
    </section>
  );
};

export default FeaturedFlavours;
