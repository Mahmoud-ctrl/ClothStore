import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, ChevronRight, ArrowRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { api, ProductType, Gender } from '@/services/api';
import { SearchModal } from '@/components/Search';
import { cn } from '@/lib/utils';

export const Navigation: React.FC = () => {
  const { state } = useCart();
  const location = useLocation();
  const itemCount = state.items.reduce((total, item) => total + item.quantity, 0);

  const [isMenuOpen, setIsMenuOpen]     = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeHover, setActiveHover]   = useState<string | null>(null);
  const [megaMenuData, setMegaMenuData] = useState<{ gender: string; types: ProductType[] } | null>(null);
  const [heroImage, setHeroImage]       = useState<{ image: string | null; title: string | null; product_type: string | null } | null>(null);

  // Mobile: which gender accordion is expanded
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  // Cache of product types per gender slug for the mobile drawer
  const [mobileTypes, setMobileTypes] = useState<Record<string, ProductType[]>>({});

  // ── Scroll animation ────────────────────────────────────────────────────────
  const { scrollY } = useScroll();
  const navWidth        = useTransform(scrollY, [0, 100], ['100%', '90%']);
  const navTop          = useTransform(scrollY, [0, 100], [0, 20]);
  const navBorderRadius = useTransform(scrollY, [0, 100], [0, 50]);
  const navShadow       = useTransform(scrollY, [0, 100], [
    '0px 0px 0px rgba(0,0,0,0)',
    '0px 10px 30px rgba(0,0,0,0.1)',
  ]);

  // ── Data ────────────────────────────────────────────────────────────────────
  const [genders, setGenders] = useState<Gender[]>([]);
  useEffect(() => {
    api.getGenders().then(res => setGenders(res.genders));
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setMobileExpanded(null);
  }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  // ── Desktop mega menu ───────────────────────────────────────────────────────
  const handleMouseEnter = async (genderSlug: string) => {
    setActiveHover(genderSlug);
    setHeroImage(null); // reset while loading
    const [typesResponse, heroResponse] = await Promise.all([
      api.getProductTypes(genderSlug),
      fetch(`${import.meta.env.VITE_API_URL}/search/gender-hero/${genderSlug}`).then(r => r.json()),
    ]);
    setMegaMenuData({ gender: genderSlug, types: typesResponse.product_types });
    setHeroImage(heroResponse);
  };

  // ── Mobile accordion ────────────────────────────────────────────────────────
  const handleMobileExpand = async (genderSlug: string) => {
    const next = mobileExpanded === genderSlug ? null : genderSlug;
    setMobileExpanded(next);
    if (next && !mobileTypes[next]) {
      const response = await api.getProductTypes(next);
      setMobileTypes(prev => ({ ...prev, [next]: response.product_types }));
    }
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════════
          DESKTOP NAV (unchanged from original)
      ════════════════════════════════════════════════════════════════════════ */}
      <motion.nav
        style={{
          width: navWidth,
          top: navTop,
          borderRadius: navBorderRadius,
          boxShadow: navShadow,
        }}
        animate={{ opacity: isMenuOpen ? 0 : 1, pointerEvents: isMenuOpen ? 'none' : 'auto' }}
        transition={{ duration: 0.2 }}
        className="fixed left-1/2 -translate-x-1/2 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 transition-colors duration-300"
      >
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="relative z-10">
            <motion.span
              className="text-2xl font-black tracking-tighter uppercase italic"
              whileHover={{ skewX: -10 }}
            >
              Fashion<span className="text-primary">Hub</span>
            </motion.span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center space-x-1">
            {genders.map((gender) => (
              <div
                key={gender.id}
                onMouseEnter={() => handleMouseEnter(gender.slug)}
                onMouseLeave={() => setActiveHover(null)}
                className="relative px-4 py-2"
              >
                <Link
                  to={`/products/${gender.slug}`}
                  className={cn(
                    'text-sm font-medium transition-colors relative z-10',
                    activeHover === gender.slug ? 'text-primary' : 'text-foreground/70',
                  )}
                >
                  {gender.name}
                </Link>
                {activeHover === gender.slug && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-accent rounded-full -z-0"
                    transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} className="rounded-full">
              <Search className="w-5 h-5" />
            </Button>

            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative rounded-full group">
                <ShoppingBag className="w-5 h-5 transition-transform group-hover:-rotate-12" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 w-4 h-4 bg-primary text-[10px] font-bold text-white rounded-full flex items-center justify-center"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </Button>
            </Link>

            {/* Hamburger — mobile only */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Desktop mega menu */}
        <AnimatePresence>
          {activeHover && megaMenuData && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onMouseEnter={() => setActiveHover(megaMenuData.gender)}
              onMouseLeave={() => setActiveHover(null)}
              className="absolute top-full left-0 w-full bg-background border-b border-border shadow-2xl overflow-hidden"
            >
              <div className="container mx-auto grid grid-cols-12 gap-8 p-12">
                <div className="col-span-4 space-y-6">
                  <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                    Collections
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {megaMenuData.types.map((type) => (
                      <Link
                        key={type.id}
                        to={`/products/${megaMenuData.gender}?type=${type.slug}`}
                        className="text-sm hover:text-primary transition-colors flex items-center justify-between group"
                      >
                        {type.name}
                        <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="col-span-8 grid grid-cols-2 gap-4">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-xl group bg-muted">
                    <AnimatePresence mode="wait">
                      {heroImage?.image ? (
                        <motion.img
                          key={heroImage.image}
                          src={heroImage.image}
                          alt={heroImage.title ?? 'Featured product'}
                          initial={{ opacity: 0, scale: 1.04 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.35 }}
                          className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <motion.div
                          key="skeleton"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-full h-full bg-muted animate-pulse"
                        />
                      )}
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6 pointer-events-none">
                      <div>
                        <p className="text-white/70 text-xs uppercase tracking-widest">
                          {heroImage?.product_type ?? 'New Arrival'}
                        </p>
                        <h3 className="text-white text-xl font-bold line-clamp-1">
                          {heroImage?.title ?? ''}
                        </h3>
                      </div>
                    </div>
                  </div>
                  <div className="bg-accent rounded-xl p-8 flex flex-col justify-center">
                    <h3 className="text-2xl font-serif italic mb-2">Up to 40% Off</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      Explore the winter clearance and find your signature style.
                    </p>
                    <Button className="w-fit rounded-full uppercase text-xs tracking-tighter">
                      Shop the Sale
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ═══════════════════════════════════════════════════════════════════════
          MOBILE DRAWER
      ════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Drawer panel — slides in from the right */}
            <motion.aside
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 z-50 h-full w-[85vw] max-w-sm bg-background flex flex-col md:hidden shadow-2xl"
            >
              {/* ── Drawer header ─────────────────────────────────────────── */}
              <div className="flex items-center justify-between px-6 h-20 border-b border-border/60 flex-shrink-0">
                <Link to="/" onClick={() => setIsMenuOpen(false)}>
                  <span className="text-xl font-black tracking-tighter uppercase italic">
                    Fashion<span className="text-primary">Hub</span>
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-full"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* ── Drawer body (scrollable) ───────────────────────────────── */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-6">

                {/* Cart quick-access */}
                <Link
                  to="/cart"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between mb-6 px-4 py-3 bg-accent rounded-2xl group"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold">My Cart</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {itemCount > 0 && (
                      <span className="w-6 h-6 bg-primary text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                        {itemCount}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>

                {/* Gender accordion list */}
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold px-2 mb-3">
                  Shop
                </p>
                <nav className="space-y-1">
                  {genders.map((gender, i) => {
                    const isExpanded = mobileExpanded === gender.slug;
                    const types = mobileTypes[gender.slug] ?? [];

                    return (
                      <motion.div
                        key={gender.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        {/* Accordion trigger */}
                        <button
                          onClick={() => handleMobileExpand(gender.slug)}
                          className={cn(
                            'w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left transition-colors',
                            isExpanded
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-accent text-foreground',
                          )}
                        >
                          <span className="font-semibold text-sm">{gender.name}</span>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </motion.div>
                        </button>

                        {/* Accordion content: product types */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              key="content"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="pl-4 pr-2 pb-2 pt-1 space-y-0.5">
                                {/* "View all" shortcut */}
                                <Link
                                  to={`/products/${gender.slug}`}
                                  onClick={() => setIsMenuOpen(false)}
                                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-primary font-medium hover:bg-primary/5 transition-colors group"
                                >
                                  View All {gender.name}
                                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>

                                {/* Product type links */}
                                {types.length === 0
                                  ? (
                                    // Skeleton while loading
                                    Array.from({ length: 4 }).map((_, k) => (
                                      <div
                                        key={k}
                                        className="mx-3 my-2 h-4 rounded bg-muted animate-pulse"
                                        style={{ width: `${60 + k * 10}%` }}
                                      />
                                    ))
                                  )
                                  : types.map((type, j) => (
                                    <motion.div
                                      key={type.id}
                                      initial={{ opacity: 0, x: -6 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: j * 0.04 }}
                                    >
                                      <Link
                                        to={`/products/${gender.slug}?type=${type.slug}`}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-foreground/80 hover:text-foreground hover:bg-accent transition-colors group"
                                      >
                                        {type.name}
                                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </Link>
                                    </motion.div>
                                  ))
                                }
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Sale banner — mirrors the mega-menu promo card */}
                <div className="mt-8 rounded-2xl bg-accent overflow-hidden">
                  <div className="px-5 py-6">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                      Limited Time
                    </p>
                    <h3 className="text-xl font-serif italic text-foreground mb-1">
                      Up to 40% Off
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Winter clearance. Find your signature style.
                    </p>
                    <Link to="/sale" onClick={() => setIsMenuOpen(false)}>
                      <Button size="sm" className="rounded-full uppercase text-xs tracking-wider">
                        Shop the Sale
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* ── Drawer footer ──────────────────────────────────────────── */}
              <div className="flex-shrink-0 border-t border-border/60 px-6 py-4">
                <button
                  onClick={() => { setIsMenuOpen(false); setIsSearchOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-muted rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>Search products…</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};