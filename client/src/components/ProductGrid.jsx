import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-8 sm:gap-y-12">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-sand rounded-lg aspect-[3/4] mb-4"></div>
            <div className="h-3.5 bg-sand rounded w-1/4 mb-2"></div>
            <div className="h-5 bg-sand rounded w-3/4 mb-2"></div>
            <div className="h-3.5 bg-sand rounded w-full mb-3"></div>
            <div className="h-4 bg-sand rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-8 sm:gap-y-12">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;
