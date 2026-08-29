import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Container from '../../components/Container';
import ProductGrid from '../../components/ProductGrid';
import { Search } from 'lucide-react';
import SEO from '../../components/seo/SEO';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setProducts([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.get('/products', {
          params: { search: query }
        });
        
        if (response.success && response.data?.products) {
          setProducts(response.data.products);
        } else {
          throw new Error('Failed to fetch search results');
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('An error occurred while searching. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <>
      <SEO 
        title={`Search results for "${query}" - GLACÉ`}
        description={`Showing search results for "${query}" at GLACÉ Premium Ice Cream.`}
        noindex={true}
      />
      <div className="pt-32 pb-16 min-h-[60vh]">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-3xl md:text-4xl font-serif text-theme-secondary mb-4">
              {query ? `Search Results for "${query}"` : 'Search'}
            </h1>
            <p className="text-theme-secondary/70">
              {loading ? 'Searching...' : 
               query ? `Found ${products.length} result${products.length !== 1 ? 's' : ''}` :
               'Enter a search term to begin.'}
            </p>
          </div>

          {error ? (
            <div className="text-center text-red-500 py-12">{error}</div>
          ) : loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : products.length > 0 ? (
            <ProductGrid products={products} />
          ) : query ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-theme-surface/50 mb-4">
                <Search className="w-8 h-8 text-theme-secondary/40" />
              </div>
              <h2 className="text-xl font-serif text-theme-secondary mb-2">No results found</h2>
              <p className="text-theme-secondary/70 mb-8 max-w-md mx-auto">
                We couldn't find anything matching "{query}". Try checking your spelling or using different keywords.
              </p>
              <button 
                onClick={() => navigate('/shop')}
                className="px-6 py-3 bg-theme-primary text-white rounded-full hover:bg-theme-secondary transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : null}
        </Container>
      </div>
    </>
  );
};

export default SearchResults;
