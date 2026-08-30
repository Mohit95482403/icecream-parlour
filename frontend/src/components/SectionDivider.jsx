import React from 'react';
import { motion } from 'framer-motion';

/**
 * SectionDivider — A premium decorative divider to separate major page sections.
 */
const SectionDivider = () => {
  return (
    <div className="w-full flex justify-center items-center py-6 md:py-8 pointer-events-none" aria-hidden="true">
      <motion.div 
        initial={{ opacity: 0, scaleX: 0.9 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-center w-full max-w-[85%] md:max-w-2xl mx-auto"
      >
        <div className="h-px bg-gradient-to-r from-transparent to-warm-taupe/40 flex-1"></div>
        <div className="mx-4 md:mx-8 shrink-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rotate-45 border border-warm-taupe/60"></div>
        </div>
        <div className="h-px bg-gradient-to-l from-transparent to-warm-taupe/40 flex-1"></div>
      </motion.div>
    </div>
  );
};

export default SectionDivider;
