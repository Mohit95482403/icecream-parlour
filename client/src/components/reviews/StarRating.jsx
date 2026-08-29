import React from 'react';
import { Star } from 'lucide-react';

/**
 * StarRating — Reusable star display/input component.
 *
 * Props:
 *   rating       — Current value (0–5)
 *   size         — Icon size (default 20)
 *   interactive  — If true, renders as clickable input
 *   hoverValue   — Currently hovered value (for interactive)
 *   onRate       — Callback(value) when clicked
 *   onHover      — Callback(value) when hovered
 *   onLeave      — Callback() when mouse leaves
 *   className    — Additional wrapper classes
 */
const StarRating = ({
  rating = 0,
  size = 20,
  interactive = false,
  hoverValue = 0,
  onRate,
  onHover,
  onLeave,
  className = '',
}) => {
  const displayValue = hoverValue || rating;

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      onMouseLeave={interactive ? onLeave : undefined}
      role={interactive ? 'radiogroup' : undefined}
      aria-label={interactive ? 'Rating' : `${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue;

        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              onClick={() => onRate?.(star)}
              onMouseEnter={() => onHover?.(star)}
              onFocus={() => onHover?.(star)}
              className="p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-espresso/20 rounded-sm transition-transform duration-150 hover:scale-110"
              role="radio"
              aria-checked={star === rating}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            >
              <Star
                size={size}
                className={`transition-colors duration-200 ${
                  filled
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-transparent text-warm-taupe/30'
                }`}
              />
            </button>
          );
        }

        return (
          <Star
            key={star}
            size={size}
            className={
              filled
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-warm-taupe/25'
            }
          />
        );
      })}
    </div>
  );
};

export default StarRating;
