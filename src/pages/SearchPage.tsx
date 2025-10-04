import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Loader2, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const API_BASE = import.meta.env.VITE_API_URL;

interface SearchProduct {
  id: string;
  title: string;
  price: string;
  original_price: string | null;
  images: string[];
  in_stock: boolean;
  is_new: boolean;
  is_sale: boolean;
  product_type: {
    id: number;
    name: string;
    slug: string;
  };
  gender: {
    id: number;
    name: string;
    slug: string;
  };
}

interface SearchResponse {
  query: string;
  results: SearchProduct[];
  total: number;
  pages: number;
  current_page: number;
  per_page: number;
}

export const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [searchInput, setSearchInput] = useState(query);

  // Perform search
  useEffect(() => {
    if (query.length >= 2) {
      performSearch(query, currentPage, sortParam);
    }
  }, [query, currentPage, sortParam]);

  const performSearch = async (searchQuery: string, page: number, sort: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/search/global?q=${encodeURIComponent(searchQuery)}&page=${page}&per_page=12&sort=${sort}`
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data.results);
      setTotalPages(data.pages);
      setTotalResults(data.total);
    } catch (err) {
      setError('Failed to search. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim().length >= 2) {
      setCurrentPage(1);
      setSearchParams({ q: searchInput.trim(), sort: sortParam });
    }
  };

  const handleSortChange = (newSort: string) => {
    setCurrentPage(1);
    setSearchParams({ q: query, sort: newSort });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Search Products</h1>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search for products..."
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button type="submit" size="lg">
              Search
            </Button>
          </form>

          {/* Results Info & Sort */}
          {query && !isLoading && (
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-muted-foreground">
                {totalResults > 0 ? (
                  <>
                    Showing <span className="font-semibold text-foreground">{totalResults}</span> results for{' '}
                    <span className="font-semibold text-foreground">"{query}"</span>
                  </>
                ) : (
                  <>No results found for "{query}"</>
                )}
              </div>

              {totalResults > 0 && (
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={sortParam}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="newest">Newest</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* No Query State */}
        {!query && !isLoading && (
          <div className="text-center py-20">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">Enter a search term to find products</p>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && searchResults.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {searchResults.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/product/${product.id}`}
                    className="group block bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-all duration-300"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-accent">
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-2">
                        {product.is_new && (
                          <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded">
                            NEW
                          </span>
                        )}
                        {product.is_sale && (
                          <span className="bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-1 rounded">
                            SALE
                          </span>
                        )}
                      </div>

                      {!product.in_stock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-background text-foreground px-4 py-2 rounded-lg font-semibold">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <div className="text-xs text-muted-foreground mb-1">
                        {product.gender.name} • {product.product_type.name}
                      </div>
                      <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {product.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-foreground">
                          ${product.price}
                        </span>
                        {product.original_price && (
                          <span className="text-sm text-muted-foreground line-through">
                            ${product.original_price}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        onClick={() => handlePageChange(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* No Results State */}
        {!isLoading && query && searchResults.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-foreground mb-2">No products found</p>
            <p className="text-muted-foreground mb-6">
              Try searching with different keywords
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="text-sm text-muted-foreground">Suggestions:</span>
              {['Jeans', 'T-Shirts', 'Shoes', 'Jackets'].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchInput(term);
                    setSearchParams({ q: term, sort: sortParam });
                  }}
                  className="px-3 py-1.5 text-sm bg-accent hover:bg-accent/80 rounded-full transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};