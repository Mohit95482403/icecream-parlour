import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const ImageLightbox = ({ images, activeIndex, isOpen, onClose, onNavigate }) => {
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onNavigate(activeIndex > 0 ? activeIndex - 1 : images.length - 1);
    if (e.key === 'ArrowRight') onNavigate(activeIndex < images.length - 1 ? activeIndex + 1 : 0);
  }, [isOpen, activeIndex, images.length, onClose, onNavigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown, isOpen]);

  if (!isOpen) return null;

  const currentImage = images[activeIndex];

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/95 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Close Button */}
        <button 
          className="absolute top-6 right-6 p-2 text-ivory/70 hover:text-ivory transition-colors z-50"
          onClick={onClose}
          aria-label="Close lightbox"
        >
          <X size={32} strokeWidth={1.5} />
        </button>

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button 
              className="absolute left-6 p-4 text-ivory/50 hover:text-ivory transition-colors z-50"
              onClick={(e) => { e.stopPropagation(); onNavigate(activeIndex > 0 ? activeIndex - 1 : images.length - 1); }}
              aria-label="Previous image"
            >
              <ChevronLeft size={48} strokeWidth={1} />
            </button>
            <button 
              className="absolute right-6 p-4 text-ivory/50 hover:text-ivory transition-colors z-50"
              onClick={(e) => { e.stopPropagation(); onNavigate(activeIndex < images.length - 1 ? activeIndex + 1 : 0); }}
              aria-label="Next image"
            >
              <ChevronRight size={48} strokeWidth={1} />
            </button>
          </>
        )}

        {/* Main Image */}
        <div className="relative w-full max-w-5xl max-h-[85vh] p-4 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <motion.img 
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            src={currentImage?.image_url || '/images/placeholder-tubs.jpg'} 
            alt={currentImage?.alt_text || 'Product image'} 
            className="max-w-full max-h-[85vh] object-contain select-none"
          />
        </div>

        {/* Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-ivory/70 tracking-widest text-sm font-medium">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageLightbox;
