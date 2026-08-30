import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { productService } from '../services/productService';

export function useProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [data, setData] = useState({ products: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract current filters from URL
  const filters = {
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '12',
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    collection: searchParams.get('collection') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    availability: searchParams.get('availability') || '',
    sort: searchParams.get('sort') || 'featured'
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await productService.getProducts(filters);
      if (response.success) {
        setData(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [searchParams]); // Re-run when URL params change

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Helper to update a single filter and reset page to 1
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    
    // Always reset to page 1 when changing a filter (unless we are just changing the page)
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    
    setSearchParams(newParams);
  };

  // Helper to clear all filters
  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return {
    products: data.products,
    pagination: data.pagination,
    loading,
    error,
    filters,
    updateFilter,
    clearFilters,
    refresh: fetchProducts
  };
}
