const CART_STORAGE_KEY_PREFIX = 'glace_cart_v1';

export const cartService = {
  getCart: (userId = 'guest') => {
    try {
      const key = `${CART_STORAGE_KEY_PREFIX}_${userId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse cart from local storage', e);
      return [];
    }
  },

  saveCart: (items, userId = 'guest') => {
    try {
      const key = `${CART_STORAGE_KEY_PREFIX}_${userId}`;
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to local storage', e);
    }
  },

  clearCart: (userId = 'guest') => {
    try {
      const key = `${CART_STORAGE_KEY_PREFIX}_${userId}`;
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Failed to clear cart from local storage', e);
    }
  }
};
