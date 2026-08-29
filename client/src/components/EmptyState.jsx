import React from 'react';

const EmptyState = ({ onClearFilters }) => {
  return (
    <div className="py-24 flex flex-col items-center justify-center text-center max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-sand/60 border border-warm-taupe/20 flex items-center justify-center mb-6 shadow-xs">
        <span className="text-2xl">🍦</span>
      </div>
      <h3 className="font-display text-2xl font-medium text-espresso mb-3 tracking-wide">
        Nothing Scooped Up
      </h3>
      <p className="text-charcoal/70 body-sm mb-8 max-w-sm leading-relaxed">
        We couldn't find any flavours matching your current filters or search term. 
        Try adjusting your criteria to discover something new.
      </p>
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="btn btn-primary text-xs"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
};

export default EmptyState;
