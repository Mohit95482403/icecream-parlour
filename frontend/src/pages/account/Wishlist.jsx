import React from 'react';
import { Link } from 'react-router-dom';
import AccountLayout from '../../layouts/AccountLayout';
import ProductGrid from '../../components/ProductGrid';
import SEO from '../../components/seo/SEO';
import { useWishlist } from '../../hooks/useWishlist';
import { Heart } from 'lucide-react';

const Wishlist = () => {
  const { wishlist, loading, refresh } = useWishlist();

  // Map wishlist items to the format expected by ProductCard
  const mappedProducts = wishlist.map(item => ({
    id: item.productId,
    name: item.name,
    slug: item.slug,
    image: item.image,
    price: item.price,
    availability: item.isAvailable ? 'In Stock' : 'Out of Stock',
    short_description: item.short_description || '',
    category: item.category || 'Ice Cream'
  }));

  return (
    <AccountLayout title="My Wishlist">
      <SEO title="My Wishlist | GLACÉ" noindex={true} />
      
      <div className="mb-8">
        <p className="text-warm-taupe">Your favorite flavors, saved for later.</p>
      </div>
      
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-midnight-charcoal border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : mappedProducts.length > 0 ? (
        <ProductGrid products={mappedProducts} />
      ) : (
        <div className="text-center py-20 bg-cream/30 rounded-2xl border border-warm-taupe/10">
          <div className="flex justify-center mb-6">
            <Heart size={48} className="text-theme-primary opacity-50" />
          </div>
          <h2 className="text-2xl font-playfair text-midnight-charcoal mb-3">Your wishlist is waiting.</h2>
          <p className="text-charcoal/70 mb-8 max-w-sm mx-auto leading-relaxed">
            Save the flavors you love and come back to them anytime.
          </p>
          <Link 
            to="/shop"
            className="btn btn-primary"
          >
            Explore Flavors
          </Link>
        </div>
      )}
    </AccountLayout>
  );
};

export default Wishlist;
