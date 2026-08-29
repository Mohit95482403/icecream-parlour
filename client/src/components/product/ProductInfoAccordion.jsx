import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const AccordionItem = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-warm-taupe/20 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left group"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium uppercase tracking-widest text-espresso group-hover:text-charcoal transition-colors">
          {title}
        </span>
        <span className="text-warm-taupe transition-transform duration-300">
          {isOpen ? <Minus size={16} strokeWidth={1.5} /> : <Plus size={16} strokeWidth={1.5} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-sm text-charcoal/80 leading-relaxed whitespace-pre-line">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProductInfoAccordion = ({ product }) => {
  const { ingredients, allergens, nutrition_info } = product;

  // Only render accordion if there's data to show
  if (!ingredients && !allergens && !nutrition_info) return null;

  return (
    <div className="mt-12 border-t border-warm-taupe/20">
      {ingredients && (
        <AccordionItem title="Ingredients">
          {ingredients}
        </AccordionItem>
      )}
      
      {allergens && (
        <AccordionItem title="Allergen Information">
          {allergens}
        </AccordionItem>
      )}
      
      {nutrition_info && (
        <AccordionItem title="Nutrition Information">
          {nutrition_info}
        </AccordionItem>
      )}
      
      <AccordionItem title="Storage & Serving">
        Keep frozen below -18°C. For the best texture, allow the gelato to rest at room temperature for 5-10 minutes before serving.
      </AccordionItem>
    </div>
  );
};

export default ProductInfoAccordion;
