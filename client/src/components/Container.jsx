import React from 'react';

/**
 * Centralized layout container with responsive padding and max-width.
 */
const Container = ({ children, className = '', as: Tag = 'div', ...props }) => {
  return (
    <Tag className={`container-custom ${className}`} {...props}>
      {children}
    </Tag>
  );
};

export default Container;
