import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { useCart } from '../context/CartContext';

import Container from '../components/Container';
import ProductGallery from '../components/product/ProductGallery';
import VariantSelector from '../components/product/VariantSelector';
import QuantitySelector from '../components/product/QuantitySelector';
import ProductInfoAccordion from '../components/product/ProductInfoAccordion';
import RelatedProducts from '../components/product/RelatedProducts';
import RecentlyViewed from '../components/product/RecentlyViewed';
import ProductReviewSection from '../components/reviews/ProductReviewSection';
import ErrorState from '../components/ErrorState';
import SEO from '../components/seo/SEO';
import { useWishlist } from '../hooks/useWishlist';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { Heart } from 'lucide-react';

const ProductDetails = () => {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addRecentlyViewed } = useRecentlyViewed();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await productService.getProductBySlug(slug);
        
        if (res.success && res.data.product) {
          const p = res.data.product;
          setProduct(p);
          
          // Auto-select first available variant, or fallback to first variant
          if (p.variants?.length > 0) {
            const firstAvailable = p.variants.find(v => v.availability_status === 'in_stock') || p.variants[0];
            setSelectedVariant(firstAvailable);
          }
          
          addRecentlyViewed(p);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    
    // Reset state on slug change
    setQuantity(1);
    fetchProduct();
    window.scrollTo(0, 0);
  }, [slug]);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    if (selectedVariant.availability_status !== 'in_stock') return;
    
    addItem(product, selectedVariant, quantity);
  };

  if (error) {
    return (
      <div className="pt-32 pb-24 min-h-[70vh] flex flex-col items-center justify-center">
        <ErrorState 
          title="This Scoop Doesn't Exist" 
          description="The flavour you're looking for may have melted away." 
        />
        <Link to="/shop" className="mt-8 px-8 py-3 bg-espresso text-ivory text-sm font-medium uppercase tracking-widest transition-colors hover:bg-charcoal">
          Explore All Flavours
        </Link>
      </div>
    );
  }

  if (loading || !product) {
    return (
      <div className="pt-32 pb-24">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Gallery Skeleton */}
            <div className="w-full aspect-[4/5] bg-sand/40 relative overflow-hidden rounded-xl">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ivory/20 to-transparent animate-[shimmer_1.5s_infinite]" />
            </div>
            {/* Info Skeleton */}
            <div className="space-y-6 pt-10">
              <div className="h-4 bg-sand/40 rounded-pill w-1/4 relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ivory/20 to-transparent animate-[shimmer_1.5s_infinite]" />
              </div>
              <div className="h-10 bg-sand/40 rounded w-3/4 relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ivory/20 to-transparent animate-[shimmer_1.5s_infinite]" />
              </div>
              <div className="h-20 bg-sand/40 rounded w-full relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ivory/20 to-transparent animate-[shimmer_1.5s_infinite]" />
              </div>
              <div className="h-8 bg-sand/40 rounded w-1/3 relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ivory/20 to-transparent animate-[shimmer_1.5s_infinite]" />
              </div>
              <div className="space-y-4 pt-8">
                <div className="h-12 bg-sand/40 rounded w-full relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ivory/20 to-transparent animate-[shimmer_1.5s_infinite]" />
                </div>
                <div className="h-12 bg-sand/40 rounded w-full relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ivory/20 to-transparent animate-[shimmer_1.5s_infinite]" />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const isAvailable = selectedVariant?.availability_status === 'in_stock';
  const isWished = isInWishlist(product?.id);

  return (
    <>
      <SEO 
        title={`${product.name} Ice Cream | GLACÉ`}
        description={product.short_description}
        image={product.images?.[0]?.image_url ? (product.images[0].image_url.startsWith('http') ? product.images[0].image_url : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '')}${product.images[0].image_url}`) : undefined}
      />
      <div className="pt-24 pb-0">
      
      {/* Breadcrumbs */}
      <Container className="mb-8 hidden md:block">
        <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-widest text-warm-taupe">
          <ol className="flex items-center gap-2">
            <li><Link to="/" className="hover:text-espresso transition-colors">Home</Link></li>
            <li><span className="text-sand-dark">/</span></li>
            <li><Link to="/shop" className="hover:text-espresso transition-colors">Shop</Link></li>
            <li><span className="text-sand-dark">/</span></li>
            {product.category?.name && (
              <>
                <li><Link to={`/shop?category=${product.category.slug}`} className="hover:text-espresso transition-colors">{product.category.name}</Link></li>
                <li><span className="text-sand-dark">/</span></li>
              </>
            )}
            <li className="text-espresso font-medium" aria-current="page">{product.name}</li>
          </ol>
        </nav>
      </Container>

      {/* Product Main Section */}
      <Container className="mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          
          {/* Left: Gallery */}
          <div>
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Right: Info & Purchase */}
          <div className="flex flex-col pt-0 lg:pt-10">
            {/* Category / Collection label */}
            <p className="text-xs font-medium uppercase tracking-widest text-warm-taupe mb-4">
              {product.collections?.[0]?.name || product.category?.name || 'Ice Cream'}
            </p>
            
            {/* Title & Wishlist */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="font-display text-4xl md:text-5xl text-espresso">
                {product.name}
              </h1>
              <button 
                onClick={() => toggleWishlist(product)}
                className="p-3 rounded-full bg-sand/30 hover:bg-sand transition-colors text-espresso mt-1"
                aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart size={24} fill={isWished ? 'currentColor' : 'none'} className={isWished ? 'text-theme-primary' : ''} />
              </button>
            </div>
            
            {/* Short Description */}
            <p className="body-lg text-charcoal/80 mb-8 max-w-lg">
              {product.short_description}
            </p>

            {/* Price */}
            <div className="flex items-center gap-4 mb-10">
              <span className="text-2xl font-medium text-espresso">
                ₹{selectedVariant?.price || '0.00'}
              </span>
              {selectedVariant?.compare_at_price && (
                <span className="text-lg text-warm-taupe line-through">
                  ₹{selectedVariant.compare_at_price}
                </span>
              )}
            </div>

            {/* Variant Selector */}
            {product.variants?.length > 0 && (
              <VariantSelector 
                variants={product.variants} 
                selectedVariant={selectedVariant}
                onSelectVariant={setSelectedVariant}
              />
            )}

            {/* Purchase Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-2">
              <div className="sm:w-32">
                <QuantitySelector 
                  quantity={quantity}
                  onUpdateQuantity={setQuantity}
                  disabled={!isAvailable}
                />
              </div>
              <button
                onClick={handleAddToCart}
                disabled={!isAvailable}
                className={`
                  flex-1 py-4 flex items-center justify-center text-sm font-medium uppercase tracking-widest transition-all duration-300
                  ${isAvailable 
                    ? 'bg-espresso text-ivory hover:bg-charcoal shadow-sm' 
                    : 'bg-sand text-warm-taupe cursor-not-allowed'
                  }
                `}
              >
                {isAvailable ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>

            {/* Out of Stock Message */}
            {!isAvailable && (
              <div className="mb-8 mt-4 p-4 border border-sand bg-sand/20 rounded-md flex flex-col gap-1">
                <span className="text-sm font-medium text-red-700 uppercase tracking-widest">Currently unavailable</span>
                <span className="text-sm text-charcoal/80">Sorry, this flavour is temporarily out of stock.</span>
              </div>
            )}
            {isAvailable && <div className="mb-8" />}

            {/* Delivery Info */}
            <div className="p-6 bg-sand/30 border border-sand rounded-sm mb-12">
              <h4 className="text-xs font-medium uppercase tracking-widest text-espresso mb-2">Delivery</h4>
              <p className="text-sm text-charcoal/70 leading-relaxed">
                Delivered fresh to your door. Enter your location at checkout to confirm delivery availability. Keep frozen below -18°C.
              </p>
            </div>

            {/* The Story */}
            {product.description && (
              <div className="mb-12">
                <h3 className="font-display text-2xl text-espresso mb-4 uppercase tracking-widest">
                  The Story
                </h3>
                <div className="text-charcoal/80 leading-relaxed whitespace-pre-line text-sm md:text-base">
                  {product.description}
                </div>
              </div>
            )}

            {/* Accordion */}
            <ProductInfoAccordion product={product} />

          </div>
        </div>
      </Container>

      {/* Reviews */}
      <Container>
        <ProductReviewSection productId={product.id} />
      </Container>

      {/* Related Products */}
      <RelatedProducts slug={product.slug} />

      {/* Recently Viewed */}
      <RecentlyViewed />

    </div>
    </>
  );
};

export default ProductDetails;
