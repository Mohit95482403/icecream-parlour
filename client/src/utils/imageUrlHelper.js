/**
 * Normalizes an image URL to handle absolute, relative, null, or undefined values.
 * Provides a reliable fallback image if the URL is invalid.
 * 
 * @param {string} url - The image URL from the database/backend
 * @returns {string} - A normalized, absolute or root-relative URL ready for `<img src={...}>`
 */
export const getImageUrl = (url) => {
  const fallbackImage = '/images/placeholder.svg';

  // Return fallback for empty, null, undefined, or string 'null'/'undefined'
  if (!url || url === 'null' || url === 'undefined' || url === '[object Object]') {
    return fallbackImage;
  }

  // Ensure url is a string
  const strUrl = String(url).trim();

  if (!strUrl) {
    return fallbackImage;
  }

  // If it's already an absolute URL (http:// or https:// or data:), return as is
  if (/^(https?:\/\/|data:)/i.test(strUrl)) {
    return strUrl;
  }

  // Prevent duplicate prefixes (e.g. /uploads//uploads/)
  let normalizedPath = strUrl.replace(/\/+/g, '/');

  // If it's just a filename (e.g. 'icecream.jpg'), prefix with /images/
  // Assuming filenames don't contain slashes
  if (!normalizedPath.includes('/')) {
    normalizedPath = `/images/${normalizedPath}`;
  } else if (!normalizedPath.startsWith('/')) {
    // If it's a relative path like 'images/icecream.jpg'
    normalizedPath = `/${normalizedPath}`;
  }

  return normalizedPath;
};
