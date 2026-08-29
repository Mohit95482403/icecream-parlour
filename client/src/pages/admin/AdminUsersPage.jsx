import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react';
import adminUsersApi from '../../services/admin/adminUsersApi';
import SEO from '../../components/seo/SEO';

const formatMoney = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const AdminUsersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL state
  const searchTerm = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || 'all';
  const sortOption = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Local state
  const [searchInput, setSearchInput] = useState(searchTerm);
  const [data, setData] = useState({ users: [], pagination: { total: 0, totalPages: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminUsersApi.getUsers({
        search: searchTerm,
        status: statusFilter,
        sort: sortOption,
        page,
        limit: 20
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Unable to load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, sortOption, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchTerm) {
        setSearchParams(prev => {
          if (searchInput) prev.set('search', searchInput);
          else prev.delete('search');
          prev.set('page', '1');
          return prev;
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, searchTerm, setSearchParams]);

  // Handlers
  const handleFilterChange = (key, value) => {
    setSearchParams(prev => {
      if (value && value !== 'all') prev.set(key, value);
      else prev.delete(key);
      prev.set('page', '1');
      return prev;
    });
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= data.pagination.totalPages) {
      setSearchParams(prev => {
        prev.set('page', newPage.toString());
        return prev;
      });
    }
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || sortOption !== 'newest';

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <SEO title="Customers - GLACÉ Admin" noindex={true} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-medium text-espresso mb-1">Customers</h1>
          <p className="text-espresso/60 text-sm">Manage customers, accounts, and customer activity.</p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-warm-taupe/20 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso/40" size={18} />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-ivory/50 border border-warm-taupe/30 rounded-lg text-sm focus:outline-none focus:border-warm-taupe focus:ring-1 focus:ring-warm-taupe transition-all"
          />
          {searchInput && (
            <button 
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso/40 hover:text-espresso"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="py-2.5 pl-3 pr-8 bg-ivory/50 border border-warm-taupe/30 rounded-lg text-sm focus:outline-none focus:border-warm-taupe text-espresso"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>

          <select
            value={sortOption}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="py-2.5 pl-3 pr-8 bg-ivory/50 border border-warm-taupe/30 rounded-lg text-sm focus:outline-none focus:border-warm-taupe text-espresso"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest_spend">Highest Spend</option>
            <option value="most_orders">Most Orders</option>
            <option value="name_asc">Name (A-Z)</option>
          </select>

          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="text-sm text-berry hover:text-berry/80 font-medium px-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-berry/10 border border-berry/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-berry shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-sm text-berry">{error}</p>
            <button onClick={fetchUsers} className="text-xs font-medium text-berry underline mt-1">Try Again</button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-warm-taupe/20 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-ivory/50 border-b border-warm-taupe/10">
                <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Total Spent</th>
                <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-xs font-medium text-espresso/60 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-taupe/10">
              {loading ? (
                // Loading Skeletons
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-10 w-48 bg-warm-taupe/10 rounded animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-32 bg-warm-taupe/10 rounded animate-pulse mb-1"></div><div className="h-4 w-24 bg-warm-taupe/10 rounded animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-12 bg-warm-taupe/10 rounded animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-20 bg-warm-taupe/10 rounded animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-warm-taupe/10 rounded-full animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-24 bg-warm-taupe/10 rounded animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-8 w-16 bg-warm-taupe/10 rounded ml-auto animate-pulse"></div></td>
                  </tr>
                ))
              ) : data.users.length > 0 ? (
                data.users.map(user => (
                  <tr key={user.id} className="hover:bg-ivory/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-espresso/5 text-espresso flex items-center justify-center font-medium text-sm border border-warm-taupe/20">
                          {user.first_name?.charAt(0) || ''}{user.last_name?.charAt(0) || ''}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-espresso">{user.first_name} {user.last_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-espresso">{user.email}</p>
                      <p className="text-xs text-espresso/60">{user.phone || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-espresso font-medium">{user.order_count}</td>
                    <td className="px-6 py-4 text-sm text-espresso font-medium">{formatMoney(user.total_spent)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-pistachio/30 text-green-900' 
                          : 'bg-berry/20 text-berry'
                      }`}>
                        {user.status === 'active' ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-espresso/70">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/admin/users/${user.id}`}
                        className="inline-block px-3 py-1.5 text-sm font-medium text-espresso bg-ivory border border-warm-taupe/30 rounded-lg hover:bg-warm-taupe/20 transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-espresso/60">
                    <p className="text-base font-medium mb-1">No customers found</p>
                    <p className="text-sm">Try a different search term or change your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && data.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-warm-taupe/10 flex items-center justify-between bg-ivory/30">
            <p className="text-sm text-espresso/60 hidden sm:block">
              Showing <span className="font-medium text-espresso">{(data.pagination.page - 1) * data.pagination.limit + 1}</span> to <span className="font-medium text-espresso">{Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}</span> of <span className="font-medium text-espresso">{data.pagination.total}</span> customers
            </p>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={() => handlePageChange(data.pagination.page - 1)}
                disabled={data.pagination.page === 1}
                className="p-1.5 text-espresso/60 hover:text-espresso hover:bg-warm-taupe/20 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(data.pagination.totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Show limited pages (current, first, last, +/-1)
                  if (
                    pageNum === 1 || 
                    pageNum === data.pagination.totalPages || 
                    (pageNum >= data.pagination.page - 1 && pageNum <= data.pagination.page + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center text-sm rounded-md transition-colors ${
                          data.pagination.page === pageNum 
                            ? 'bg-espresso text-ivory font-medium' 
                            : 'text-espresso/70 hover:bg-warm-taupe/20'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === data.pagination.page - 2 || 
                    pageNum === data.pagination.page + 2
                  ) {
                    return <span key={pageNum} className="text-espresso/40">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => handlePageChange(data.pagination.page + 1)}
                disabled={data.pagination.page === data.pagination.totalPages}
                className="p-1.5 text-espresso/60 hover:text-espresso hover:bg-warm-taupe/20 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
