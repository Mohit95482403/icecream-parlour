import React, { useEffect, useState } from 'react';
import ProductCard from '../ProductCard';
import { productService } from '../../services/productService';

const RelatedProducts = ({ slug }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        setLoading(true);
        const res = await productService.getRelatedProducts(slug);
        if (res.success) {
          setProducts(res.data.products);
        }
      } catch (error) {
        console.error('Failed to load related products', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchRelated();
  }, [slug]);

  if (loading) {
    return (
      <section className="py-20 border-t border-sand">
        <div className="container mx-auto px-6">
          <h2 className="font-display text-3xl text-espresso mb-10 text-center uppercase tracking-wider">
            You May Also Love
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-sand rounded-lg aspect-[3/4] mb-5"></div>
                <div className="h-4 bg-sand rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-sand rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-20 border-t border-sand">
      <div className="container mx-auto px-6 max-w-7xl">
        <h2 className="font-display text-3xl text-espresso mb-10 text-center uppercase tracking-wider">
          You May Also Love
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedProducts;
