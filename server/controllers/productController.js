const productService = require('../services/productService');

exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      collection,
      minPrice,
      maxPrice,
      availability,
      sort
    } = req.query;

    // Validate limit to prevent abuse
    const safeLimit = Math.min(Math.max(parseInt(limit) || 12, 1), 50);
    const safePage = Math.max(parseInt(page) || 1, 1);

    const filters = {
      page: safePage,
      limit: safeLimit,
      search: search ? String(search).trim() : undefined,
      category,
      collection,
      minPrice: minPrice !== undefined && minPrice !== '' ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice !== undefined && maxPrice !== '' ? parseFloat(maxPrice) : undefined,
      availability,
      sort
    };

    const data = await productService.getProducts(filters);

    res.json({
      success: true,
      message: 'Products fetched successfully',
      data
    });
  } catch (error) {
    console.error('Error in getProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products',
      data: null
    });
  }
};

exports.getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    if (!slug) {
      return res.status(400).json({ success: false, message: 'Slug is required' });
    }

    const product = await productService.getProductBySlug(slug);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product retrieved successfully',
      data: { product }
    });
  } catch (error) {
    console.error(`Error in getProductBySlug for ${req.params.slug}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product details',
      data: null
    });
  }
};

exports.getRelatedProducts = async (req, res) => {
  try {
    const { slug } = req.params;
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 4, 1), 10);
    
    if (!slug) {
      return res.status(400).json({ success: false, message: 'Slug is required' });
    }

    const products = await productService.getRelatedProducts(slug, limit);

    res.json({
      success: true,
      message: 'Related products retrieved successfully',
      data: { products }
    });
  } catch (error) {
    console.error(`Error in getRelatedProducts for ${req.params.slug}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching related products',
      data: null
    });
  }
};

exports.getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: { products: [], collections: [] } });
    }
    const results = await productService.getSearchSuggestions(q);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getBestSellers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    const products = await productService.getBestSellers(limit);
    res.json({ success: true, data: { products } });
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getNewArrivals = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    const products = await productService.getNewArrivals(limit);
    res.json({ success: true, data: { products } });
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
