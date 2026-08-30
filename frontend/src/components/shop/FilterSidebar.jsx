import React from 'react';

const FilterSidebar = ({ categories, collections, filters, updateFilter, clearFilters }) => {
  return (
    <aside className="hidden lg:block w-64 shrink-0 space-y-10">
      {/* Category Filter */}
      <div>
        <h3 className="text-xs font-medium uppercase tracking-widest text-warm-taupe mb-4">Category</h3>
        <ul className="space-y-3 text-sm text-charcoal/80">
          <li>
            <button onClick={() => updateFilter('category', '')} className={`transition-colors ${!filters.category ? 'text-espresso font-medium' : 'hover:text-espresso'}`}>All Categories</button>
          </li>
          {categories.map(c => (
            <li key={c.slug}>
              <button onClick={() => updateFilter('category', c.slug)} className={`transition-colors ${filters.category === c.slug ? 'text-espresso font-medium' : 'hover:text-espresso'}`}>{c.name}</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Collection Filter */}
      <div>
        <h3 className="text-xs font-medium uppercase tracking-widest text-warm-taupe mb-4">Collection</h3>
        <ul className="space-y-3 text-sm text-charcoal/80">
          <li>
            <button onClick={() => updateFilter('collection', '')} className={`transition-colors ${!filters.collection ? 'text-espresso font-medium' : 'hover:text-espresso'}`}>All Collections</button>
          </li>
          {collections.map(c => (
            <li key={c.slug}>
              <button onClick={() => updateFilter('collection', c.slug)} className={`transition-colors ${filters.collection === c.slug ? 'text-espresso font-medium' : 'hover:text-espresso'}`}>{c.name}</button>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Availability Filter */}
      <div>
        <h3 className="text-xs font-medium uppercase tracking-widest text-warm-taupe mb-4">Availability</h3>
        <ul className="space-y-3 text-sm text-charcoal/80">
          <li>
            <button onClick={() => updateFilter('availability', '')} className={`transition-colors ${!filters.availability ? 'text-espresso font-medium' : 'hover:text-espresso'}`}>All Items</button>
          </li>
          <li>
            <button onClick={() => updateFilter('availability', 'in-stock')} className={`transition-colors ${filters.availability === 'in-stock' ? 'text-espresso font-medium' : 'hover:text-espresso'}`}>In Stock</button>
          </li>
          <li>
            <button onClick={() => updateFilter('availability', 'out-of-stock')} className={`transition-colors ${filters.availability === 'out-of-stock' ? 'text-espresso font-medium' : 'hover:text-espresso'}`}>Out of Stock</button>
          </li>
        </ul>
      </div>

      <button onClick={clearFilters} className="text-xs uppercase tracking-widest text-warm-taupe hover:text-espresso underline underline-offset-4 mt-6 block">
        Clear All Filters
      </button>
    </aside>
  );
};

export default FilterSidebar;
