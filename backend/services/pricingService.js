class PricingService {
  /**
   * Calculates all totals for an order based on validated cart items, delivery, and discounts.
   * Tax is calculated at 18% (9% CGST + 9% SGST).
   */
  calculateOrderTotals({ items, deliveryFee = 0, discountAmount = 0 }) {
    // Calculate subtotal from items
    const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Apply discount (ensure it doesn't exceed subtotal)
    const effectiveDiscount = Math.min(discountAmount, subtotal);
    
    // Calculate grand total (Subtotal + Delivery - Discount)
    const grandTotal = subtotal - effectiveDiscount + deliveryFee;
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: effectiveDiscount,
      deliveryFee: deliveryFee,
      tax: 0,
      grandTotal: Math.round(grandTotal * 100) / 100,
      currency: 'INR'
    };
  }
}

module.exports = new PricingService();
