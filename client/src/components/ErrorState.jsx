import React from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Reusable error state component with retry functionality.
 */
const ErrorState = ({
  title = 'Something went wrong.',
  description = "We couldn't load this section.",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-berry/10 flex items-center justify-center mb-4">
        <RefreshCw size={20} className="text-berry" strokeWidth={1.5} />
      </div>
      <h3 className="heading-md mb-2">{title}</h3>
      <p className="body-sm text-warm-taupe mb-6 max-w-sm">{description}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-outline">
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
