const db = require('../config/db');

class CollectionService {
  async getActiveCollections() {
    const [rows] = await db.query(`
      SELECT id, name, slug, description, image
      FROM collections
      WHERE status = 'active'
      ORDER BY name ASC
    `);
    return rows;
  }

  async getCollectionBySlug(slug) {
    const [rows] = await db.query(`
      SELECT id, name, slug, description, image
      FROM collections
      WHERE slug = ? AND status = 'active'
    `, [slug]);
    return rows[0] || null;
  }
}

module.exports = new CollectionService();
