import React from 'react';

/**
 * Skeleton loading placeholder for ProductCard.
 */
const ProductCardSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="bg-sand/40 rounded-lg aspect-[3/4] mb-5 relative overflow-hidden">
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ivory/20 to-transparent animate-[shimmer_1.5s_infinite]" />
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-sand/40 rounded-pill w-1/4" />
        <div className="h-5 bg-sand/40 rounded w-3/4" />
        <div className="h-4 bg-sand/40 rounded w-full" />
        <div className="h-4 bg-sand/40 rounded w-1/3" />
      </div>
    </div>
  );
};

/**
 * Skeleton loading placeholder for images.
 */
export const ImageSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-cream animate-pulse rounded-lg ${className}`} />
  );
};

export default ProductCardSkeleton;
