import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/wishlist');
      if (response.success && response.data?.wishlist) {
        setWishlist(response.data.wishlist);
      }
    } catch (err) {
      console.error('Failed to fetch wishlist', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch wishlist on mount or user change
  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Toggle wishlist item
  const toggleWishlist = async (product) => {
    if (!user) {
      toast.error('Please log in to save products to your wishlist.', {
        icon: '❤️',
        style: {
          borderRadius: '999px',
          background: '#FFF',
          color: '#1a1a1a',
        },
      });
      navigate('/login');
      return;
    }

    const isWished = wishlist.some(item => item.productId === product.id);

    // Optimistic update
    let updatedWishlist = [...wishlist];
    
    if (isWished) {
      updatedWishlist = wishlist.filter(item => item.productId !== product.id);
      setWishlist(updatedWishlist);
      
      try {
        await api.delete(`/wishlist/items/${product.id}`);
        toast.success('Removed from your wishlist.');
      } catch (error) {
        console.error('Failed to remove wishlist item', error);
        // Revert on failure
        fetchWishlist();
        toast.error("Couldn't remove item. Please try again.");
      }
    } else {
      // Create a temporary item for optimistic UI
      const tempItem = {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: product.images && product.images.length > 0 ? product.images[0] : (product.image || null),
        price: product.price,
        isAvailable: product.availability === 'In Stock',
        addedAt: new Date().toISOString()
      };
      
      setWishlist([tempItem, ...wishlist]);
      
      try {
        await api.post('/wishlist/items', { productId: product.id });
        toast.success('Added to your wishlist.');
        // Refresh from server to get correct database ID for the wishlist_item
        fetchWishlist();
      } catch (error) {
        console.error('Failed to add wishlist item', error);
        // Revert on failure
        fetchWishlist();
        toast.error("Couldn't save item. Please try again.");
      }
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.productId === productId);
  };

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider 
      value={{ 
        wishlist, 
        loading, 
        toggleWishlist, 
        isInWishlist, 
        wishlistCount,
        refresh: fetchWishlist 
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
