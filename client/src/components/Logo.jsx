import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Brand logo — text-based "GLACÉ" with elegant typography.
 * Reusable across Header, Footer, and any brand placement.
 */
const Logo = ({ className = '', variant = 'dark' }) => {
  const colorClass = variant === 'light' ? 'text-ivory' : 'text-espresso';

  return (
    <Link
      to="/"
      className={`font-display text-2xl md:text-3xl font-semibold tracking-wide ${colorClass} ${className} hover:opacity-80 transition-opacity duration-300`}
      aria-label="GLACÉ — Home"
    >
      GLACÉ
    </Link>
  );
};

export default Logo;
