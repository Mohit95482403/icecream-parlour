import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageLightbox from './ImageLightbox';
import OptimizedImage from '../OptimizedImage'; // Reuse existing if applicable or use img

import { getImageUrl } from '../../utils/imageUrlHelper';

const ProductGallery = ({ images, productName }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const safeImages = images?.length > 0 ? images : [{ image_url: null, alt_text: productName }];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Main Image */}
      <div 
        className="relative w-full aspect-[4/5] bg-sand rounded-xl overflow-hidden cursor-zoom-in group"
        onClick={() => setIsLightboxOpen(true)}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            src={getImageUrl(safeImages[activeIndex].image_url)}
            alt={safeImages[activeIndex].alt_text || productName}
            className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105"
          />
        </AnimatePresence>
      </div>

      {/* Thumbnails */}
      {safeImages.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative shrink-0 w-20 aspect-square rounded-lg overflow-hidden bg-sand transition-all duration-300 ${
                activeIndex === idx ? 'ring-1 ring-espresso ring-offset-2' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <OptimizedImage 
                src={img.image_url} 
                alt={`Thumbnail ${idx + 1}`} 
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <ImageLightbox 
        images={safeImages} 
        activeIndex={activeIndex} 
        isOpen={isLightboxOpen} 
        onClose={() => setIsLightboxOpen(false)} 
        onNavigate={setActiveIndex} 
      />
    </div>
  );
};

export default ProductGallery;
