import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search, Clock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { popularSearches } from '../constants/navigation';
import OptimizedImage from './OptimizedImage';

const SearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState({ products: [], collections: [] });
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  // Load recent searches
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recentSearches');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Save recent search
  const saveRecentSearch = (term) => {
    if (!term.trim()) return;
    const termClean = term.trim().toLowerCase();
    const updated = [termClean, ...recentSearches.filter(t => t !== termClean)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSuggestions({ products: [], collections: [] });
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Debounced Search Suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions({ products: [], collections: [] });
        return;
      }
      
      setLoading(true);
      try {
        const res = await api.get('/products/search-suggestions', {
          params: { q: query }
        });
        if (res.success && res.data) {
          setSuggestions(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions', err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleSuggestionClick = (term) => {
    saveRecentSearch(term);
    navigate(`/search?q=${encodeURIComponent(term)}`);
    onClose();
  };

  const handleProductClick = (slug) => {
    saveRecentSearch(query);
    navigate(`/product/${slug}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-espresso/30 backdrop-blur-sm z-[80]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed top-0 left-0 right-0 z-[90] bg-ivory shadow-lg max-h-[80vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
          >
            <div className="container-custom py-6 md:py-10">
              {/* Search Input */}
              <form onSubmit={handleSubmit} className="flex items-center gap-4 mb-8 relative">
                <Search size={20} strokeWidth={1.5} className="text-warm-taupe shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search our flavours..."
                  className="flex-1 bg-transparent text-xl md:text-2xl font-display placeholder:text-warm-taupe/60 focus:outline-none"
                  aria-label="Search"
                />
                {loading && (
                  <div className="absolute right-12 w-5 h-5 border-2 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 hover:bg-warm-taupe/10 rounded-lg transition-colors shrink-0 ml-auto"
                  aria-label="Close search"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left Column: Recent / Popular / Collections */}
                <div>
                  {query.trim().length === 0 ? (
                    <>
                      {recentSearches.length > 0 && (
                        <div className="mb-8">
                          <p className="caption mb-4 flex items-center gap-2">
                            <Clock size={14} /> Recent Searches
                          </p>
                          <div className="flex flex-col gap-2">
                            {recentSearches.map((term) => (
                              <button
                                key={`recent-${term}`}
                                className="text-left text-theme-secondary hover:text-theme-primary transition-colors py-1"
                                onClick={() => handleSuggestionClick(term)}
                              >
                                {term}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="caption mb-4">Popular Searches</p>
                        <div className="flex flex-wrap gap-2">
                          {popularSearches.map((term) => (
                            <button
                              key={term}
                              className="px-4 py-2 text-sm border border-warm-taupe/20 rounded-pill hover:bg-warm-taupe/10 transition-colors duration-300"
                              onClick={() => handleSuggestionClick(term)}
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <button 
                          className="w-full text-left py-3 border-t border-theme-primary/10 flex items-center justify-between text-theme-primary font-medium hover:bg-theme-primary/5 px-4 rounded transition-colors"
                          onClick={handleSubmit}
                        >
                          View all results for "{query}"
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Right Column: Product Suggestions */}
                {query.trim().length >= 2 && suggestions.products?.length > 0 && (
                  <div>
                    <p className="caption mb-4">Products</p>
                    <div className="flex flex-col gap-4">
                      {suggestions.products.map(product => (
                        <button 
                          key={product.id}
                          className="flex items-center gap-4 text-left group hover:bg-theme-primary/5 p-2 rounded transition-colors"
                          onClick={() => handleProductClick(product.slug)}
                        >
                          <div className="w-16 h-16 bg-theme-surface rounded overflow-hidden shrink-0">
                            {product.image && (
                              <OptimizedImage 
                                src={product.image} 
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-serif text-theme-secondary group-hover:text-theme-primary transition-colors">
                              {product.name}
                            </p>
                            <p className="text-sm text-theme-secondary/70">
                              £{parseFloat(product.price).toFixed(2)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;
