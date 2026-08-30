import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StarRating from './StarRating';
import reviewService from '../../services/reviewService';

/**
 * ReviewForm — Premium modal for submitting a product review.
 */
const ReviewForm = ({ isOpen, onClose, productId, productName, orderId, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError('Please select a rating.'); return; }
    if (comment.trim().length < 5) { setError('Review must be at least 5 characters.'); return; }

    setStatus('submitting');
    setError('');

    try {
      await reviewService.submitReview(productId, {
        orderId,
        rating,
        title: title.trim() || null,
        comment: comment.trim(),
      });
      setStatus('success');
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Unable to submit your review. Please try again.');
      setStatus('error');
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoverRating(0);
    setTitle('');
    setComment('');
    setStatus('idle');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/40 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="bg-ivory w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-espresso/8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-warm-taupe/60 font-medium mb-1">Rate Your Experience</p>
              <h3 className="font-display text-lg text-espresso" style={{ letterSpacing: '-0.01em' }}>{productName}</h3>
            </div>
            <button onClick={handleClose} className="p-2 text-warm-taupe/50 hover:text-espresso transition-colors rounded-full hover:bg-espresso/5">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            {status === 'success' ? (
              <div className="text-center py-8">
                <CheckCircle size={40} className="mx-auto mb-4 text-pistachio" />
                <h4 className="font-display text-xl text-espresso mb-2">Thank You!</h4>
                <p className="text-sm text-espresso/55 font-light max-w-xs mx-auto leading-relaxed">
                  Your review has been submitted and is awaiting approval. We appreciate your feedback.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-6 px-6 py-2.5 text-xs uppercase tracking-[0.08em] font-medium bg-espresso text-ivory rounded-full hover:bg-charcoal transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Stars */}
                <div>
                  <label className="block text-xs uppercase tracking-[0.1em] font-medium text-espresso/50 mb-3">
                    How would you rate this flavour?
                  </label>
                  <StarRating
                    rating={rating}
                    hoverValue={hoverRating}
                    interactive
                    size={32}
                    onRate={setRating}
                    onHover={setHoverRating}
                    onLeave={() => setHoverRating(0)}
                  />
                </div>

                {/* Comment */}
                <div>
                  <label htmlFor="review-comment" className="block text-xs uppercase tracking-[0.1em] font-medium text-espresso/50 mb-2">
                    Your Review
                  </label>
                  <textarea
                    id="review-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what you loved about this flavour..."
                    rows={4}
                    className="w-full px-4 py-3 bg-cream/40 border border-espresso/10 rounded-xl text-base text-espresso placeholder:text-warm-taupe/35 focus:outline-none focus:ring-2 focus:ring-espresso/10 focus:border-espresso/20 transition-all font-light resize-none"
                  />
                </div>

                {/* Title */}
                <div>
                  <label htmlFor="review-title" className="block text-xs uppercase tracking-[0.1em] font-medium text-espresso/50 mb-2">
                    Review Title <span className="normal-case tracking-normal text-warm-taupe/40">(optional)</span>
                  </label>
                  <input
                    id="review-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Delicious and creamy"
                    maxLength={150}
                    className="w-full px-4 py-3 bg-cream/40 border border-espresso/10 rounded-xl text-base text-espresso placeholder:text-warm-taupe/35 focus:outline-none focus:ring-2 focus:ring-espresso/10 focus:border-espresso/20 transition-all font-light"
                  />
                </div>

                {/* Error */}
                {error && (
                  <p className="text-sm text-red-600/80 font-light">{error}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full py-3.5 text-xs uppercase tracking-[0.08em] font-medium bg-espresso text-ivory rounded-full hover:bg-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'submitting' ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-ivory/30 border-t-ivory rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReviewForm;
