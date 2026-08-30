class DeliveryEstimateService {
  /**
   * Calculate delivery estimate based on delivery method and current time
   */
  calculateEstimate(deliveryMethod) {
    const now = new Date();
    let estimatedStart = new Date(now);
    let estimatedEnd = new Date(now);
    
    // In a real system, this would factor in business hours, zones, and current kitchen load.
    // We are simulating typical timeframes based on the selected method.
    if (deliveryMethod === 'express_delivery') {
      // 25-35 minutes
      estimatedStart.setMinutes(now.getMinutes() + 25);
      estimatedEnd.setMinutes(now.getMinutes() + 35);
    } else {
      // Standard Delivery: 45-60 minutes
      estimatedStart.setMinutes(now.getMinutes() + 45);
      estimatedEnd.setMinutes(now.getMinutes() + 60);
    }
    
    return {
      estimatedStart,
      estimatedEnd
    };
  }

  /**
   * Format estimate for UI display (e.g. "Today, 8:30 PM - 9:00 PM")
   */
  formatEstimate(estimatedStart, estimatedEnd) {
    if (!estimatedStart || !estimatedEnd) return null;
    
    const isToday = (date) => {
      const today = new Date();
      return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
    };
    
    const formatTime = (date) => {
      return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
    };
    
    const datePrefix = isToday(estimatedStart) ? 'Today' : estimatedStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    
    return `${datePrefix}, ${formatTime(estimatedStart)} – ${formatTime(estimatedEnd)}`;
  }
}

module.exports = new DeliveryEstimateService();
