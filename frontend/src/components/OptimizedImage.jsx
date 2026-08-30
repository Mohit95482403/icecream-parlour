import React, { useState } from 'react';
import { getImageUrl } from '../utils/imageUrlHelper';

/**
 * Optimized image component with lazy loading, placeholder, and error handling.
 */
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  aspectRatio = 'auto',
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const normalizedSrc = getImageUrl(src);

  return (
    <div className={`relative overflow-hidden bg-cream ${className}`} style={{ aspectRatio: aspectRatio !== 'auto' ? aspectRatio : undefined }}>
      {/* Placeholder shimmer while loading */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-sand/30 animate-pulse" />
      )}

      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-cream">
          <span className="caption">Image unavailable</span>
        </div>
      ) : (
        <img
          src={normalizedSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
