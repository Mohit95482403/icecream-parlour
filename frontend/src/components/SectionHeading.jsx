import React from 'react';

/**
 * Reusable section heading with caption, title, and description.
 * Ensures consistent typography and spacing across sections.
 */
const SectionHeading = ({
  caption,
  title,
  description,
  align = 'center',
  className = '',
}) => {
  const alignClass = {
    center: 'text-center',
    left: 'text-left',
    right: 'text-right',
  }[align];

  return (
    <div className={`${alignClass} ${className}`}>
      {caption && (
        <p className="caption mb-4">{caption}</p>
      )}
      {title && (
        <h2 className="heading-xl mb-4">{title}</h2>
      )}
      {description && (
        <p className="body-lg text-warm-taupe max-w-2xl mx-auto">
          {description}
        </p>
      )}
    </div>
  );
};

export default SectionHeading;
