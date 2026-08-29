import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cartService } from '../services/cartService';
import checkoutService from '../services/checkoutService';
import { useAuth } from '../hooks/useAuth';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [cartIssues, setCartIssues] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine user identifier
  const cartOwnerId = isAuthenticated && user ? user.id : 'guest';

  // Load from local storage when user changes
  useEffect(() => {
    const savedCart = cartService.getCart(cartOwnerId);
    setItems(savedCart);
  }, [cartOwnerId]);

  // Save to local storage whenever items or user change
  useEffect(() => {
    cartService.saveCart(items, cartOwnerId);
    if (isDrawerOpen) {
      validateCart();
    }
  }, [items, cartOwnerId]);

  const addItem = (product, variant, quantity = 1) => {
    if (!isAuthenticated || user?.role !== 'customer') {
      navigate('/login-select', { state: { from: location.pathname } });
      return;
    }
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.productId === product.id && item.variantId === variant.id
      );

      if (existingItemIndex >= 0) {
        // Increment quantity of existing duplicate
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      }

      // Add new item
      return [...prevItems, {
        productId: product.id,
        variantId: variant.id,
        slug: product.slug,
        name: product.name,
        variantName: variant.size,
        price: variant.price,
        image: product.images?.[0]?.image_url || null,
        quantity
      }];
    });
    
    // Automatically open drawer when item is added
    setIsDrawerOpen(true);
  };

  const addMultipleItems = (itemsToAdd, shouldOpenDrawer = false) => {
    if (!isAuthenticated || user?.role !== 'customer') {
      navigate('/login-select', { state: { from: location.pathname } });
      return false;
    }

    if (!Array.isArray(itemsToAdd) || itemsToAdd.length === 0) return false;

    setItems(prevItems => {
      const updatedItems = [...prevItems];

      for (const item of itemsToAdd) {
        const existingIndex = updatedItems.findIndex(
          existing => existing.productId === item.productId && existing.variantId === item.variantId
        );

        if (existingIndex >= 0) {
          // Merge quantity respecting stock limit if specified
          const existingItem = updatedItems[existingIndex];
          const combinedQty = existingItem.quantity + item.quantity;
          const cappedQty = item.availableStock ? Math.min(combinedQty, item.availableStock) : combinedQty;

          updatedItems[existingIndex] = {
            ...existingItem,
            price: item.price, // Use current live price
            quantity: cappedQty
          };
        } else {
          updatedItems.push({
            productId: item.productId,
            variantId: item.variantId,
            slug: item.slug,
            name: item.name,
            variantName: item.variantName,
            price: item.price,
            image: item.image,
            quantity: item.quantity
          });
        }
      }

      return updatedItems;
    });

    if (shouldOpenDrawer) {
      setIsDrawerOpen(true);
    }

    return true;
  };

  const removeItem = (productId, variantId) => {
    setItems(prevItems => prevItems.filter(
      item => !(item.productId === productId && item.variantId === variantId)
    ));
  };

  const updateQuantity = (productId, variantId, quantity) => {
    if (quantity < 1) return;
    
    setItems(prevItems => prevItems.map(item => {
      if (item.productId === productId && item.variantId === variantId) {
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setItems([]);
  };

  const validateCart = async () => {
    if (items.length === 0) {
      setCartIssues([]);
      return;
    }
    try {
      setIsValidating(true);
      const res = await checkoutService.validateCart(items);
      if (res.success) {
        setCartIssues(res.data.issues || []);
      }
    } catch (err) {
      console.error('Failed to validate cart', err);
    } finally {
      setIsValidating(false);
    }
  };

  const openDrawer = () => {
    setIsDrawerOpen(true);
    validateCart();
  };
  const closeDrawer = () => setIsDrawerOpen(false);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      cartIssues,
      isValidating,
      itemCount,
      subtotal,
      isDrawerOpen,
      addItem,
      addToCart: addItem, // compatibility alias
      addMultipleItems,
      removeItem,
      updateQuantity,
      clearCart,
      validateCart,
      openDrawer,
      closeDrawer
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
