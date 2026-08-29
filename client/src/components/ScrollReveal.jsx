import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable scroll reveal wrapper using Framer Motion.
 * Animates children with opacity + y translation on viewport entry.
 */
const ScrollReveal = ({
  children,
  className = '',
  delay = 0,
  duration = 0.6,
  y = 30,
  once = true,
  threshold = 0.15,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: threshold }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
