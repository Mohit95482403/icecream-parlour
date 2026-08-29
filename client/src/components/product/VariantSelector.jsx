import React from 'react';

const VariantSelector = ({ variants, selectedVariant, onSelectVariant }) => {
  if (!variants || variants.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-end mb-3">
        <h3 className="text-xs font-medium uppercase tracking-widest text-warm-taupe">Size</h3>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {variants.map((variant) => {
          const isSelected = selectedVariant?.id === variant.id;
          const isAvailable = variant.availability_status === 'in_stock';
          
          return (
            <button
              key={variant.id}
              onClick={() => isAvailable && onSelectVariant(variant)}
              disabled={!isAvailable}
              aria-pressed={isSelected}
              className={`
                relative px-5 py-2.5 text-sm font-medium transition-all duration-300 border
                ${isSelected 
                  ? 'border-espresso bg-espresso text-ivory shadow-sm' 
                  : 'border-warm-taupe/30 text-charcoal hover:border-espresso'
                }
                ${!isAvailable && 'opacity-40 cursor-not-allowed bg-sand border-warm-taupe/20 hover:border-warm-taupe/20'}
              `}
            >
              {variant.size}
              
              {/* Optional: Strike-through or indicator for out of stock if needed */}
              {!isAvailable && (
                <span className="absolute top-1/2 left-0 w-full h-px bg-charcoal/30 -rotate-12 transform origin-center pointer-events-none"></span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Availability Messaging */}
      {selectedVariant && selectedVariant.availability_status !== 'in_stock' && (
        <p className="mt-3 text-sm text-charcoal/60 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-charcoal/40"></span>
          Currently out of stock
        </p>
      )}
    </div>
  );
};

export default VariantSelector;
