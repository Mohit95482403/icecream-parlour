import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Slim announcement bar at the top of the page.
 * Dismissible with smooth animation.
 */
const AnnouncementBar = ({ message = 'FREE DELIVERY ON ORDERS ABOVE ₹799' }) => {
  const [visible, setVisible] = useState(true);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-espresso text-ivory overflow-hidden"
          role="banner"
          aria-label="Announcement"
        >
          <div className="container-custom flex items-center justify-center py-2.5 relative">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-center">
              {message}
            </p>
            <button
              onClick={() => setVisible(false)}
              className="absolute right-4 sm:right-6 lg:right-8 xl:right-12 p-1 hover:opacity-70 transition-opacity"
              aria-label="Dismiss announcement"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnnouncementBar;
