import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useProducts } from '../hooks/useProducts';
import { categoryService } from '../services/categoryService';
import { collectionService } from '../services/collectionService';
import Container from '../components/Container';
import ProductGrid from '../components/ProductGrid';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import FilterSidebar from '../components/shop/FilterSidebar';
import MobileFilterDrawer from '../components/shop/MobileFilterDrawer';
import ScrollReveal from '../components/ScrollReveal';
import SEO from '../components/seo/SEO';
import OptimizedImage from '../components/OptimizedImage';
import NewsletterSection from '../sections/NewsletterSection';
import { Search, SlidersHorizontal, X, ArrowRight, Leaf, Award, Heart } from 'lucide-react';

const Shop = () => {
  const { products, pagination, loading, error, filters, updateFilter, clearFilters } = useProducts();
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [catRes, colRes] = await Promise.all([
          categoryService.getCategories(),
          collectionService.getCollections()
        ]);
        if (catRes.success) setCategories(catRes.data.categories);
        if (colRes.success) setCollections(colRes.data.collections);
      } catch (err) {
        console.error('Failed to load filter options');
      }
    };
    fetchOptions();
  }, []);

  // Handle Search Submit
  const handleSearch = (e) => {
    e.preventDefault();
    updateFilter('search', searchInput);
  };

  const handlePagination = (newPage) => {
    updateFilter('page', newPage.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <SEO 
        title="Shop Premium Ice Cream | GLACÉ" 
        description="Explore our collection of small-batch flavours, seasonal favourites and signature classics."
      />
      <div className="pb-32">
        {/* ─── SECTION 1 — SHOP HERO ─────────────────────────────── */}
        <section className="relative min-h-[85vh] md:min-h-screen flex items-center overflow-hidden" aria-label="Shop Hero">
          <div className="absolute inset-0 z-0">
            <OptimizedImage
              src="/images/signature-collection.jpg"
              alt="GLACÉ Ice Cream Collection"
              className="w-full h-full object-cover"
              priority
            />
            {/* Premium Overlay: Dark enough to read text, but soft enough to show the image */}
            <div className="absolute inset-0 bg-gradient-to-b from-espresso/60 via-espresso/30 to-espresso/80" />
          </div>

          <Container className="relative z-10 py-32 md:py-40 text-center text-ivory">
            <div className="max-w-3xl mx-auto flex flex-col items-center">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] mb-6 text-ivory/80"
              >
                THE GLACÉ SHOP
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6 leading-[1.1]"
              >
                Indulge in Something<br className="hidden sm:block" /> Wonderful.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-base sm:text-lg md:text-xl text-ivory/90 font-light max-w-2xl mb-10 leading-relaxed px-4"
              >
                Explore handcrafted flavours, seasonal favourites and little
                luxuries made for every occasion.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <button 
                  onClick={() => window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' })}
                  className="bg-ivory text-espresso px-8 py-4 rounded-pill text-sm font-medium tracking-wide hover:bg-white transition-colors duration-300"
                >
                  SHOP ICE CREAM
                </button>
              </motion.div>
            </div>
          </Container>
        </section>

        <Container className="pt-16 md:pt-24">
          <div className="flex flex-col lg:flex-row gap-12">
            
            <FilterSidebar 
              categories={categories}
              collections={collections}
              filters={filters}
              updateFilter={updateFilter}
              clearFilters={clearFilters}
            />

            {/* Main Content Area */}
            <div className="flex-1">
              
              {/* Toolbar: Mobile Filter Toggle + Sorting */}
              <div className="flex items-center justify-between border-b border-warm-taupe/20 pb-4 mb-8">
                {/* Mobile Filter Toggle */}
                <button 
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className="lg:hidden flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-espresso"
                >
                  <SlidersHorizontal size={16} /> Filters
                </button>
                
                {/* Product Count (Desktop) */}
                <div className="hidden lg:block text-sm text-warm-taupe">
                  {!loading && pagination ? `Showing ${products.length} of ${pagination.totalItems} flavours` : 'Loading...'}
                </div>

                {/* Sorting */}
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-widest text-warm-taupe hidden sm:inline">Sort By</span>
                  <select 
                    value={filters.sort}
                    onChange={(e) => updateFilter('sort', e.target.value)}
                    className="bg-transparent text-sm text-espresso font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="featured">Featured</option>
                    <option value="newest">Newest</option>
                    <option value="price_asc">Price — Low to High</option>
                    <option value="price_desc">Price — High to Low</option>
                    <option value="a-z">A–Z</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Chips */}
              {(filters.category || filters.collection || filters.availability || filters.search) && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {filters.search && (
                    <span className="inline-flex items-center gap-1 bg-warm-taupe/10 px-3 py-1 rounded-full text-sm text-espresso">
                      Search: {filters.search}
                      <button onClick={() => updateFilter('search', '')}><X size={14} /></button>
                    </span>
                  )}
                  {filters.category && (
                    <span className="inline-flex items-center gap-1 bg-warm-taupe/10 px-3 py-1 rounded-full text-sm text-espresso">
                      Category: {categories.find(c => c.slug === filters.category)?.name || filters.category}
                      <button onClick={() => updateFilter('category', '')}><X size={14} /></button>
                    </span>
                  )}
                  {filters.collection && (
                    <span className="inline-flex items-center gap-1 bg-warm-taupe/10 px-3 py-1 rounded-full text-sm text-espresso">
                      Collection: {collections.find(c => c.slug === filters.collection)?.name || filters.collection}
                      <button onClick={() => updateFilter('collection', '')}><X size={14} /></button>
                    </span>
                  )}
                  {filters.availability && (
                    <span className="inline-flex items-center gap-1 bg-warm-taupe/10 px-3 py-1 rounded-full text-sm text-espresso">
                      {filters.availability === 'in-stock' ? 'In Stock' : 'Out of Stock'}
                      <button onClick={() => updateFilter('availability', '')}><X size={14} /></button>
                    </span>
                  )}
                  <button onClick={clearFilters} className="text-sm underline text-warm-taupe ml-2">Clear All</button>
                </div>
              )}

              {/* Error / Grid / Empty State */}
              {error ? (
                <ErrorState title="We Lost the Scoop" description={error} onRetry={() => updateFilter('page', '1')} />
              ) : !loading && products.length === 0 ? (
                <EmptyState onClearFilters={clearFilters} />
              ) : (
                <>
                  <ProductGrid products={products} loading={loading} />
                  
                  {/* Pagination */}
                  {!loading && pagination && pagination.totalPages > 1 && (
                    <div className="mt-16 flex justify-center items-center gap-2">
                      <button 
                        disabled={pagination.page <= 1}
                        onClick={() => handlePagination(pagination.page - 1)}
                        className="px-4 py-2 border border-warm-taupe/30 text-sm font-medium text-espresso disabled:opacity-30 transition-colors hover:bg-sand"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-charcoal/70 px-4">
                        {pagination.page} of {pagination.totalPages}
                      </span>
                      <button 
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => handlePagination(pagination.page + 1)}
                        className="px-4 py-2 border border-warm-taupe/30 text-sm font-medium text-espresso disabled:opacity-30 transition-colors hover:bg-sand"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </Container>

        <MobileFilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          categories={categories}
          collections={collections}
          filters={filters}
          updateFilter={updateFilter}
          clearFilters={clearFilters}
        />
      </div>

      {/* ─── SECTION — WHY GLACÉ ─────────────────────────────────── */}
      <section className="relative py-28 md:py-36 lg:py-44 bg-espresso overflow-hidden" aria-label="Why GLACÉ">

        <Container className="relative z-10">

          {/* Section Header */}
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center mb-20 md:mb-28">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="h-px w-10 bg-gradient-to-r from-transparent to-warm-taupe/30"></div>
                <p className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.3em] text-warm-taupe/70">Our Commitment</p>
                <div className="h-px w-10 bg-gradient-to-l from-transparent to-warm-taupe/30"></div>
              </div>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal leading-[1.05] text-ivory tracking-tight mb-6">
                Why <span className="font-serif italic font-light text-warm-taupe">GLACÉ</span>?
              </h2>
              <p className="text-base md:text-lg text-ivory/45 leading-relaxed font-light max-w-xl mx-auto">
                Every scoop is a promise — of quality, craft, and ingredients that speak for themselves.
              </p>
            </div>
          </ScrollReveal>

          {/* Three Pillars — horizontal editorial layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-ivory/[0.06]">
            {[
              {
                number: '01',
                icon: Leaf,
                title: 'Natural Ingredients',
                subtitle: 'Farm to Scoop',
                description: 'No artificial colours, no preservatives, no shortcuts. We use real fruit, single-origin chocolate, and ingredients sourced directly from farms we trust.',
              },
              {
                number: '02',
                icon: Award,
                title: 'Small-Batch Craft',
                subtitle: 'Handmade Daily',
                description: 'Every batch is made by hand in our kitchen. A slower churn, a watchful eye, and the kind of patience that mass production simply cannot replicate.',
              },
              {
                number: '03',
                icon: Heart,
                title: 'Made With Love',
                subtitle: 'Since Day One',
                description: "We don't just make ice cream — we create moments. The first taste of a new flavour, a shared smile, the warmth of something made with genuine care.",
              }
            ].map((value, index) => (
              <ScrollReveal key={value.title} delay={index * 0.12}>
                <div className={`group relative py-12 md:py-16 px-2 md:px-8 lg:px-12 h-full ${index !== 0 ? 'border-t md:border-t-0 md:border-l border-ivory/[0.06]' : ''}`}>
                  
                  {/* Number + Icon Row */}
                  <div className="flex items-center justify-between mb-8 md:mb-10">
                    <span className="font-display text-sm text-ivory/20 tracking-wide">{value.number}</span>
                    <div className="w-10 h-10 rounded-full border border-ivory/[0.08] flex items-center justify-center group-hover:border-warm-taupe/25 transition-colors duration-500">
                      <value.icon size={16} strokeWidth={1.5} className="text-warm-taupe/60" />
                    </div>
                  </div>

                  {/* Subtitle */}
                  <p className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-medium text-warm-taupe/50 mb-4">
                    {value.subtitle}
                  </p>

                  {/* Title */}
                  <h3 className="font-display text-2xl md:text-[1.65rem] lg:text-3xl font-normal text-ivory/90 mb-5 leading-snug tracking-tight">
                    {value.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm md:text-[14px] text-ivory/40 leading-[1.85] font-light">
                    {value.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Bottom Closing */}
          <ScrollReveal delay={0.3}>
            <div className="mt-16 md:mt-20 pt-10 border-t border-ivory/[0.06] flex items-center justify-center gap-6">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-warm-taupe/15"></div>
              <span className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-ivory/20">
                Ingredients with Character &nbsp;·&nbsp; Craft with Patience
              </span>
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-warm-taupe/15"></div>
            </div>
          </ScrollReveal>

        </Container>
      </section>

      <NewsletterSection />
    </>
  );
};

export default Shop;
