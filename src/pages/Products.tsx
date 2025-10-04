import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, easeInOut } from 'framer-motion';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Filter, Grid, List, X, ArrowLeft, Loader2, ChevronDown, ChevronUp, Sparkles, Tag, Palette, Ruler, PackageOpen } from 'lucide-react';
import { api, transformProduct, Product, ProductType } from '@/services/api';

type CategoryType = 'all' | 'men' | 'women' | 'kids' | 'unisex' | 'new-arrivals' | 'sale';

interface FilterState {
  sortBy: 'name' | 'price' | 'created_at';
  order: 'asc' | 'desc';
  showOnSale: boolean;
  showNewArrivals: boolean;
  selectedProductType?: string;
  selectedSizes: string[];
  selectedColors: string[];
  priceRange: [number, number];
}

const CategoryPage: React.FC = () => {
  const { category = 'all' } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'created_at',
    order: 'desc',
    showOnSale: false,
    showNewArrivals: false,
    selectedSizes: [],
    selectedColors: [],
    priceRange: [0, 1000]
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loadingProductTypes, setLoadingProductTypes] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    sizes: false,
    colors: false,
    price: true
  });
  const [availableFilters, setAvailableFilters] = useState({
    sizes: [],
    colors: [],
    minPrice: 0,
    maxPrice: 1000
  });

  // CLIENT-SIDE FILTERING - This is where the magic happens
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    // Filter by sale
    if (filters.showOnSale) {
      filtered = filtered.filter(p => p.tags?.includes('on-sale'));
    }

    // Filter by new arrivals
    if (filters.showNewArrivals) {
      filtered = filtered.filter(p => p.tags?.includes('new-arrival'));
    }

    // Filter by sizes
    if (filters.selectedSizes.length > 0) {
      filtered = filtered.filter(p => 
        p.sizes?.some(size => filters.selectedSizes.includes(size))
      );
    }

    // Filter by colors
    if (filters.selectedColors.length > 0) {
      filtered = filtered.filter(p => 
        p.colors?.some(color => filters.selectedColors.includes(color))
      );
    }

    // Filter by price range
    filtered = filtered.filter(p => 
      p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    // Sort
    filtered.sort((a, b) => {
      if (filters.sortBy === 'name') {
        return filters.order === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (filters.sortBy === 'price') {
        return filters.order === 'asc' 
          ? a.price - b.price
          : b.price - a.price;
      } else { // created_at
        // Assuming newer products are at the beginning
        return filters.order === 'desc' ? 0 : 0; // Keep original order for now
      }
    });

    return filtered;
  }, [allProducts, filters]);

  // Fetch product types for sidebar
  useEffect(() => {
    const fetchProductTypes = async () => {
      if (['men', 'women', 'kids', 'unisex'].includes(category)) {
        setLoadingProductTypes(true);
        try {
          const response = await api.getProductTypes(category);
          setProductTypes(response.product_types);
        } catch (err) {
          console.error('Error fetching product types:', err);
        } finally {
          setLoadingProductTypes(false);
        }
      } else {
        setProductTypes([]);
      }
    };

    fetchProductTypes();
  }, [category]);

  // Fetch filter options and calculate from products
  useEffect(() => {
    if (allProducts.length > 0) {
      const sizes = new Set<string>();
      const colors = new Set<string>();
      let minPrice = Infinity;
      let maxPrice = -Infinity;

      allProducts.forEach(product => {
        product.sizes?.forEach(size => sizes.add(size));
        product.colors?.forEach(color => colors.add(color));
        if (product.price < minPrice) minPrice = product.price;
        if (product.price > maxPrice) maxPrice = product.price;
      });

      setAvailableFilters({
        sizes: Array.from(sizes).sort(),
        colors: Array.from(colors).sort(),
        minPrice: Math.floor(minPrice),
        maxPrice: Math.ceil(maxPrice)
      });

      // Update price range if it's at default
      if (filters.priceRange[0] === 0 && filters.priceRange[1] === 1000) {
        setFilters(prev => ({
          ...prev,
          priceRange: [Math.floor(minPrice), Math.ceil(maxPrice)]
        }));
      }
    }
  }, [allProducts]);

  // Fetch products ONCE when category changes - NO REFETCH on filter changes
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        let response;
        const productTypeFromUrl = searchParams.get('product_type');
        const isNewFromUrl = searchParams.get('is_new') === 'true';
        const isSaleFromUrl = searchParams.get('is_sale') === 'true';

        if (category === 'new-arrivals') {
          response = await api.getAllProducts({ is_new: true });
        } else if (category === 'sale') {
          response = await api.getAllProducts({ is_sale: true });
        } else if (category === 'all') {
          response = await api.getAllProducts();
        } else if (['men', 'women', 'kids', 'unisex'].includes(category)) {
          response = await api.getProductsByGenderSlug(category, {
            ...(productTypeFromUrl && { product_type_slug: productTypeFromUrl }),
            ...(isNewFromUrl && { is_new: true }),
            ...(isSaleFromUrl && { is_sale: true })
          });
        } else {
          response = await api.getProductsByProductTypeSlug(category);
        }

        const transformedProducts = response.products.map(transformProduct);
        setAllProducts(transformedProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    
    // Reset filters when category changes
    setFilters({
      sortBy: 'created_at',
      order: 'desc',
      showOnSale: false,
      showNewArrivals: false,
      selectedSizes: [],
      selectedColors: [],
      priceRange: [0, 1000]
    });
  }, [category, searchParams]);

  const getCategoryInfo = (cat: string) => {
    switch (cat) {
      case 'men':
        return { title: 'Men\'s Collection', subtitle: 'Contemporary menswear for the modern gentleman' };
      case 'women':
        return { title: 'Women\'s Collection', subtitle: 'Elegant feminine styles for every occasion' };
      case 'kids':
        return { title: 'Kids Collection', subtitle: 'Comfortable and playful styles for children' };
      case 'unisex':
        return { title: 'Unisex Collection', subtitle: 'Timeless pieces for everyone' };
      case 'new-arrivals':
        return { title: 'New Arrivals', subtitle: 'Latest additions to our collection' };
      case 'sale':
        return { title: 'Sale', subtitle: 'Up to 50% off selected items' };
      case 'all':
      default:
        return { title: 'All Products', subtitle: 'Explore our complete collection' };
    }
  };

  const categoryInfo = getCategoryInfo(category || 'all');

  const handleSortChange = (value: string) => {
    switch (value) {
      case 'name':
        setFilters(prev => ({ ...prev, sortBy: 'name', order: 'asc' }));
        break;
      case 'price-low':
        setFilters(prev => ({ ...prev, sortBy: 'price', order: 'asc' }));
        break;
      case 'price-high':
        setFilters(prev => ({ ...prev, sortBy: 'price', order: 'desc' }));
        break;
      case 'newest':
        setFilters(prev => ({ ...prev, sortBy: 'created_at', order: 'desc' }));
        break;
    }
  };

  const getSortValue = () => {
    if (filters.sortBy === 'name') return 'name';
    if (filters.sortBy === 'price' && filters.order === 'asc') return 'price-low';
    if (filters.sortBy === 'price' && filters.order === 'desc') return 'price-high';
    if (filters.sortBy === 'created_at') return 'newest';
    return 'newest';
  };

  const handleProductTypeClick = (slug: string) => {
    if (filters.selectedProductType === slug) {
      setFilters(prev => ({ ...prev, selectedProductType: undefined }));
    } else {
      setFilters(prev => ({ ...prev, selectedProductType: slug }));
    }
  };

  const toggleSize = (size: string) => {
    setFilters(prev => ({
      ...prev,
      selectedSizes: prev.selectedSizes.includes(size)
        ? prev.selectedSizes.filter(s => s !== size)
        : [...prev.selectedSizes, size]
    }));
  };

  const toggleColor = (color: string) => {
    setFilters(prev => ({
      ...prev,
      selectedColors: prev.selectedColors.includes(color)
        ? prev.selectedColors.filter(c => c !== color)
        : [...prev.selectedColors, color]
    }));
  };

  const clearFilters = () => {
    setFilters({
      sortBy: 'created_at',
      order: 'desc',
      showOnSale: false,
      showNewArrivals: false,
      selectedProductType: undefined,
      selectedSizes: [],
      selectedColors: [],
      priceRange: [availableFilters.minPrice, availableFilters.maxPrice]
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.selectedProductType) count++;
    count += filters.selectedSizes.length;
    count += filters.selectedColors.length;
    if (filters.showOnSale) count++;
    if (filters.showNewArrivals) count++;
    if (filters.priceRange[0] > availableFilters.minPrice || filters.priceRange[1] < availableFilters.maxPrice) count++;
    return count;
  }, [filters, availableFilters]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getColorStyle = (color: string) => {
    const colorMap: { [key: string]: string } = {
      'black': 'bg-black',
      'white': 'bg-white border-2 border-gray-300',
      'red': 'bg-red-500',
      'blue': 'bg-blue-500',
      'green': 'bg-green-500',
      'yellow': 'bg-yellow-400',
      'pink': 'bg-pink-500',
      'purple': 'bg-purple-500',
      'gray': 'bg-gray-500',
      'brown': 'bg-amber-700',
      'navy': 'bg-blue-900',
      'beige': 'bg-amber-100 border-2 border-gray-300',
      'orange': 'bg-orange-500',
    };
    return colorMap[color.toLowerCase()] || 'bg-gray-400';
  };

  // Sidebar Component
  const SidebarContent = ({ isMobile = false }) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-700" />
          <h3 className="text-xl font-semibold text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="bg-black text-white text-xs px-2 py-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {isMobile && (
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {activeFilterCount > 0 && (
        <Button
          onClick={clearFilters}
          variant="outline"
          className="w-full border-black text-black hover:bg-black hover:text-white transition-colors"
        >
          Clear All Filters
        </Button>
      )}

      {/* Quick Filters */}
      <div className="space-y-3">
        <button
          onClick={() => setFilters(prev => ({ ...prev, showOnSale: !prev.showOnSale }))}
          className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
            filters.showOnSale
              ? 'border-red-500 bg-red-50 text-red-700'
              : 'border-gray-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="font-medium">On Sale</span>
            </div>
            {filters.showOnSale && (
              <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">Active</span>
            )}
          </div>
        </button>

        <button
          onClick={() => setFilters(prev => ({ ...prev, showNewArrivals: !prev.showNewArrivals }))}
          className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
            filters.showNewArrivals
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">New Arrivals</span>
            </div>
            {filters.showNewArrivals && (
              <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">Active</span>
            )}
          </div>
        </button>
      </div>

      {/* Sizes */}
      {availableFilters.sizes.length > 0 && (
        <div className="border-t pt-6">
          <button
            onClick={() => toggleSection('sizes')}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Sizes
              {filters.selectedSizes.length > 0 && (
                <span className="text-xs bg-black text-white px-2 py-1 rounded-full">
                  {filters.selectedSizes.length}
                </span>
              )}
            </h4>
            {expandedSections.sizes ? (
              <ChevronUp className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
            )}
          </button>
          
          {expandedSections.sizes && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="grid grid-cols-4 gap-2 overflow-hidden"
            >
                {availableFilters.sizes.map((size) => (
                  <motion.button
                    key={size}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSize(size)}
                    className={`px-3 py-2 rounded-lg border-2 font-medium transition-all ${
                      filters.selectedSizes.includes(size)
                        ? 'border-black bg-black text-white shadow-lg'
                        : 'border-gray-300 hover:border-black'
                    }`}
                  >
                    {size}
                  </motion.button>
                ))}
              </motion.div>
            )}
        </div>
      )}

      {/* Colors */}
      {availableFilters.colors.length > 0 && (
        <div className="border-t pt-6">
          <button
            onClick={() => toggleSection('colors')}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Colors
              {filters.selectedColors.length > 0 && (
                <span className="text-xs bg-black text-white px-2 py-1 rounded-full">
                  {filters.selectedColors.length}
                </span>
              )}
            </h4>
            {expandedSections.colors ? (
              <ChevronUp className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
            )}
          </button>
          
          {expandedSections.colors && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="space-y-2 overflow-hidden"
            >
                {availableFilters.colors.map((color) => (
                  <motion.button
                    key={color}
                    whileHover={{ x: 4 }}
                    onClick={() => toggleColor(color)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                      filters.selectedColors.includes(color)
                        ? 'bg-gray-100 ring-2 ring-black'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full ${getColorStyle(color)} shadow-sm`} />
                    <span className="font-medium capitalize">{color}</span>
                    {filters.selectedColors.includes(color) && (
                      <span className="ml-auto text-xs bg-black text-white px-2 py-1 rounded-full">✓</span>
                    )}
                  </motion.button>
                ))}
              </motion.div>
            )}
        </div>
      )}

      {/* Price Range */}
      <div className="border-t pt-6">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between mb-4 group"
        >
          <h4 className="font-semibold text-gray-900">Price Range</h4>
          {expandedSections.price ? (
            <ChevronUp className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
          )}
        </button>
        
          {expandedSections.price && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-600 mb-1 block">Min</label>
                  <input
                    type="number"
                    value={filters.priceRange[0]}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      priceRange: [Number(e.target.value), prev.priceRange[1]]
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    min={availableFilters.minPrice}
                    max={filters.priceRange[1]}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-600 mb-1 block">Max</label>
                  <input
                    type="number"
                    value={filters.priceRange[1]}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      priceRange: [prev.priceRange[0], Number(e.target.value)]
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    min={filters.priceRange[0]}
                    max={availableFilters.maxPrice}
                  />
                </div>
              </div>
              
              <input
                type="range"
                min={availableFilters.minPrice}
                max={availableFilters.maxPrice}
                value={filters.priceRange[1]}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  priceRange: [prev.priceRange[0], Number(e.target.value)]
                }))}
                className="w-full"
              />
              
              <div className="text-center text-sm text-gray-600">
                ${filters.priceRange[0]} - ${filters.priceRange[1]}
              </div>
            </div>
          )}
      </div>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: easeInOut
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb & Back Button */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 pt-8"
      >
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        
        <div className="text-sm text-gray-500 mb-2">
          Home / Products / {categoryInfo.title}
        </div>
      </motion.div>

      {/* Header Section */}
      <motion.section 
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="py-16 px-4 bg-gradient-to-r from-gray-50 to-white"
      >
        <div className="container mx-auto text-center">
          <motion.h1 
            className="text-4xl md:text-6xl font-light text-gray-900 mb-4 tracking-wide"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {categoryInfo.title}
          </motion.h1>
          <motion.p 
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {categoryInfo.subtitle}
          </motion.p>
          <motion.div 
            className="w-24 h-0.5 bg-black mx-auto mt-8"
            initial={{ width: 0 }}
            animate={{ width: 96 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          />
        </div>
      </motion.section>

      {/* Filters & Controls */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="py-8 px-4 border-b border-gray-200"
      >
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden relative"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-black text-white text-xs px-2 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              
              <motion.div 
                className="text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {loading ? 'Loading...' : `Showing ${filteredProducts.length} of ${allProducts.length} products`}
              </motion.div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <select
                value={getSortValue()}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                disabled={loading}
              >
                <option value="name">Sort by Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>

              <div className="hidden md:flex border border-gray-300 rounded-md overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Main Content with Sidebar */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="flex gap-8">
            {/* Sidebar - Desktop */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="hidden md:block w-80 flex-shrink-0"
            >
              <div className="sticky top-24 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <SidebarContent />
              </div>
            </motion.aside>

            {/* Sidebar - Mobile */}
            <AnimatePresence>
              {sidebarOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                  />
                  <motion.aside
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 md:hidden overflow-y-auto shadow-2xl"
                  >
                    <div className="p-6">
                      <SidebarContent isMobile />
                    </div>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>

            {/* Products Grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex-1"
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-center items-center py-20"
                  >
                    <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
                  </motion.div>
                ) : error ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20"
                  >
                    <div className="text-red-500 text-xl mb-4">Error loading products</div>
                    <p className="text-gray-400 mb-8">{error}</p>
                    <Button
                      onClick={() => window.location.reload()}
                      className="bg-black text-white hover:bg-gray-900"
                    >
                      Try Again
                    </Button>
                  </motion.div>
                ) : filteredProducts.length > 0 ? (
                  <motion.div
                    key={viewMode}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={
                      viewMode === 'grid'
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        : "space-y-6"
                    }
                  >
                    {filteredProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -5 }}
                        className={viewMode === 'list' ? "flex bg-white shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg" : ""}
                      >
                        <ProductCard product={product} viewMode={viewMode} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20"
                  >
                    <div className="flex flex-col items-center justify-center py-10">
                      <div className="text-6xl mb-4 text-gray-400">
                        <PackageOpen width={52} height={52} />
                      </div>
                      <div className="text-2xl text-gray-500 font-light">
                        No products found
                      </div>
                    </div>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                      {activeFilterCount > 0
                        ? 'Try adjusting your filters to see more results'
                        : 'Try browsing other categories or check back later'}
                    </p>
                    {activeFilterCount > 0 && (
                      <Button
                        onClick={clearFilters}
                        className="bg-black text-white hover:bg-gray-900"
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CategoryPage;