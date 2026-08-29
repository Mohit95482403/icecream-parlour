const db = require('../config/db');

class DeliveryService {
  /**
   * Checks if a postal code is serviceable and returns delivery rules.
   */
  async checkServiceability(postalCode) {
    if (!postalCode) {
      return { serviceable: false, reason: 'Postal code required' };
    }

    const cleanPostalCode = postalCode.trim();
    // Validate Indian PIN code (6 digits)
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!pinRegex.test(cleanPostalCode)) {
      return { serviceable: false, reason: 'Invalid Indian PIN code format.' };
    }

    const sql = `
      SELECT delivery_fee, minimum_order_amount, free_delivery_threshold, estimated_delivery_minutes
      FROM delivery_zones
      WHERE postal_code = ? AND is_active = TRUE
    `;

    const [zones] = await db.query(sql, [cleanPostalCode]);

    if (zones.length === 0) {
      // Accept all valid Indian PIN codes with standard default rules
      return {
        serviceable: true,
        deliveryFee: 100.00,
        minimumOrderAmount: 0.00,
        freeDeliveryThreshold: null,
        estimatedMinutes: 60
      };
    }

    const zone = zones[0];

    return {
      serviceable: true,
      deliveryFee: parseFloat(zone.delivery_fee),
      minimumOrderAmount: parseFloat(zone.minimum_order_amount),
      freeDeliveryThreshold: zone.free_delivery_threshold ? parseFloat(zone.free_delivery_threshold) : null,
      estimatedMinutes: zone.estimated_delivery_minutes
    };
  }

  /**
   * Calculates the final delivery fee based on the zone rules and the order subtotal.
   */
  calculateFinalDeliveryFee(serviceability, subtotal) {
    if (!serviceability || !serviceability.serviceable) {
      return null;
    }

    // Check minimum order amount
    if (subtotal < serviceability.minimumOrderAmount) {
      return null; // Cannot deliver
    }

    // Check free delivery threshold
    if (serviceability.freeDeliveryThreshold !== null && subtotal >= serviceability.freeDeliveryThreshold) {
      return 0; // Free delivery
    }

    return serviceability.deliveryFee;
  }
}

module.exports = new DeliveryService();
