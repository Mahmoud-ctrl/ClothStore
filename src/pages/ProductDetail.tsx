import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ZoomIn, X, MessageCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { FaWhatsapp } from "react-icons/fa"; 
import { useToast } from '@/hooks/use-toast';
import { api, transformProduct, Product } from '@/services/api';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);

      try {
        const response = await api.getProductById(id);
        const transformedProduct = transformProduct(response.product);
        setProduct(transformedProduct);

        // Fetch related products from the same product_type
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
            // Don't fail the whole page if related products fail
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-medium mb-4">
          {error || 'Product not found'}
        </h1>
        <Button onClick={() => navigate('/')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shop
        </Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({
        title: "Please select a size",
        description: "Choose a size before adding to cart.",
        variant: "destructive",
      });
      return;
    }
    
    addItem(product, selectedSize, selectedColor);
    toast({
      title: "Added to cart",
      description: `${product.name} (${selectedSize}${selectedColor ? `, ${selectedColor}` : ''}) has been added to your cart.`,
    });
  };

  const handleWhatsAppShare = () => {
    const message = `Hi! I'm interested in this product:\n\n*${product.name}*\nPrice: $${product.price}\n\n${product.description}\n\nCould you please provide more information?`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleImageClick = () => {
    setIsZoomed(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isZoomed) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setZoomPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const scrollRelatedProducts = (direction: 'left' | 'right') => {
    const container = document.getElementById('related-products-container');
    if (container) {
      const scrollAmount = 320;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const currentImage = product.images?.[currentImageIndex] || product.image;
  const hasMultipleImages = product.images && product.images.length > 1;

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Button 
          onClick={() => navigate(-1)} 
          variant="ghost" 
          className="mb-8 -ml-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image with Zoom */}
          <motion.div 
            className="relative space-y-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div 
              ref={containerRef}
              className="aspect-square bg-accent overflow-hidden cursor-zoom-in relative group"
              onClick={handleImageClick}
              onMouseMove={handleMouseMove}
            >
              <img
                ref={imageRef}
                src={currentImage}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              <div className="absolute top-4 right-4 bg-white/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ZoomIn className="h-5 w-5 text-gray-700" />
              </div>
            </div>

            {/* Image Thumbnails */}
            {hasMultipleImages && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 border-2 rounded overflow-hidden transition-all ${
                      idx === currentImageIndex 
                        ? 'border-black' 
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Product Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.tags.map((tag: string) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      tag === 'on-sale' 
                        ? 'bg-red-500 text-white' 
                        : tag === 'new-arrival'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-800 text-white'
                    }`}
                  >
                    {tag === 'new-arrival' ? 'New' : tag === 'on-sale' ? 'Sale' : tag}
                  </motion.span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div>
              <h1 className="text-3xl font-light text-foreground">{product.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                {product.originalPrice && (
                  <p className="text-lg text-muted-foreground line-through">
                    ${product.originalPrice}
                  </p>
                )}
                <p className="text-2xl font-medium text-foreground">${product.price}</p>
                {product.originalPrice && (
                  <span className="bg-red-100 text-red-600 px-2 py-1 text-sm font-medium rounded">
                    Save ${product.originalPrice - product.price}
                  </span>
                )}
              </div>
            </div>

            <p className="text-muted-foreground text-lg leading-relaxed">
              {product.description}
            </p>

            <div className="space-y-4">
              {/* Size Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Size</label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.sizes.map((size: string) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <Select value={selectedColor} onValueChange={setSelectedColor}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {product.colors.map((color: string) => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  onClick={handleAddToCart}
                  className="flex-1"
                  size="lg"
                >
                  Add to Cart
                </Button>
                
                <Button 
                  onClick={handleWhatsAppShare}
                  variant="outline"
                  size="lg"
                  className="px-6 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800"
                >
                  <FaWhatsapp className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="font-medium mb-3">Product Details</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Premium quality materials</li>
                <li>• Designed for comfort and durability</li>
                <li>• Machine washable</li>
                <li>• Free shipping on orders over $100</li>
                <li>• Category: {product.category}</li>
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.section 
            className="mt-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-light text-foreground">You might also like</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollRelatedProducts('left')}
                  className="p-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollRelatedProducts('right')}
                  className="p-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div 
              id="related-products-container"
              className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {relatedProducts.map((relatedProduct, index) => (
                <motion.div
                  key={relatedProduct.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="flex-shrink-0 w-80"
                >
                  <ProductCard product={relatedProduct} />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </motion.div>

      {/* Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIsZoomed(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                onClick={() => setIsZoomed(false)}
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div 
                className="overflow-hidden cursor-zoom-out"
                style={{
                  backgroundImage: `url(${currentImage})`,
                  backgroundSize: '200%',
                  backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  backgroundRepeat: 'no-repeat',
                  width: '80vw',
                  height: '80vh',
                  maxWidth: '800px',
                  maxHeight: '800px'
                }}
                onMouseMove={handleMouseMove}
                onClick={() => setIsZoomed(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetail;