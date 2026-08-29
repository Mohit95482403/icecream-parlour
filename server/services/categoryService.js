const db = require('../config/db');

class CategoryService {
  async getActiveCategories() {
    const [rows] = await db.query(`
      SELECT id, name, slug, description, image
      FROM categories
      WHERE status = 'active'
      ORDER BY name ASC
    `);
    return rows;
  }
}

module.exports = new CategoryService();
