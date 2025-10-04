import { useState, useEffect } from 'react';
import { ProductCard } from "@/components/ProductCard";
import { api, transformProduct, Product as ApiProduct } from "@/services/api";
import heroImage from "@/assets/hero-fashion.jpg";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Leaf, Scissors, Clock, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const categories = [
  {
    name: 'Men',
    description: 'Contemporary menswear',
    className: 'bg-gradient-to-br from-gray-900/70 to-gray-700/70',
    bgImage: 'https://images.unsplash.com/photo-1491336477066-31156b5e4f35?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA',
    slug: 'men'
  },
  {
    name: 'Women',
    description: 'Elegant feminine styles',
    className: 'bg-gradient-to-br from-gray-900/70 to-gray-700/70',
    bgImage: 'https://images.unsplash.com/photo-1589212987511-4a924cb9d8ac?q=80&w=464&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    slug: 'women'
  },
  {
    name: 'New Arrivals',
    description: 'Latest collections',
    className: 'bg-gradient-to-br from-accent/70 to-gold-accent/70',
    bgImage: 'https://img.freepik.com/free-psd/new-arrival-post-template-psd-fashion-shopping_53876-129197.jpg?t=st=1759059713~exp=1759063313~hmac=ca3e82e5abf43b74d16bc30fa681f1b0822b099f6c5e260463e79bf1f258f267&w=1480',
    slug: 'new-arrivals'
  },
  {
    name: 'Sale',
    description: 'Up to 50% off',
    className: 'bg-gradient-to-br from-primary/70 to-gray-800/70',
    bgImage: 'https://img.freepik.com/free-vector/sales-instagram-post-with-photo_23-2148365196.jpg?t=st=1759059856~exp=1759063456~hmac=2c0c8658960d0fd29df8f1cf0c261dd3687cf2be6b604f93b5424abbe32f7fd7&w=1060',
    slug: 'sale'
  }
];

const editorialImages = [
  {
    url: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=800&h=1000&fit=crop',
    title: 'Winter Essentials',
    subtitle: 'Minimalist Comfort'
  },
  {
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop',
    title: 'Urban Elegance',
    subtitle: 'City Ready'
  },
  {
    url: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=1000&fit=crop',
    title: 'Refined Casual',
    subtitle: 'Everyday Luxury'
  }
];

const values = [
  {
    icon: Leaf,
    title: 'Sustainable',
    description: 'Eco-conscious materials and ethical production practices for a better tomorrow.'
  },
  {
    icon: Scissors,
    title: 'Craftsmanship',
    description: 'Meticulous attention to detail in every garment we create.'
  },
  {
    icon: Clock,
    title: 'Timeless',
    description: 'Designs that transcend trends and remain relevant for years to come.'
  },
  {
    icon: Shield,
    title: 'Quality',
    description: 'Premium materials and construction that stand the test of time.'
  }
];

interface TransformedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  sizes: string[];
  category: string;
  tags: string[];
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<TransformedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getAllProducts({
        sort_by: 'created_at',
        order: 'desc'
      });

      if (response.success) {
        const transformed = response.products.slice(0, 8).map(transformProduct);
        setProducts(transformed);
      } else {
        setError('Failed to load products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categorySlug: string) => {
    if (categorySlug === 'new-arrivals') {
      navigate('/products/all?is_new=true');
    } else if (categorySlug === 'sale') {
      navigate('/products/all?is_sale=true');
    } else {
      navigate(`/products/${categorySlug}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${heroImage})`,
          }}
        />

        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4 fade-in">
          <h1 className="text-5xl md:text-7xl font-light mb-6 tracking-wide text-balance">
            Discover Your
            <span className="block font-normal text-gold-accent">
              Perfect Style
            </span>
          </h1>

          <p className="text-xl md:text-2xl mb-8 font-light opacity-90 max-w-2xl mx-auto">
            Curated fashion for the modern individual. Timeless pieces that
            define elegance.
          </p>

          <Button
            size="lg"
            className="btn-hero text-lg px-12 py-6 rounded-none border-2 border-white bg-transparent hover:bg-white hover:text-primary"
            onClick={() => navigate('/products/all')}
          >
            Shop Now
          </Button>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4">
              Essential Collection
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Carefully curated pieces designed for the modern lifestyle. Each
              item combines functionality with timeless aesthetic.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchProducts} variant="outline">
                Try Again
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No products available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="bg-black text-white hover:bg-gray-900 px-12 py-4 text-lg font-light tracking-wide group transition-all duration-300"
              onClick={() => navigate('/products/all')}
            >
              View All Products
              <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-light text-center mb-12 tracking-wide">
            Shop by Category
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <div
                key={category.name}
                className="relative rounded-lg p-8 h-64 flex flex-col justify-end cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg fade-in overflow-hidden"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  backgroundImage: `url(${category.bgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                onClick={() => handleCategoryClick(category.slug)}
              >
                <div className="relative z-10">
                  <h3 className="text-2xl font-medium text-white mb-2">
                    {category.name}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {category.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4">
              What We Stand For
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our commitment extends beyond fashion. These principles guide every decision we make.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="text-center group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-6 border-2 border-black transition-all duration-300 group-hover:bg-black">
                    <Icon className="w-8 h-8 text-black group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-light text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Brand Story */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&h=700&fit=crop"
                  alt="Craftsmanship"
                  className="w-full h-96 lg:h-[500px] object-cover"
                />
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white flex items-center justify-center shadow-lg">
                  <div className="text-center">
                    <p className="text-2xl font-light text-black">Est.</p>
                    <p className="text-lg font-medium text-black">2024</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-8">
              <div>
                <h3 className="text-3xl md:text-4xl font-extralight text-gray-900 mb-6 leading-tight">
                  Where heritage meets innovation
                </h3>
                <div className="w-16 h-0.5 bg-black mb-8"></div>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Founded on the principle that true luxury lies in exceptional craftsmanship, 
                Thread & Steel represents the perfect marriage of traditional techniques and 
                contemporary design philosophy.
              </p>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-black rounded-full mt-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Ethical Manufacturing</h4>
                    <p className="text-gray-600">Every piece is created in facilities that prioritize fair wages and sustainable practices.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-black rounded-full mt-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Premium Materials</h4>
                    <p className="text-gray-600">Only the finest fabrics are sourced from renowned mills worldwide.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-black rounded-full mt-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Timeless Design</h4>
                    <p className="text-gray-600">Each collection transcends seasonal trends, focusing on enduring elegance.</p>
                  </div>
                </div>
              </div>
              <Button className="bg-black text-white hover:bg-gray-900 px-8 py-3 text-lg group">
                Discover Our Story
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;