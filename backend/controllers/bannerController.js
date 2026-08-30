const db = require('../config/db');

const bannerController = {
  /**
   * Public: Get the single active New Flavour Banner with authoritative product details.
   */
  getActiveBanner: async (req, res) => {
    try {
      const query = `
        SELECT 
          b.id,
          b.product_id,
          b.badge,
          b.title,
          b.description,
          b.cta_text,
          b.desktop_image,
          b.mobile_image,
          b.status,
          b.updated_at,
          p.name AS product_name,
          p.slug AS product_slug,
          p.status AS product_status,
          (SELECT v.price FROM product_variants v WHERE v.product_id = p.id AND v.status = 'active' ORDER BY v.id ASC LIMIT 1) AS product_price,
          (SELECT v.compare_at_price FROM product_variants v WHERE v.product_id = p.id AND v.status = 'active' ORDER BY v.id ASC LIMIT 1) AS product_compare_at_price,
          (SELECT img.image_url FROM product_images img WHERE img.product_id = p.id ORDER BY img.sort_order ASC, img.id ASC LIMIT 1) AS product_image
        FROM new_flavour_banners b
        LEFT JOIN products p ON b.product_id = p.id
        WHERE b.status = 'active'
        ORDER BY b.updated_at DESC
        LIMIT 1
      `;

      const [rows] = await db.query(query);

      if (rows.length === 0) {
        return res.status(200).json({
          success: true,
          data: null,
          message: 'No active banner found'
        });
      }

      const banner = rows[0];

      return res.status(200).json({
        success: true,
        data: banner
      });
    } catch (error) {
      console.error('getActiveBanner error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error fetching active banner'
      });
    }
  },

  /**
   * Admin: Get banner configuration and list of available products.
   */
  getAdminBanner: async (req, res) => {
    try {
      // Get current banner
      const [banners] = await db.query(`
        SELECT 
          b.*,
          p.name AS product_name,
          p.slug AS product_slug,
          (SELECT v.price FROM product_variants v WHERE v.product_id = p.id AND v.status = 'active' ORDER BY v.id ASC LIMIT 1) AS product_price
        FROM new_flavour_banners b
        LEFT JOIN products p ON b.product_id = p.id
        ORDER BY b.id ASC
        LIMIT 1
      `);

      // Get active products for dropdown
      const [products] = await db.query(`
        SELECT 
          p.id,
          p.name,
          p.slug,
          p.status,
          (SELECT v.price FROM product_variants v WHERE v.product_id = p.id AND v.status = 'active' ORDER BY v.id ASC LIMIT 1) AS price
        FROM products p
        WHERE p.status = 'active'
        ORDER BY p.name ASC
      `);

      return res.status(200).json({
        success: true,
        data: {
          banner: banners.length > 0 ? banners[0] : null,
          products: products
        }
      });
    } catch (error) {
      console.error('getAdminBanner error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error loading admin banner details'
      });
    }
  },

  /**
   * Admin: Create or update New Flavour Banner configuration.
   */
  updateBanner: async (req, res) => {
    try {
      const {
        badge = 'NEW FLAVOUR',
        title,
        description = '',
        cta_text = 'Discover Now',
        desktop_image,
        mobile_image = null,
        product_id = null,
        status = 'active'
      } = req.body;

      // Validation
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Banner title is required'
        });
      }

      if (!desktop_image || typeof desktop_image !== 'string' || desktop_image.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Desktop banner image is required'
        });
      }

      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value. Must be active or inactive'
        });
      }

      let parsedProductId = null;
      if (product_id && product_id !== '' && product_id !== 'null') {
        parsedProductId = parseInt(product_id, 10);
        if (isNaN(parsedProductId)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid product selected'
          });
        }

        // Verify product exists
        const [prodCheck] = await db.query('SELECT id FROM products WHERE id = ?', [parsedProductId]);
        if (prodCheck.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Selected product does not exist'
          });
        }
      }

      // Check if banner row already exists
      const [existing] = await db.query('SELECT id FROM new_flavour_banners LIMIT 1');

      if (existing.length > 0) {
        const bannerId = existing[0].id;
        await db.query(`
          UPDATE new_flavour_banners SET
            badge = ?,
            title = ?,
            description = ?,
            cta_text = ?,
            desktop_image = ?,
            mobile_image = ?,
            product_id = ?,
            status = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [
          badge ? badge.trim() : 'NEW FLAVOUR',
          title.trim(),
          description ? description.trim() : '',
          cta_text ? cta_text.trim() : 'Discover Now',
          desktop_image.trim(),
          mobile_image && mobile_image.trim() !== '' ? mobile_image.trim() : null,
          parsedProductId,
          status,
          bannerId
        ]);

        return res.status(200).json({
          success: true,
          message: 'New Flavour Banner updated successfully',
          data: { id: bannerId }
        });
      } else {
        const [insertResult] = await db.query(`
          INSERT INTO new_flavour_banners (
            badge, title, description, cta_text, desktop_image, mobile_image, product_id, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          badge ? badge.trim() : 'NEW FLAVOUR',
          title.trim(),
          description ? description.trim() : '',
          cta_text ? cta_text.trim() : 'Discover Now',
          desktop_image.trim(),
          mobile_image && mobile_image.trim() !== '' ? mobile_image.trim() : null,
          parsedProductId,
          status
        ]);

        return res.status(201).json({
          success: true,
          message: 'New Flavour Banner created successfully',
          data: { id: insertResult.insertId }
        });
      }
    } catch (error) {
      console.error('updateBanner error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error saving banner'
      });
    }
  },

  /**
   * Admin: Upload banner media file (desktop or mobile image).
   */
  uploadMedia: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded or file format not supported'
        });
      }

      // Return relative URL accessible via static /uploads route
      const fileUrl = `/uploads/banners/${req.file.filename}`;

      return res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          fileUrl: fileUrl,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });
    } catch (error) {
      console.error('uploadMedia error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error uploading image'
      });
    }
  }
};

module.exports = bannerController;
