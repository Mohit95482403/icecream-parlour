import React from 'react';
import { Minus, Plus } from 'lucide-react';

const QuantitySelector = ({ quantity, onUpdateQuantity, disabled = false, max = 10 }) => {
  return (
    <div className="flex items-center">
      <div className={`flex items-center border border-warm-taupe/30 h-12 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <button
          type="button"
          onClick={() => onUpdateQuantity(Math.max(1, quantity - 1))}
          disabled={disabled || quantity <= 1}
          className="w-12 h-full flex items-center justify-center text-charcoal hover:bg-sand transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="Decrease quantity"
        >
          <Minus size={16} strokeWidth={1.5} />
        </button>
        
        <div 
          className="w-12 h-full flex items-center justify-center text-sm font-medium text-espresso"
          aria-live="polite"
        >
          {quantity}
        </div>
        
        <button
          type="button"
          onClick={() => onUpdateQuantity(Math.min(max, quantity + 1))}
          disabled={disabled || quantity >= max}
          className="w-12 h-full flex items-center justify-center text-charcoal hover:bg-sand transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="Increase quantity"
        >
          <Plus size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};

export default QuantitySelector;
