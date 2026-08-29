import { useState, useEffect, useCallback } from 'react';
import orderService from '../services/orderService';

export const useOrderTracking = (orderNumber) => {
  const [trackingData, setTrackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTracking = useCallback(async () => {
    try {
      if (!orderNumber) return;
      const data = await orderService.getOrderTracking(orderNumber);
      setTrackingData(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch tracking data');
    } finally {
      setIsLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    fetchTracking();

    // Poll every 30 seconds for live updates
    const intervalId = setInterval(fetchTracking, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchTracking]);

  return { trackingData, isLoading, error, refetch: fetchTracking };
};
