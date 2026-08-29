import { useState, useEffect } from 'react';

const STORAGE_KEY = 'glace_recently_viewed';
const MAX_ITEMS = 8;

export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentlyViewed(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse recently viewed', e);
    }
  }, []);

  const addRecentlyViewed = (product) => {
    if (!product || !product.id) return;
    
    setRecentlyViewed(prev => {
      // Remove if already exists
      const filtered = prev.filter(p => p.id !== product.id);
      
      const newProduct = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: product.images?.[0]?.image_url || product.image,
        price: product.variants?.[0]?.price || product.price,
        availability: product.availability
      };

      const updated = [newProduct, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return {
    recentlyViewed,
    addRecentlyViewed
  };
};
