import { useState, useEffect } from 'react';

/**
 * Tracks current scroll position for header behavior.
 * Returns scrollY value and a boolean for whether user has scrolled past a threshold.
 */
export function useScrollPosition(threshold = 50) {
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrollY(currentY);
      setScrolled(currentY > threshold);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return { scrolled, scrollY };
}

export default useScrollPosition;
