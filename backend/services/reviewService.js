const db = require('../config/db');

class ReviewService {

  /**
   * Check if a customer is eligible to review a product.
   * Returns { eligible, orderId, alreadyReviewed, reason }
   */
  async checkEligibility(userId, productId) {
    // Find a delivered order containing this product by this user
    const [orders] = await db.query(
      `SELECT o.id, o.order_number
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = ? AND oi.product_id = ? AND o.order_status = 'delivered'
       ORDER BY o.created_at DESC
       LIMIT 1`,
      [userId, productId]
    );

    if (orders.length === 0) {
      // Check if they have a non-delivered order with this product
      const [pendingOrders] = await db.query(
        `SELECT o.id FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         WHERE o.user_id = ? AND oi.product_id = ? AND o.order_status != 'cancelled'
         LIMIT 1`,
        [userId, productId]
      );

      if (pendingOrders.length > 0) {
        return { eligible: false, alreadyReviewed: false, reason: 'Reviews are available after your order has been delivered.' };
      }
      return { eligible: false, alreadyReviewed: false, reason: 'You can only review products you have purchased.' };
    }

    const order = orders[0];

    // Check if already reviewed
    const [existing] = await db.query(
      'SELECT id FROM reviews WHERE user_id = ? AND product_id = ? AND order_id = ?',
      [userId, productId, order.id]
    );

    if (existing.length > 0) {
      return { eligible: false, alreadyReviewed: true, orderId: order.id, reason: 'You have already reviewed this product from this order.' };
    }

    return { eligible: true, alreadyReviewed: false, orderId: order.id };
  }

  /**
   * Create a new review. Backend validates everything.
   */
  async createReview(userId, productId, data) {
    const { orderId, rating, title, comment } = data;

    // Validate rating
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw Object.assign(new Error('Rating must be a whole number between 1 and 5.'), { statusCode: 400 });
    }

    // Validate comment
    if (!comment || comment.trim().length < 5) {
      throw Object.assign(new Error('Review comment must be at least 5 characters.'), { statusCode: 400 });
    }

    // Verify order belongs to user, contains the product, and is delivered
    const [orders] = await db.query(
      `SELECT o.id, o.order_status
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.id = ? AND o.user_id = ? AND oi.product_id = ?`,
      [orderId, userId, productId]
    );

    if (orders.length === 0) {
      throw Object.assign(new Error('You can only review products you have purchased.'), { statusCode: 403 });
    }

    if (orders[0].order_status !== 'delivered') {
      throw Object.assign(new Error('Reviews are available after your order has been delivered.'), { statusCode: 403 });
    }

    // Check for duplicate
    const [existing] = await db.query(
      'SELECT id FROM reviews WHERE user_id = ? AND product_id = ? AND order_id = ?',
      [userId, productId, orderId]
    );

    if (existing.length > 0) {
      throw Object.assign(new Error('You have already reviewed this product from this order.'), { statusCode: 409 });
    }

    // Insert review
    const [result] = await db.query(
      `INSERT INTO reviews (user_id, product_id, order_id, rating, title, comment, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, productId, orderId, rating, title || null, comment.trim()]
    );

    return { id: result.insertId, status: 'pending' };
  }

  /**
   * Get paginated approved reviews for a product.
   */
  async getApprovedReviews(productId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [reviews] = await db.query(
      `SELECT r.id, r.rating, r.title, r.comment, r.created_at,
              u.first_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? AND r.status = 'approved'
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [productId, limit, offset]
    );

    const [countRows] = await db.query(
      'SELECT COUNT(*) as total FROM reviews WHERE product_id = ? AND status = ?',
      [productId, 'approved']
    );
    const total = countRows[0]?.total || 0;

    return {
      reviews: reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        customerName: r.first_name,
        verifiedPurchase: true,
        createdAt: r.created_at,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
    };
  }

  /**
   * Get rating summary for a product (only approved reviews).
   */
  async getProductRatingSummary(productId) {
    const [summaryRows] = await db.query(
      `SELECT COUNT(*) as totalReviews, COALESCE(AVG(rating), 0) as averageRating
       FROM reviews WHERE product_id = ? AND status = 'approved'`,
      [productId]
    );
    const summary = summaryRows[0] || { totalReviews: 0, averageRating: 0 };

    const [distribution] = await db.query(
      `SELECT rating, COUNT(*) as count
       FROM reviews WHERE product_id = ? AND status = 'approved'
       GROUP BY rating ORDER BY rating DESC`,
      [productId]
    );

    // Build full distribution (5 to 1)
    const dist = {};
    for (let i = 5; i >= 1; i--) dist[i] = 0;
    distribution.forEach(row => { dist[row.rating] = row.count; });

    return {
      averageRating: parseFloat(Number(summary.averageRating).toFixed(1)),
      totalReviews: summary.totalReviews || 0,
      distribution: dist
    };
  }

  /**
   * Get a customer's own reviews.
   */
  async getUserReviews(userId, statusFilter = 'all') {
    let sql = `
      SELECT r.id, r.product_id, r.order_id, r.rating, r.title, r.comment, r.status, r.created_at,
             p.name as product_name, p.slug as product_slug,
             (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) as product_image
      FROM reviews r
      JOIN products p ON p.id = r.product_id
      WHERE r.user_id = ?`;

    const params = [userId];

    if (statusFilter !== 'all') {
      sql += ' AND r.status = ?';
      params.push(statusFilter);
    }

    sql += ' ORDER BY r.created_at DESC';

    const [reviews] = await db.query(sql, params);
    return reviews;
  }

  /**
   * Admin: Get all reviews with filters, search, pagination.
   */
  async getAdminReviews({ status, rating, search, page = 1, limit = 20 }) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (safePage - 1) * safeLimit;

    let whereClause = 'WHERE 1=1';
    const whereParams = [];

    if (status && status !== 'all') {
      whereClause += ' AND r.status = ?';
      whereParams.push(status);
    }
    if (rating && String(rating).trim() !== '') {
      whereClause += ' AND r.rating = ?';
      whereParams.push(parseInt(rating, 10));
    }
    if (search && search.trim() !== '') {
      whereClause += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR p.name LIKE ? OR r.comment LIKE ? OR o.order_number LIKE ?)';
      const q = `%${search.trim()}%`;
      whereParams.push(q, q, q, q, q);
    }

    const fromClause = `
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN products p ON p.id = r.product_id
      LEFT JOIN orders o ON o.id = r.order_id
    `;

    // Count
    const countSql = `SELECT COUNT(*) as total ${fromClause} ${whereClause}`;
    const [countRows] = await db.query(countSql, whereParams);
    const total = countRows[0]?.total || 0;

    // Data
    const dataSql = `
      SELECT r.*, u.first_name, u.last_name, u.email,
             p.name as product_name, o.order_number
      ${fromClause}
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [reviews] = await db.query(dataSql, [...whereParams, safeLimit, offset]);

    return {
      reviews,
      pagination: { 
        page: safePage, 
        limit: safeLimit, 
        total, 
        totalPages: Math.ceil(total / safeLimit) || 1 
      }
    };
  }

  /**
   * Admin: Get detailed review by ID.
   */
  async getAdminReviewDetail(reviewId) {
    const [rows] = await db.query(
      `SELECT r.*, u.first_name, u.last_name, u.email,
              p.name as product_name, p.slug as product_slug,
              o.order_number, o.order_status
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       JOIN products p ON p.id = r.product_id
       LEFT JOIN orders o ON o.id = r.order_id
       WHERE r.id = ?`,
      [reviewId]
    );
    return rows[0] || null;
  }

  /**
   * Admin: Approve a review.
   */
  async approveReview(reviewId) {
    const [result] = await db.query(
      "UPDATE reviews SET status = 'approved' WHERE id = ?",
      [reviewId]
    );
    if (result.affectedRows === 0) {
      throw Object.assign(new Error('Review not found.'), { statusCode: 404 });
    }
    return true;
  }

  /**
   * Admin: Reject a review with optional note.
   */
  async rejectReview(reviewId, adminNote = null) {
    const [result] = await db.query(
      "UPDATE reviews SET status = 'rejected', admin_note = ? WHERE id = ?",
      [adminNote, reviewId]
    );
    if (result.affectedRows === 0) {
      throw Object.assign(new Error('Review not found.'), { statusCode: 404 });
    }
    return true;
  }

  /**
   * Admin: Delete a review.
   */
  async deleteReview(reviewId) {
    const [result] = await db.query('DELETE FROM reviews WHERE id = ?', [reviewId]);
    if (result.affectedRows === 0) {
      throw Object.assign(new Error('Review not found.'), { statusCode: 404 });
    }
    return true;
  }

  /**
   * Admin: Get dashboard summary.
   */
  async getAdminSummary() {
    const [countsRows] = await db.query(
      `SELECT
         COUNT(*) as total,
         COALESCE(SUM(status = 'pending'), 0) as pending,
         COALESCE(SUM(status = 'approved'), 0) as approved,
         COALESCE(SUM(status = 'rejected'), 0) as rejected
       FROM reviews`
    );
    const counts = countsRows[0] || { total: 0, pending: 0, approved: 0, rejected: 0 };

    const [avgRows] = await db.query(
      "SELECT COALESCE(AVG(rating), 0) as avg FROM reviews WHERE status = 'approved'"
    );
    const avgRow = avgRows[0] || { avg: 0 };

    return {
      total: Number(counts.total) || 0,
      pending: Number(counts.pending) || 0,
      approved: Number(counts.approved) || 0,
      rejected: Number(counts.rejected) || 0,
      averageRating: parseFloat(Number(avgRow.avg || 0).toFixed(1))
    };
  }
}

module.exports = new ReviewService();
