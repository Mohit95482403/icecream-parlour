const db = require('../config/db');

const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

const adminCategoryController = {
  // Get all categories with product counts
  getCategories: async (req, res) => {
    try {
      const query = `
        SELECT 
          c.id, c.name, c.slug, c.description, c.status, c.created_at,
          COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `;
      
      const [categories] = await db.query(query);

      return res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('getCategories error:', error);
      res.status(500).json({ success: false, message: 'Internal server error fetching categories' });
    }
  },

  // Create a new category
  createCategory: async (req, res) => {
    try {
      const { name, description, status = 'active' } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ success: false, message: 'Category name is required' });
      }

      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value' });
      }

      const slug = generateSlug(name);

      // Check if slug already exists
      const [existing] = await db.query('SELECT id FROM categories WHERE slug = ?', [slug]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'A category with this name already exists' });
      }

      const [result] = await db.query(
        'INSERT INTO categories (name, slug, description, status) VALUES (?, ?, ?, ?)',
        [name.trim(), slug, description ? description.trim() : null, status]
      );

      return res.status(201).json({
        success: true,
        data: {
          id: result.insertId,
          name: name.trim(),
          slug,
          description: description ? description.trim() : null,
          status,
          product_count: 0
        },
        message: 'Category created successfully'
      });
    } catch (error) {
      console.error('createCategory error:', error);
      res.status(500).json({ success: false, message: 'Internal server error creating category' });
    }
  },

  // Update a category
  updateCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, status } = req.body;

      // Check if category exists
      const [categories] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
      if (categories.length === 0) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      const currentCategory = categories[0];
      
      let newName = currentCategory.name;
      let newSlug = currentCategory.slug;
      
      if (name && name.trim() !== '' && name.trim() !== currentCategory.name) {
        newName = name.trim();
        newSlug = generateSlug(newName);
        
        // Check if new slug exists
        const [existing] = await db.query('SELECT id FROM categories WHERE slug = ? AND id != ?', [newSlug, id]);
        if (existing.length > 0) {
          return res.status(409).json({ success: false, message: 'A category with this name already exists' });
        }
      }

      const newDescription = description !== undefined ? description.trim() : currentCategory.description;
      const newStatus = status && ['active', 'inactive'].includes(status) ? status : currentCategory.status;

      await db.query(
        'UPDATE categories SET name = ?, slug = ?, description = ?, status = ? WHERE id = ?',
        [newName, newSlug, newDescription, newStatus, id]
      );

      return res.status(200).json({
        success: true,
        message: 'Category updated successfully'
      });
    } catch (error) {
      console.error('updateCategory error:', error);
      res.status(500).json({ success: false, message: 'Internal server error updating category' });
    }
  },

  // Update category status only
  updateCategoryStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value' });
      }

      // Check if category exists
      const [categories] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
      if (categories.length === 0) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      await db.query('UPDATE categories SET status = ? WHERE id = ?', [status, id]);

      return res.status(200).json({
        success: true,
        message: `Category ${status === 'active' ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('updateCategoryStatus error:', error);
      res.status(500).json({ success: false, message: 'Internal server error updating category status' });
    }
  }
};

module.exports = adminCategoryController;
