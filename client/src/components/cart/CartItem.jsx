import React from 'react';
import { X } from 'lucide-react';
import QuantitySelector from '../product/QuantitySelector';
import { useCart } from '../../context/CartContext';
import OptimizedImage from '../OptimizedImage';

const CartItem = ({ item, issue }) => {
  const { updateQuantity, removeItem } = useCart();
  
  const isOutOfStock = issue?.code === 'OUT_OF_STOCK';
  const isInsufficient = issue?.code === 'INSUFFICIENT_STOCK';
  const isUnavailable = issue?.code === 'UNAVAILABLE' || issue?.code === 'PRODUCT_NOT_FOUND';
  
  const hasError = isOutOfStock || isInsufficient || isUnavailable;

  return (
    <div className={`flex gap-4 py-6 border-b border-warm-taupe/20 last:border-0 ${hasError ? 'bg-red-50/30' : ''}`}>
      {/* Thumbnail */}
      <div className="w-20 h-24 bg-sand rounded-md overflow-hidden shrink-0">
        <OptimizedImage 
          src={item.image} 
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Details */}
      <div className="flex flex-col flex-1 justify-between py-1">
        <div>
          <div className="flex justify-between items-start gap-4">
            <h4 className={`font-display text-lg leading-none ${hasError ? 'text-charcoal/60' : 'text-espresso'}`}>
              {item.name}
            </h4>
            <button 
              onClick={() => removeItem(item.productId, item.variantId)}
              className="text-warm-taupe hover:text-charcoal transition-colors p-1 -mr-1 -mt-1"
              aria-label={`Remove ${item.name} from cart`}
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
          <p className="text-xs uppercase tracking-widest text-warm-taupe mt-1">
            {item.variantName}
          </p>
          {hasError && (
            <p className="text-xs font-medium text-red-600 mt-2">
              {issue.message}
            </p>
          )}
        </div>

        <div className="flex justify-between items-end mt-4">
          <div className="w-28">
            <QuantitySelector 
              quantity={item.quantity}
              onUpdateQuantity={(newQuantity) => updateQuantity(item.productId, item.variantId, newQuantity)}
              disabled={isOutOfStock || isUnavailable}
            />
          </div>
          <p className={`text-sm font-medium ${hasError ? 'text-charcoal/50 line-through' : 'text-espresso'}`}>
            ₹{item.price * item.quantity}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
