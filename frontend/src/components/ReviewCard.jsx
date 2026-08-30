import React from 'react';
import { Star } from 'lucide-react';

/**
 * Premium testimonial card.
 * Prepared for future GET /api/reviews integration.
 */
const ReviewCard = ({ review }) => {
  const { rating, quote, author, verified } = review;

  return (
    <div className="flex flex-col items-center text-center px-4 py-8 md:px-8">
      {/* Stars */}
      <div className="flex gap-1 mb-6" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            fill={i < rating ? '#C9A96E' : 'none'}
            stroke={i < rating ? '#C9A96E' : '#B8AA9A'}
            strokeWidth={1.5}
          />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="font-display text-lg md:text-xl leading-relaxed text-espresso mb-6 max-w-lg italic">
        "{quote}"
      </blockquote>

      {/* Author */}
      <div>
        <p className="text-sm font-medium text-espresso">{author}</p>
        {verified && (
          <p className="text-xs text-warm-taupe mt-1 tracking-wide">
            Verified Purchase
          </p>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
