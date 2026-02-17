import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, ZoomIn, X, ChevronLeft, ChevronRight, 
  Loader2, ShoppingBag, ShieldCheck, Truck, RefreshCcw,
  Minus, Plus, Star
} from 'lucide-react';
import { FaWhatsapp } from "react-icons/fa"; 
import { useToast } from '@/hooks/use-toast';
import { api, transformProduct } from '@/services/api';
import { cn } from "@/lib/utils";

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();
  
  // Existing States (Preserved)
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Enhanced States
  const [quantity, setQuantity] = useState(1);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await api.getProductById(id);
        const transformedProduct = transformProduct(response.product);
        setProduct(transformedProduct);

        if (response.product.product_type) {
          try {
            const relatedResponse = await api.getProductsByProductTypeSlug(
              response.product.product_type.slug,
              { sort_by: 'created_at', order: 'desc' }
            );
            const transformedRelated = relatedResponse.products
              .filter(p => p.id !== id)
              .map(transformProduct)
              .slice(0, 6);
            setRelatedProducts(transformedRelated);
          } catch (err) {
            console.error('Error fetching related products:', err);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  // Safety Checks (Preserved)
  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Curating details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto space-y-6">
            <h1 className="text-4xl font-serif mb-4">{error || 'Product not found'}</h1>
            <Button onClick={() => navigate('/')} variant="default" className="rounded-full px-8">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Collection
            </Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({
        title: "Size required",
        description: "Please select a size to continue.",
        variant: "destructive",
      });
      return;
    }
    // Added loop for quantity support if your context supports it, 
    // otherwise pass quantity as a parameter if addItem is updated.
    for(let i = 0; i < quantity; i++) {
        addItem(product, selectedSize, selectedColor);
    }
    
    toast({
      title: "Success",
      description: `${product.name} added to your bag.`,
    });
  };

  const handleWhatsAppShare = () => {
    const message = `Hi! I'm interested in: *${product.name}* ($${product.price})\nLink: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isZoomed) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const currentImage = product.images?.[currentImageIndex] || product.image;

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Dynamic Breadcrumb-style Back Button */}
      <div className="container mx-auto px-4 py-6">
        <Button 
          onClick={() => navigate(-1)} 
          variant="ghost" 
          className="hover:bg-transparent p-0 group text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Collection
        </Button>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT: Image Gallery - Modern Sidebar Layout */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[600px] no-scrollbar">
              {product.images?.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={cn(
                    "relative flex-shrink-0 w-20 h-24 rounded-lg overflow-hidden border-2 transition-all",
                    idx === currentImageIndex ? "border-primary shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={img} alt={product.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <div className="flex-1 relative group bg-secondary/30 rounded-2xl overflow-hidden aspect-[4/5]">
               <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full w-full"
                    ref={containerRef}
                    onMouseMove={handleMouseMove}
                  >
                    <img
                        src={currentImage}
                        alt={product.name}
                        className="w-full h-full object-cover cursor-zoom-in"
                        onClick={() => setIsZoomed(true)}
                    />
                  </motion.div>
               </AnimatePresence>

               {/* Overlays */}
               <div className="absolute top-4 left-4 flex flex-col gap-2">
                 {product.tags?.map((tag: string) => (
                    <Badge key={tag} className={cn(
                        "uppercase tracking-tighter font-bold border-none",
                        tag === 'on-sale' ? "bg-red-500" : "bg-black"
                    )}>
                        {tag.replace('-', ' ')}
                    </Badge>
                 ))}
               </div>

               <Button 
                 variant="secondary" 
                 size="icon" 
                 className="absolute bottom-4 right-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                 onClick={() => setIsZoomed(true)}
               >
                 <ZoomIn className="h-5 w-5" />
               </Button>
            </div>
          </div>

          {/* RIGHT: Product Specs */}
          <div className="lg:col-span-5 space-y-8">
            <header className="space-y-2">
              <div className="flex items-center gap-2 text-yellow-500">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">(4.9 / 5.0)</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif leading-tight">{product.name}</h1>
              <div className="flex items-baseline gap-4">
                <span className="text-3xl font-light">${product.price}</span>
                {product.originalPrice && (
                    <span className="text-xl text-muted-foreground line-through decoration-red-400/50">
                        ${product.originalPrice}
                    </span>
                )}
              </div>
            </header>

            <p className="text-muted-foreground leading-relaxed text-lg italic">
              "{product.description}"
            </p>

            {/* Visual Swatch Selectors */}
            <div className="space-y-6 py-6 border-y border-border">
              {/* Sizes */}
              <div className="space-y-3">
                <div className="flex justify-between">
                    <label className="text-sm font-bold uppercase tracking-widest">Select Size</label>
                    <button className="text-xs underline text-muted-foreground hover:text-primary">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "h-12 min-w-[3rem] px-4 rounded-md border text-sm font-medium transition-all",
                        selectedSize === size 
                            ? "border-primary bg-primary text-primary-foreground" 
                            : "border-input bg-background hover:border-primary"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-widest">Quantity</label>
                <div className="flex items-center w-32 border rounded-md">
                    <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                        <Minus className="h-4 w-4" />
                    </Button>
                    <span className="flex-1 text-center font-medium">{quantity}</span>
                    <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleAddToCart}
                className="w-full h-14 text-lg rounded-full shadow-xl hover:shadow-primary/20 transition-all"
                size="lg"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              
              <Button 
                onClick={handleWhatsAppShare}
                variant="outline"
                className="w-full h-14 rounded-full border-green-200 text-green-700 hover:bg-green-50"
              >
                <FaWhatsapp className="mr-2 h-5 w-5" />
                WhatsApp
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6">
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 bg-secondary rounded-full"><Truck className="h-5 w-5" /></div>
                    <span className="text-[10px] uppercase font-bold tracking-tighter">Fast Delivery</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 bg-secondary rounded-full"><ShieldCheck className="h-5 w-5" /></div>
                    <span className="text-[10px] uppercase font-bold tracking-tighter">Secure Checkout</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 bg-secondary rounded-full"><RefreshCcw className="h-5 w-5" /></div>
                    <span className="text-[10px] uppercase font-bold tracking-tighter">Easy Returns</span>
                </div>
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <section className="mt-32">
            <div className="flex items-end justify-between mb-12 border-b pb-6">
              <div>
                <h2 className="text-3xl font-serif italic">Complete the Look</h2>
                <p className="text-muted-foreground">Handpicked pieces to complement your style</p>
              </div>
              <div className="flex gap-2">
                 {/* Preserved your scroll logic */}
                <Button variant="outline" size="icon" className="rounded-full" onClick={() => document.getElementById('rel-cont')?.scrollBy({left: -300, behavior: 'smooth'})}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full" onClick={() => document.getElementById('rel-cont')?.scrollBy({left: 300, behavior: 'smooth'})}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div 
              id="rel-cont"
              className="flex gap-8 overflow-x-auto scrollbar-hide pb-10 px-2 -mx-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {relatedProducts.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex-shrink-0 w-[280px]"
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* FULLSCREEN ZOOM MODAL (Enhanced) */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-md flex items-center justify-center cursor-zoom-out"
            onClick={() => setIsZoomed(false)}
          >
            <Button variant="ghost" size="icon" className="fixed top-8 right-8 z-[110] rounded-full bg-secondary">
              <X className="h-6 w-6" />
            </Button>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="relative w-full h-full max-w-5xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                className="w-full h-full"
                style={{
                  backgroundImage: `url(${currentImage})`,
                  backgroundSize: '200%',
                  backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  backgroundRepeat: 'no-repeat',
                }}
                onMouseMove={handleMouseMove}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetail;