import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileFilterDrawer = ({ isOpen, onClose, categories, collections, filters, updateFilter, clearFilters }) => {
  // Prevent scrolling on body when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleFilterChange = (key, value) => {
    updateFilter(key, value);
    // Don't auto-close drawer on selection so they can select multiple
  };

  const handleClear = () => {
    clearFilters();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-espresso/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-[300px] max-w-[80vw] bg-ivory shadow-xl z-50 flex flex-col lg:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-warm-taupe/20">
              <h2 className="text-xl font-serif text-espresso">Filters</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-warm-taupe/10 rounded-full transition-colors"
              >
                <X size={20} className="text-warm-taupe" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Category Filter */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-widest text-warm-taupe mb-4">Category</h3>
                <ul className="space-y-4 text-sm text-charcoal/80">
                  <li>
                    <button onClick={() => handleFilterChange('category', '')} className={`transition-colors ${!filters.category ? 'text-espresso font-medium' : 'hover:text-espresso'}`}>All Categories</button>
                  </li>
                  {categories.map(c => (
                    <li key={c.slug}>
                      <button onClick={() => handleFilterChange('category', c.slug)} className={`transition-colors ${filters.category === c.slug ? 'text-espresso font-medium' : 'hover:text-espresso'}`}>{c.name}</button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Collection Filter */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-widest text-warm-taupe mb-4">Collection</h3>
                <ul className="space-y-4 text-sm text-charcoal/80">
                  <li>
                    <button onClick={() => handleFilterChange('collection', '')} className={`transition-colors ${!filters.collection ? 'text-espresso font-medium' : 'hover:text-espresso'}`}>All Collections</button>
                  </li>
                  {collections.map(c => (
                    <li key={c.slug}>
                      <button onClick={() => handleFilterChange('collection', c.slug)} className={`transition-colors ${filters.collection === c.slug ? 'text-espresso font-medium' : 'hover:text-espresso'}`}>{c.name}</button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Availability Filter */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-widest text-warm-taupe mb-4">Availability</h3>
                <ul className="space-y-4 text-sm text-charcoal/80">
                  <li>
                    <button onClick={() => handleFilterChange('availability', '')} className={`transition-colors ${!filters.availability ? 'text-espresso font-medium' : 'hover:text-espresso'}`}>All Items</button>
                  </li>
                  <li>
                    <button onClick={() => handleFilterChange('availability', 'in-stock')} className={`transition-colors ${filters.availability === 'in-stock' ? 'text-espresso font-medium' : 'hover:text-espresso'}`}>In Stock</button>
                  </li>
                  <li>
                    <button onClick={() => handleFilterChange('availability', 'out-of-stock')} className={`transition-colors ${filters.availability === 'out-of-stock' ? 'text-espresso font-medium' : 'hover:text-espresso'}`}>Out of Stock</button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-warm-taupe/20 bg-ivory">
              <div className="flex gap-4">
                <button 
                  onClick={handleClear}
                  className="flex-1 py-3 border border-warm-taupe/30 text-espresso font-medium text-sm rounded-full hover:bg-warm-taupe/10 transition-colors"
                >
                  Clear All
                </button>
                <button 
                  onClick={onClose}
                  className="flex-1 py-3 bg-espresso text-white font-medium text-sm rounded-full hover:bg-charcoal transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileFilterDrawer;
