import React, { useState, useEffect, useCallback } from 'react';
import { Star } from 'lucide-react';
import StarRating from './StarRating';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';
import reviewService from '../../services/reviewService';
import { useAuth } from '../../hooks/useAuth';

/**
 * ProductReviewSection — Full review area for a product detail page.
 * Shows rating summary, distribution bars, review list with pagination,
 * and a "Write a Review" CTA if eligible.
 */
const ProductReviewSection = ({ productId }) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const [summaryRes, reviewsRes] = await Promise.all([
        reviewService.getProductSummary(productId),
        reviewService.getProductReviews(productId, 1, 10),
      ]);
      setSummary(summaryRes.data);
      setReviews(reviewsRes.data.reviews);
      setPagination(reviewsRes.data.pagination);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Check eligibility only when user is logged in
  useEffect(() => {
    if (user && productId) {
      reviewService.checkEligibility(productId)
        .then(res => setEligibility(res.data))
        .catch(() => setEligibility(null));
    }
  }, [user, productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLoadMore = async () => {
    if (!pagination || pagination.page >= pagination.totalPages) return;
    setLoadingMore(true);
    try {
      const res = await reviewService.getProductReviews(productId, pagination.page + 1, 10);
      setReviews(prev => [...prev, ...res.data.reviews]);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to load more reviews', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleReviewSuccess = () => {
    setEligibility(prev => prev ? { ...prev, eligible: false, alreadyReviewed: true } : prev);
    // Refresh data after a short delay
    setTimeout(() => fetchData(), 500);
  };

  if (loading) {
    return (
      <div className="py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-warm-taupe/10 rounded" />
          <div className="h-20 w-64 bg-warm-taupe/10 rounded" />
          <div className="h-32 bg-warm-taupe/10 rounded" />
        </div>
      </div>
    );
  }

  const totalReviews = summary?.totalReviews || 0;
  const avgRating = summary?.averageRating || 0;
  const distribution = summary?.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  return (
    <div className="py-16 border-t border-warm-taupe/15">
      {/* Section Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="h-[1px] w-8 bg-warm-taupe/30" />
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-warm-taupe/60">
          Customer Reviews
        </span>
      </div>
      <h3 className="font-display text-2xl md:text-3xl text-espresso mb-8" style={{ letterSpacing: '-0.015em' }}>
        What Our Customers Say
      </h3>

      {totalReviews === 0 ? (
        /* Empty State */
        <div className="text-center py-12 border border-espresso/8 rounded-xl bg-cream/30">
          <Star size={28} className="mx-auto mb-3 text-warm-taupe/30" />
          <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-warm-taupe/50 mb-2">
            Be The First To Share
          </p>
          <p className="text-base text-espresso/45 font-light mb-6">
            This flavour hasn't received any reviews yet.
          </p>
          {eligibility?.eligible && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2.5 text-xs uppercase tracking-[0.08em] font-medium bg-espresso text-ivory rounded-full hover:bg-charcoal transition-colors"
            >
              Rate This Product
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Rating Summary */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 mb-10">
            {/* Average */}
            <div className="flex items-center gap-4 shrink-0">
              <span className="font-display text-5xl text-espresso">{avgRating}</span>
              <div>
                <StarRating rating={Math.round(avgRating)} size={18} />
                <p className="text-sm text-warm-taupe/60 font-light mt-1">
                  {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Distribution */}
            <div className="flex-1 max-w-sm space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star] || 0;
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-xs text-espresso/50 font-light w-4 text-right">{star}</span>
                    <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                    <div className="flex-1 h-2 bg-espresso/6 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-warm-taupe/50 font-light w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Write Review CTA */}
          {eligibility?.eligible && (
            <div className="mb-8">
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-2.5 text-xs uppercase tracking-[0.08em] font-medium border border-espresso/20 text-espresso rounded-full hover:bg-espresso hover:text-ivory transition-all duration-300"
              >
                ★ Write a Review
              </button>
            </div>
          )}

          {/* Review List */}
          <div>
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {/* Load More */}
          {pagination && pagination.page < pagination.totalPages && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 py-2.5 text-xs uppercase tracking-[0.1em] font-medium border border-espresso/15 text-espresso/60 rounded-full hover:border-espresso/30 hover:text-espresso transition-all disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More Reviews'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Review Form Modal */}
      <ReviewForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        productId={productId}
        productName=""
        orderId={eligibility?.orderId}
        onSuccess={handleReviewSuccess}
      />
    </div>
  );
};

export default ProductReviewSection;
