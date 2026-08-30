import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = 'GLACÉ | Premium Artisanal Ice Cream', 
  description = 'Experience the finest handcrafted, small-batch ice cream. Made with premium ingredients and unparalleled dedication to craft.',
  name = 'GLACÉ',
  type = 'website',
  url = typeof window !== 'undefined' ? window.location.href : '',
  image = typeof window !== 'undefined' ? `${window.location.origin}/og-image.jpg` : '/og-image.jpg',
  noindex = false
}) => {
  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{title}</title>
      <meta name='description' content={description} />
      
      {/* End indexing if needed */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* OpenGraph tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={name} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      {/* Twitter tags */}
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
