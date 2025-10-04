import { Product } from '@/contexts/CartContext';
import tshirtWhite from '@/assets/tshirt-white.jpg';
import jacketDenim from '@/assets/jacket-denim.jpg';
import trousersBeige from '@/assets/trousers-beige.jpg';
import sweaterGray from '@/assets/sweater-gray.jpg';

export const products: Product[] = [
  // Original products with updated categories
  
  {
    id: '1',
    name: 'Essential White Tee',
    description: 'A minimalist essential crafted from premium organic cotton. Soft, breathable, and designed for everyday comfort.',
    price: 45,
    image: tshirtWhite,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    category: 'men',
    tags: ['new-arrival']
  },
  {
    id: '2',
    name: 'Classic Denim Jacket',
    description: 'Timeless denim jacket with a modern fit. Made from durable cotton denim with subtle distressing for character.',
    price: 120,
    image: jacketDenim,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    category: 'men',
    tags: ['on-sale']
  },
  {
    id: '3',
    name: 'Wide-Leg Trousers',
    description: 'Elegant wide-leg trousers in neutral beige. Perfect for both casual and professional settings.',
    price: 85,
    image: trousersBeige,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    category: 'unisex',
    tags: ['new-arrival']
  },
  {
    id: '4',
    name: 'Merino Wool Sweater',
    description: 'Luxurious merino wool sweater in charcoal gray. Lightweight yet warm, perfect for layering.',
    price: 95,
    image: sweaterGray,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    category: 'women',
    tags: ['on-sale']
  },
  
  // New Men's Products
  {
    id: '5',
    name: 'Oxford Button-Down Shirt',
    description: 'Classic oxford cotton shirt with a refined collar. Perfect for business casual or weekend wear.',
    price: 68,
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&h=600&fit=crop',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    category: 'men',
    tags: ['new-arrival']
  },
  {
    id: '6',
    name: 'Slim Fit Chinos',
    description: 'Modern slim-fit chinos in versatile navy. Made from stretch cotton twill for comfort and style.',
    price: 55,
    originalPrice: 75,
    image: 'https://images.unsplash.com/photo-1718252540617-6ecda2b56b57?q=80&w=580&auto=format&fit=crop',
    sizes: ['30', '32', '34', '36', '38', '40'],
    category: 'men',
    tags: ['on-sale']
  },
  {
    id: '7',
    name: 'Modern Chic Jacket',
    description: 'Sleek and modern, this jacket adds a touch of sophistication to your everyday wardrobe.',
    price: 185,
    image: 'https://images.unsplash.com/photo-1646588714110-910c3ed742c0?q=80&w=465&auto=format&fit=crop',
    sizes: ['S', 'M', 'L', 'XL'],
    category: 'women',
    tags: ['new-arrival']
  },
  {
    id: '8',
    name: 'Henley Long Sleeve',
    description: 'Casual henley in soft heather gray. Three-button placket and relaxed fit for effortless style.',
    price: 42,
    originalPrice: 58,
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&h=600&fit=crop',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    category: 'men',
    tags: ['on-sale']
  },

  // New Women's Products
  {
    id: '9',
    name: 'Silk Wrap Blouse',
    description: 'Elegant silk wrap blouse in dusty rose. Flowing sleeves and flattering silhouette for versatile styling.',
    price: 98,
    image: 'https://images.unsplash.com/photo-1600202280932-78b414fb1def?q=80&w=870&auto=format&fit=crop',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    category: 'women',
    tags: ['new-arrival']
  },
  {
    id: '10',
    name: 'High-Waist Skinny Jeans',
    description: 'Premium denim with stretch for the perfect fit. Classic indigo wash with subtle fading.',
    price: 72,
    originalPrice: 95,
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&h=600&fit=crop',
    sizes: ['24', '26', '28', '30', '32', '34'],
    category: 'women',
    tags: ['on-sale', 'bestseller']
  },
  {
    id: '11',
    name: 'Cashmere Cardigan',
    description: 'Luxurious cashmere cardigan in cream. Oversized fit with ribbed cuffs and hem for cozy elegance.',
    price: 145,
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&h=600&fit=crop',
    sizes: ['XS', 'S', 'M', 'L'],
    category: 'women',
    tags: ['new-arrival']
  },
  {
    id: '12',
    name: 'Midi Slip Dress',
    description: 'Minimalist slip dress in black satin. Adjustable straps and bias cut for a flattering drape.',
    price: 88,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=600&fit=crop',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    category: 'women',
    tags: ['bestseller']
  },
  {
    id: '13',
    name: 'Pleated Midi Skirt',
    description: 'Sophisticated pleated skirt in camel. High-waisted design with hidden side zip closure.',
    price: 65,
    originalPrice: 85,
    image: 'https://plus.unsplash.com/premium_photo-1674129670339-554be9059cf4?q=80&w=674&auto=format&fit=crop',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    category: 'women',
    tags: ['on-sale']
  },

  // Additional Unisex Items
  {
    id: '14',
    name: 'Organic Cotton Hoodie',
    description: 'Sustainable hoodie in forest green. Made from 100% organic cotton with a relaxed fit.',
    price: 78,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=600&fit=crop',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    category: 'unisex',
    tags: ['new-arrival']
  },
  {
    id: '15',
    name: 'Canvas Utility Jacket',
    description: 'Durable canvas jacket with multiple pockets. Weather-resistant finish in olive green.',
    price: 92,
    originalPrice: 120,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=600&fit=crop',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    category: 'unisex',
    tags: ['on-sale']
  },
  {
    id: '16',
    name: 'Ribbed Beanie',
    description: 'Classic ribbed knit beanie in charcoal. One size fits most, perfect for layering.',
    price: 25,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=600&fit=crop',
    sizes: ['One Size'],
    category: 'unisex',
    tags: ['bestseller']
  }, 
  {
    id: '17',
    name: 'Essential White Tee',
    description: 'A minimalist essential crafted from premium organic cotton. Soft, breathable, and designed for everyday comfort.',
    price: 45,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    category: 'unisex',
    tags: ['bestseller']
  },
  {
    id: '19',
    name: 'Wide-Leg Trousers',
    description: 'Elegant wide-leg trousers in neutral beige. Perfect for both casual and professional settings.',
    price: 85,
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=600&fit=crop',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    category: 'women',
    tags: []
  },
  {
    id: '20',
    name: 'Merino Wool Sweater',
    description: 'Luxurious merino wool sweater in charcoal gray. Lightweight yet warm, perfect for layering.',
    price: 95,
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&h=600&fit=crop',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    category: 'unisex',
    tags: []
  },
];

// Helper functions to filter products
export const getProductsByCategory = (category: 'men' | 'women' | 'unisex') => {
  return products.filter(product => product.category === category);
};

export const getProductsByTag = (tag: 'new-arrival' | 'on-sale' | 'bestseller') => {
  return products.filter(product => product.tags.includes(tag));
};

export const getNewArrivals = () => getProductsByTag('new-arrival');
export const getSaleProducts = () => getProductsByTag('on-sale');
export const getBestsellers = () => getProductsByTag('bestseller');