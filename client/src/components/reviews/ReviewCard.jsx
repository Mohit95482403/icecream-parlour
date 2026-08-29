import React from 'react';
import { BadgeCheck } from 'lucide-react';
import StarRating from './StarRating';

/**
 * ReviewCard — Individual approved review display.
 */
const ReviewCard = ({ review }) => {
  const date = new Date(review.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="py-6 border-b border-espresso/8 last:border-b-0">
      <div className="flex items-center justify-between mb-3">
        <StarRating rating={review.rating} size={16} />
        <span className="text-xs text-warm-taupe/50 font-light">{date}</span>
      </div>

      {review.title && (
        <h4 className="text-base font-medium text-espresso mb-1.5">{review.title}</h4>
      )}

      <p className="text-sm md:text-base text-espresso/60 leading-[1.7] font-light mb-3">
        {review.comment}
      </p>

      <div className="flex items-center gap-3">
        <span className="text-sm text-espresso/50 font-light">{review.customerName}</span>
        {review.verifiedPurchase && (
          <span className="inline-flex items-center gap-1 text-xs text-pistachio font-medium">
            <BadgeCheck size={14} />
            Verified Purchase
          </span>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
