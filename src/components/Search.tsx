import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, TrendingUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        mobileInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Block body scroll when search modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Perform search
  const performSearch = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/search/global?q=${encodeURIComponent(query)}&per_page=6`
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data.results);
      setHasSearched(true);
    } catch (err) {
      setError('Failed to search. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleResultClick = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    onClose();
  };

  const handleViewAllResults = () => {
    handleResultClick();
  };

  if (!isOpen) return null;

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
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Desktop Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="hidden md:block fixed top-[12vh] left-1/4 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
          >
            <div className="bg-background rounded-lg shadow-2xl border border-border overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                />
                {isLoading && (
                  <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Search Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {error && (
                  <div className="p-8 text-center text-destructive">
                    {error}
                  </div>
                )}

                {!isLoading && hasSearched && searchResults.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground mb-2">No products found</p>
                    <p className="text-sm text-muted-foreground">
                      Try searching for something else
                    </p>
                  </div>
                )}

                {!hasSearched && !isLoading && searchQuery.length === 0 && (
                  <div className="p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Popular Searches
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['Jeans', 'T-Shirts', 'Shoes', 'Jackets', 'Dresses'].map((term) => (
                        <button
                          key={term}
                          onClick={() => {
                            setSearchQuery(term);
                            performSearch(term);
                          }}
                          className="px-3 py-1.5 text-sm bg-accent hover:bg-accent/80 rounded-full transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="p-4">
                    <div className="space-y-3">
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          to={`/product/${product.id}`}
                          onClick={handleResultClick}
                          className="flex items-center gap-4 p-3 hover:bg-accent rounded-lg transition-colors group"
                        >
                          <div className="w-16 h-16 flex-shrink-0 bg-accent rounded overflow-hidden">
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {product.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {product.gender.name} • {product.product_type.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-semibold text-foreground">
                                ${product.price}
                              </span>
                              {product.original_price && (
                                <span className="text-sm text-muted-foreground line-through">
                                  ${product.original_price}
                                </span>
                              )}
                              {product.is_sale && (
                                <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded">
                                  SALE
                                </span>
                              )}
                              {product.is_new && (
                                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                  NEW
                                </span>
                              )}
                            </div>
                          </div>
                          {!product.in_stock && (
                            <span className="text-xs text-muted-foreground">
                              Out of stock
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>

                    {/* View All Results Link */}
                    <Link
                      to={`/search?q=${encodeURIComponent(searchQuery)}`}
                      onClick={handleViewAllResults}
                      className="block mt-4 p-3 text-center text-sm text-primary hover:bg-accent rounded-lg transition-colors font-medium"
                    >
                      View all results for "{searchQuery}"
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Mobile Modal - Full Screen */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ duration: 0.3, type: 'tween' }}
            className="md:hidden fixed inset-0 z-50 bg-background"
          >
            <div className="flex flex-col h-full">
              {/* Mobile Search Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border bg-background sticky top-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </Button>
                <div className="flex-1 flex items-center gap-2 bg-accent rounded-lg px-3 py-2">
                  <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <input
                    ref={mobileInputRef}
                    type="text"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm"
                  />
                  {isLoading && (
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                  )}
                </div>
              </div>

              {/* Mobile Search Results */}
              <div className="flex-1 overflow-y-auto">
                {error && (
                  <div className="p-6 text-center text-destructive text-sm">
                    {error}
                  </div>
                )}

                {!isLoading && hasSearched && searchResults.length === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-muted-foreground mb-2 text-sm">No products found</p>
                    <p className="text-xs text-muted-foreground">
                      Try searching for something else
                    </p>
                  </div>
                )}

                {!hasSearched && !isLoading && searchQuery.length === 0 && (
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground">
                        Popular Searches
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['Jeans', 'T-Shirts', 'Shoes', 'Jackets', 'Dresses'].map((term) => (
                        <button
                          key={term}
                          onClick={() => {
                            setSearchQuery(term);
                            performSearch(term);
                          }}
                          className="px-3 py-1.5 text-xs bg-accent hover:bg-accent/80 rounded-full transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="p-3">
                    <div className="space-y-2">
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          to={`/product/${product.id}`}
                          onClick={handleResultClick}
                          className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg transition-colors group"
                        >
                          <div className="w-14 h-14 flex-shrink-0 bg-accent rounded overflow-hidden">
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                              {product.title}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {product.gender.name} • {product.product_type.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="font-semibold text-sm text-foreground">
                                ${product.price}
                              </span>
                              {product.original_price && (
                                <span className="text-xs text-muted-foreground line-through">
                                  ${product.original_price}
                                </span>
                              )}
                              {product.is_sale && (
                                <span className="text-xs bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded">
                                  SALE
                                </span>
                              )}
                              {product.is_new && (
                                <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                                  NEW
                                </span>
                              )}
                              {!product.in_stock && (
                                <span className="text-xs text-muted-foreground">
                                  Out of stock
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* View All Results Link */}
                    <Link
                      to={`/search?q=${encodeURIComponent(searchQuery)}`}
                      onClick={handleViewAllResults}
                      className="block mt-3 p-2 text-center text-xs text-primary hover:bg-accent rounded-lg transition-colors font-medium"
                    >
                      View all results for "{searchQuery}"
                    </Link>
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