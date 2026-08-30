const wishlistService = require('../services/wishlistService');

exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.sub;
    const wishlist = await wishlistService.getWishlistByUserId(userId);
    
    res.json({
      success: true,
      data: { wishlist }
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
  }
};

exports.addItem = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { productId, variantId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    await wishlistService.addItem(userId, productId, variantId);
    
    res.status(201).json({
      success: true,
      message: 'Item added to wishlist'
    });
  } catch (error) {
    console.error('Error adding wishlist item:', error);
    res.status(500).json({ success: false, message: 'Failed to add item to wishlist' });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { productId } = req.params;
    const variantId = req.query.variantId || null;
    
    await wishlistService.removeItem(userId, productId, variantId);
    
    res.json({
      success: true,
      message: 'Item removed from wishlist'
    });
  } catch (error) {
    console.error('Error removing wishlist item:', error);
    res.status(500).json({ success: false, message: 'Failed to remove item from wishlist' });
  }
};
