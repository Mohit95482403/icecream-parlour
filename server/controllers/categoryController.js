const categoryService = require('../services/categoryService');
const collectionService = require('../services/collectionService');

exports.getCategories = async (req, res) => {
  try {
    const categories = await categoryService.getActiveCategories();
    res.json({
      success: true,
      message: 'Categories fetched successfully',
      data: { categories }
    });
  } catch (error) {
    console.error('Error in getCategories:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getCollections = async (req, res) => {
  try {
    const collections = await collectionService.getActiveCollections();
    res.json({
      success: true,
      message: 'Collections fetched successfully',
      data: { collections }
    });
  } catch (error) {
    console.error('Error in getCollections:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
