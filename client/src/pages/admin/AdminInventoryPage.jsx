import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ArrowUpDown, Package, AlertTriangle, XCircle, History, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import adminInventoryApi from '../../services/admin/adminInventoryApi';
import InventoryAdjustmentModal from './components/InventoryAdjustmentModal';
import InventoryHistoryModal from './components/InventoryHistoryModal';

const AdminInventoryPage = () => {
  const [summary, setSummary] = useState({ totalProducts: 0, inStock: 0, lowStock: 0, outOfStock: 0 });
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('updated_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [adjustItem, setAdjustItem] = useState(null);
  const [historyItem, setHistoryItem] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchSummary = async () => {
    try {
      const res = await adminInventoryApi.getSummary();
      if (res.data.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load inventory summary');
    }
  };

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        search: debouncedSearch,
        status: statusFilter,
        sort
      };
      const res = await adminInventoryApi.getInventory(params);
      if (res.data.success) {
        setInventory(res.data.data);
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err) {
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, sort]);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'In Stock': return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">IN STOCK</span>;
      case 'Low Stock': return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">LOW STOCK</span>;
      case 'Out of Stock': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">OUT OF STOCK</span>;
      default: return null;
    }
  };

  const handleStockUpdated = (newQuantity) => {
    // Refresh table and summary
    fetchInventory();
    fetchSummary();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-espresso">Inventory Management</h1>
        <p className="text-warm-taupe mt-1">Monitor stock levels, adjust quantities and track inventory activity.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-champagne shadow-sm flex items-center">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg mr-4">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-warm-taupe font-medium">Total Products</p>
            <p className="text-2xl font-bold text-espresso">{summary.totalProducts}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-champagne shadow-sm flex items-center">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg mr-4">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-warm-taupe font-medium">In Stock</p>
            <p className="text-2xl font-bold text-espresso">{summary.inStock}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-champagne shadow-sm flex items-center">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg mr-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-warm-taupe font-medium">Low Stock</p>
            <p className="text-2xl font-bold text-espresso">{summary.lowStock}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-champagne shadow-sm flex items-center">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg mr-4">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-warm-taupe font-medium">Out of Stock</p>
            <p className="text-2xl font-bold text-espresso">{summary.outOfStock}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-champagne shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-taupe w-5 h-5" />
          <input 
            type="text"
            placeholder="Search products, SKUs, categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-champagne rounded-lg focus:outline-none focus:border-espresso"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-warm-taupe" />
            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-champagne rounded-lg px-3 py-2 focus:outline-none focus:border-espresso text-sm text-espresso font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-5 h-5 text-warm-taupe" />
            <select 
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="border border-champagne rounded-lg px-3 py-2 focus:outline-none focus:border-espresso text-sm text-espresso font-medium"
            >
              <option value="updated_desc">Recently Updated</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="stock_asc">Stock Low to High</option>
              <option value="stock_desc">Stock High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-champagne overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-sand/30 border-b border-champagne text-espresso">
                <th className="p-4 font-semibold text-sm">Product</th>
                <th className="p-4 font-semibold text-sm">SKU</th>
                <th className="p-4 font-semibold text-sm">Category</th>
                <th className="p-4 font-semibold text-sm">Current Stock</th>
                <th className="p-4 font-semibold text-sm">Threshold</th>
                <th className="p-4 font-semibold text-sm">Status</th>
                <th className="p-4 font-semibold text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-espresso"></div>
                    </div>
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center">
                    <Package className="w-12 h-12 text-champagne mx-auto mb-3" />
                    <p className="text-warm-taupe text-lg">No inventory records found.</p>
                    {search || statusFilter !== 'all' ? (
                      <button 
                        onClick={() => { setSearch(''); setStatusFilter('all'); }}
                        className="mt-4 text-espresso font-medium hover:underline"
                      >
                        Clear Filters
                      </button>
                    ) : null}
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.variant_id} className="border-b border-champagne/50 hover:bg-sand/10 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-espresso">{item.product_name}</p>
                      {item.product_status !== 'active' && (
                        <span className="text-xs text-red-500 font-medium">Inactive Product</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-warm-taupe">{item.sku || '-'}</td>
                    <td className="p-4 text-sm text-warm-taupe">{item.category_name || '-'}</td>
                    <td className="p-4">
                      <span className="font-bold text-espresso text-lg">{item.stock}</span>
                    </td>
                    <td className="p-4 text-sm text-warm-taupe">{item.low_stock_threshold || 10}</td>
                    <td className="p-4">{getStatusBadge(item.stock_status)}</td>
                    <td className="p-4">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setAdjustItem(item)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-espresso text-white rounded-lg text-sm font-medium hover:bg-espresso/90 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Adjust</span>
                        </button>
                        <button
                          onClick={() => setHistoryItem(item)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-sand text-espresso rounded-lg text-sm font-medium hover:bg-sand/80 transition-colors"
                        >
                          <History className="w-4 h-4" />
                          <span>History</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-champagne flex items-center justify-between">
            <p className="text-sm text-warm-taupe">
              Page {page} of {totalPages}
            </p>
            <div className="flex space-x-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 border border-champagne rounded-lg text-espresso hover:bg-sand disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 border border-champagne rounded-lg text-espresso hover:bg-sand disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <InventoryAdjustmentModal 
        isOpen={!!adjustItem} 
        onClose={() => setAdjustItem(null)} 
        item={adjustItem} 
        onSuccess={handleStockUpdated}
      />

      <InventoryHistoryModal 
        isOpen={!!historyItem} 
        onClose={() => setHistoryItem(null)} 
        item={historyItem} 
      />

    </div>
  );
};

export default AdminInventoryPage;
