import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AccountLayout from '../../layouts/AccountLayout';
import StarRating from '../../components/reviews/StarRating';
import reviewService from '../../services/reviewService';

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: '⏳' },
  approved: { label: 'Approved', className: 'bg-green-50 text-green-700 border-green-200', icon: '✓' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200', icon: '✕' },
};

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const res = await reviewService.getMyReviews(filter);
        setReviews(res.data || []);
      } catch (err) {
        console.error('Failed to load reviews', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [filter]);

  const filters = ['all', 'pending', 'approved', 'rejected'];

  return (
    <AccountLayout title="My Reviews">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs uppercase tracking-wider font-medium border transition-colors ${
              filter === f
                ? 'bg-midnight-charcoal text-white border-midnight-charcoal'
                : 'bg-white text-midnight-charcoal/60 border-warm-taupe/20 hover:border-warm-taupe/40'
            }`}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse h-28 bg-gray-100 rounded" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 border border-warm-taupe/15 bg-[#FAFAFA]">
          <p className="text-warm-taupe text-sm mb-2">No reviews found.</p>
          <Link to="/account/orders" className="text-sm text-midnight-charcoal underline underline-offset-2 hover:text-black">
            View your orders
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => {
            const st = statusConfig[review.status] || statusConfig.pending;
            const date = new Date(review.created_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric'
            });

            return (
              <div key={review.id} className="border border-warm-taupe/15 p-5 bg-[#FAFAFA] hover:border-warm-taupe/25 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {review.product_image && (
                      <img
                        src={review.product_image.startsWith('http') ? review.product_image : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '')}${review.product_image}`}
                        alt={review.product_name}
                        className="w-12 h-12 object-cover rounded bg-warm-taupe/10"
                      />
                    )}
                    <div>
                      <Link
                        to={`/product/${review.product_slug}`}
                        className="text-midnight-charcoal font-medium hover:underline"
                      >
                        {review.product_name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={review.rating} size={14} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 border ${st.className}`}>
                      {st.icon} {st.label}
                    </span>
                    <span className="text-xs text-warm-taupe">{date}</span>
                  </div>
                </div>

                {review.title && (
                  <p className="text-sm font-medium text-midnight-charcoal mb-1">{review.title}</p>
                )}
                <p className="text-sm text-midnight-charcoal/70 leading-relaxed">{review.comment}</p>
              </div>
            );
          })}
        </div>
      )}
    </AccountLayout>
  );
};

export default MyReviews;
