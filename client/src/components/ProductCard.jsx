import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';
import OptimizedImage from './OptimizedImage';
import { useWishlist } from '../hooks/useWishlist';

/**
 * Premium product card handling API data structure.
 */
const ProductCard = ({ product }) => {
  const { name, slug, short_description, price, image, badge, availability, category } = product;
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWished = isInWishlist(product.id);
  const isOutOfStock = availability === 'Out of Stock';

  const handleWishlistClick = (e) => {
    e.preventDefault(); // Prevent navigating to product details
    toggleWishlist(product);
  };

  return (
    <Link
      to={`/product/${slug}`}
      className={`group block ${isOutOfStock ? 'opacity-70 grayscale-[0.3]' : ''}`}
      aria-label={`View ${name}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden rounded-lg mb-5 aspect-[3/4] bg-sand">
        <OptimizedImage
          src={image || '/images/placeholder-tubs.jpg'}
          alt={name}
          className="w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
          {badge && (
            <span className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] bg-ivory/90 backdrop-blur-sm text-espresso rounded-pill">
              {badge}
            </span>
          )}
          {isOutOfStock && (
            <span className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] bg-charcoal/90 backdrop-blur-sm text-ivory rounded-pill">
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className="absolute top-4 right-4 p-2 rounded-full bg-ivory/80 backdrop-blur-sm text-espresso hover:bg-ivory transition-colors z-10"
          aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={18} fill={isWished ? 'currentColor' : 'none'} className={isWished ? 'text-theme-primary' : ''} />
        </button>

        {/* Hover CTA overlay */}
        <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-espresso/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:flex items-end justify-center">
          <span className="inline-flex items-center gap-2 text-ivory text-sm font-medium tracking-wide">
            {isOutOfStock ? 'View Details' : 'Explore Flavour'}
            <ArrowRight size={14} strokeWidth={2} />
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium uppercase tracking-widest text-warm-taupe">
          {category || 'Ice Cream'}
        </p>
        <h3 className="font-display text-lg font-medium leading-snug group-hover:text-gold transition-colors">
          {name}
        </h3>
        <p className="body-sm text-charcoal/70 line-clamp-2">
          {short_description}
        </p>
        <p className="text-sm font-medium text-espresso tracking-wide mt-2">
          {price ? `From ₹${price}` : 'Price Unavailable'}
        </p>
      </div>
    </Link>
  );
};

export default ProductCard;
