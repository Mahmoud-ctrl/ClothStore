import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { api, ProductType, Gender } from '@/services/api';
import { SearchModal } from '@/components/Search';

interface MegaMenuData {
  gender: string;
  productTypes: ProductType[];
}

export const Navigation: React.FC = () => {
  const { state } = useCart();
  const itemCount = state.items.reduce((total, item) => total + item.quantity, 0);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [megaMenuData, setMegaMenuData] = useState<MegaMenuData | null>(null);
  const [loadingMegaMenu, setLoadingMegaMenu] = useState(false);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [mobileSubMenu, setMobileSubMenu] = useState<string | null>(null);
  const [mobileSubMenuData, setMobileSubMenuData] = useState<ProductType[]>([]);

  // Fetch genders on mount
  useEffect(() => {
    const fetchGenders = async () => {
      try {
        const response = await api.getGenders();
        setGenders(response.genders);
      } catch (error) {
        console.error('Error fetching genders:', error);
      }
    };
    fetchGenders();
  }, []);

  const staticLinks = [
    { name: 'New Arrivals', path: '/products/new-arrivals' },
    { name: 'Sale', path: '/products/sale' },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => {
    setIsMenuOpen(false);
    setMobileSubMenu(null);
  };

  // Mobile submenu handler
  const handleMobileGenderClick = async (e: React.MouseEvent, genderSlug: string) => {
    e.preventDefault();
    
    if (mobileSubMenu === genderSlug) {
      setMobileSubMenu(null);
      return;
    }

    setMobileSubMenu(genderSlug);
    
    try {
      const response = await api.getProductTypes(genderSlug);
      setMobileSubMenuData(response.product_types);
    } catch (error) {
      console.error('Error fetching product types:', error);
    }
  };

  // Desktop mega menu handlers
  const handleMouseEnter = async (genderSlug: string) => {
    setActiveMegaMenu(genderSlug);
    setLoadingMegaMenu(true);
    
    try {
      const response = await api.getProductTypes(genderSlug);
      setMegaMenuData({
        gender: genderSlug,
        productTypes: response.product_types
      });
    } catch (error) {
      console.error('Error fetching mega menu data:', error);
    } finally {
      setLoadingMegaMenu(false);
    }
  };

  const handleMouseLeave = () => {
    setTimeout(() => {
      if (!document.querySelector('.mega-menu-container:hover')) {
        setActiveMegaMenu(null);
        setMegaMenuData(null);
      }
    }, 100);
  };

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const drawerVariants: Variants = {
    hidden: { x: '-100%' },
    visible: { 
      x: 0,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      x: '-100%',
      transition: { 
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    }
  };

  const linkVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: (i: number) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  const megaMenuVariants: Variants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: {
        height: {
          duration: 0.3,
          ease: "easeOut"
        },
        opacity: {
          duration: 0.2,
          delay: 0.1
        }
      }
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        height: {
          duration: 0.2,
          ease: "easeIn"
        },
        opacity: {
          duration: 0.15
        }
      }
    }
  };

  return (
    <>
      <div className="relative">
        <nav className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleMenu}
                className="hover:bg-accent"
              >
                <motion.div
                  animate={{ rotate: isMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.div>
              </Button>
            </div>

            {/* Logo */}
            <Link 
              to="/" 
              className="text-2xl font-bold text-foreground absolute left-1/2 transform -translate-x-1/2 md:static md:transform-none"
            >
              <motion.span
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                FashionHub
              </motion.span>
            </Link>

            {/* Desktop Centered Links */}
            <div className="hidden md:flex space-x-8 mx-auto">
              {/* Dynamic Gender Categories */}
              {genders.map((gender) => (
                <div
                  key={gender.id}
                  onMouseEnter={() => handleMouseEnter(gender.slug)}
                  onMouseLeave={handleMouseLeave}
                  className="relative"
                >
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Link
                      to={`/products/${gender.slug}`}
                      className="text-foreground hover:text-primary transition-colors relative group py-2 block"
                    >
                      {gender.name}
                      <motion.div
                        className="absolute bottom-0 left-0 h-0.5 bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: activeMegaMenu === gender.slug ? "100%" : 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </Link>
                  </motion.div>
                </div>
              ))}

              {/* Static Links */}
              {staticLinks.map((link) => (
                <motion.div
                  key={link.name}
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Link
                    to={link.path}
                    className="text-foreground hover:text-primary transition-colors relative group py-2 block"
                  >
                    {link.name}
                    <motion.div
                      className="absolute bottom-0 left-0 h-0.5 bg-primary"
                      initial={{ width: 0 }}
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Right Buttons */}
            <div className="flex items-center space-x-2">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hover:bg-accent"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <Search className="h-5 w-5" />
                </Button>
              </motion.div>

              <Link to="/cart" className="relative">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="icon" className="relative hover:bg-accent">
                    <ShoppingBag className="h-5 w-5" />
                    <AnimatePresence>
                      {itemCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center"
                        >
                          {itemCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </nav>

        {/* Desktop Mega Menu */}
        <AnimatePresence>
          {activeMegaMenu && (
            <motion.div
              variants={megaMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mega-menu-container absolute left-0 right-0 z-40 bg-background border-b border-border shadow-lg overflow-hidden"
              onMouseLeave={() => {
                setActiveMegaMenu(null);
                setMegaMenuData(null);
              }}
            >
              <div className="container mx-auto px-4 py-8">
                {loadingMegaMenu ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : megaMenuData && megaMenuData.productTypes.length > 0 ? (
                  (() => {
                    const categoryCount = megaMenuData.productTypes.length;
                    const columns = Math.min(Math.ceil(categoryCount / 5), 5);
                    
                    return (
                      <div className="flex gap-16 justify-center max-w-2xl mx-auto">
                        {/* Categories List - Dynamic columns, max 5 items per column */}
                        <div>
                          <div 
                            className="grid gap-y-3"
                            style={{ 
                              gridTemplateColumns: `repeat(${columns}, minmax(140px, auto))`,
                              columnGap: '4rem'
                            }}
                          >
                            {megaMenuData.productTypes.map((type, index) => (
                              <motion.div
                                key={type.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                              >
                                <Link
                                  to={`/products/${megaMenuData.gender}?product_type=${type.slug}`}
                                  className="group flex items-center justify-between hover:text-primary transition-colors"
                                >
                                  <span className="text-sm text-foreground group-hover:text-primary">
                                    {type.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-4">
                                    {type.product_count}
                                  </span>
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="w-px bg-border"></div>

                        {/* Quick Links - Right side */}
                        <div>
                          <div className="space-y-3">
                            <Link
                              to={`/products/${megaMenuData.gender}`}
                              className="block text-sm text-foreground hover:text-primary transition-colors font-medium"
                            >
                              All Products
                            </Link>
                            <Link
                              to={`/products/${megaMenuData.gender}?is_new=true`}
                              className="block text-sm text-foreground hover:text-primary transition-colors"
                            >
                              New Arrivals
                            </Link>
                            <Link
                              to={`/products/${megaMenuData.gender}?is_sale=true`}
                              className="block text-sm text-foreground hover:text-primary transition-colors"
                            >
                              On Sale
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="py-8">
                    <p className="text-center text-muted-foreground mb-4">No categories available yet</p>
                    <div className="text-center">
                      <Link
                        to={`/products/${activeMegaMenu}`}
                        className="inline-flex items-center text-primary hover:underline"
                      >
                        View All Products <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={closeMenu}
            />

            <motion.div
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed left-0 top-0 h-full w-80 bg-background border-r border-border z-50 md:hidden shadow-xl overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background">
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl font-semibold text-foreground"
                >
                  FashionHub
                </motion.h2>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={closeMenu}
                  className="hover:bg-accent"
                >
                  <motion.div
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.div>
                </Button>
              </div>

              <div className="flex flex-col p-4 space-y-1">
                {genders.map((gender, index) => (
                  <motion.div
                    key={gender.id}
                    custom={index}
                    variants={linkVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <button
                      onClick={(e) => handleMobileGenderClick(e, gender.slug)}
                      className="w-full flex items-center justify-between py-3 px-4 text-left text-foreground hover:text-primary hover:bg-accent rounded-lg transition-all duration-200"
                    >
                      <span className="font-medium">{gender.name}</span>
                      <motion.div
                        animate={{ rotate: mobileSubMenu === gender.slug ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </motion.div>
                    </button>

                    {/* Mobile Submenu */}
                    <AnimatePresence>
                      {mobileSubMenu === gender.slug && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 pr-2 py-2 space-y-1">
                            <Link
                              to={`/products/${gender.slug}`}
                              onClick={closeMenu}
                              className="block py-2 px-4 text-sm text-primary hover:bg-accent rounded-lg transition-colors font-medium"
                            >
                              All {gender.name}
                            </Link>
                            {mobileSubMenuData.map((type) => (
                              <Link
                                key={type.id}
                                to={`/products/${gender.slug}?product_type=${type.slug}`}
                                onClick={closeMenu}
                                className="block py-2 px-4 text-sm text-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <span>{type.name}</span>
                                  <span className="text-xs text-muted-foreground">{type.product_count}</span>
                                </div>
                              </Link>
                            ))}
                            <Link
                              to={`/products/${gender.slug}?is_new=true`}
                              onClick={closeMenu}
                              className="block py-2 px-4 text-sm text-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                            >
                              New Arrivals
                            </Link>
                            <Link
                              to={`/products/${gender.slug}?is_sale=true`}
                              onClick={closeMenu}
                              className="block py-2 px-4 text-sm text-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                            >
                              On Sale
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}

                <div className="border-t border-border my-2"></div>

                {staticLinks.map((link, index) => (
                  <motion.div
                    key={link.name}
                    custom={genders.length + index}
                    variants={linkVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Link
                      to={link.path}
                      onClick={closeMenu}
                      className="block py-3 px-4 text-foreground hover:text-primary hover:bg-accent rounded-lg transition-all duration-200"
                    >
                      <motion.div
                        whileHover={{ x: 8 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        {link.name}
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 p-4 border-t border-border"
              >
                <div className="text-sm text-muted-foreground mb-2">Quick Actions</div>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      closeMenu();
                      setIsSearchOpen(true);
                    }}
                    className="flex items-center space-x-3 py-2 px-4 text-foreground hover:bg-accent rounded-lg transition-colors w-full"
                  >
                    <Search className="h-4 w-4" />
                    <span>Search Products</span>
                  </button>
                  <Link
                    to="/cart"
                    onClick={closeMenu}
                    className="flex items-center justify-between py-2 px-4 text-foreground hover:bg-accent rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <ShoppingBag className="h-4 w-4" />
                      <span>Shopping Cart</span>
                    </div>
                    {itemCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {itemCount}
                      </span>
                    )}
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};