const API_BASE = import.meta.env.VITE_API_URL;

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price?: number;
  images: string[];
  in_stock: boolean;
  is_new: boolean;
  is_sale: boolean;
  sizes: string[];
  colors?: string[];
  product_type: { 
    id: number;
    name: string;
    slug: string;
    gender: { 
      id: number;
      name: string;
      slug: string;
    };
  };
  review_count?: number;
  sales_count?: number;
  created_at?: string;
}

export interface Gender {
  id: number;
  name: string;
  slug: string;
  total_products?: number;
}

export interface ProductType {
  id: number;
  name: string;
  slug: string;
  gender: {
    id: number;
    name: string;
    slug: string;
  };
  product_count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============ ORDER TYPES ============

export interface OrderItem {
  product_id: number;
  quantity: number;
  size: string;
  color?: string;
}

export interface CreateOrderRequest {
  customer_name: string;
  customer_phone: string;
  address_line1: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  items: OrderItem[];
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  address_line1: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at?: string;
  delivered_at?: string;
  item_count: number;
  items?: Array<{
    id: number;
    product_id: number;
    product_title: string;
    product_image: string;
    price: number;
    size: string;
    color?: string;
    quantity: number;
    subtotal: number;
  }>;
}

// ============ Search TYPES ============
export interface SearchResult {
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

export interface GlobalSearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
  pages: number;
  current_page: number;
  per_page: number;
}

export interface FilterOptions {
  sizes: string[];
  colors: string[];
  price_range: {
    min: number;
    max: number;
  };
}

export interface FilteredSearchParams {
  q?: string;
  gender?: string;
  product_type?: string;
  on_sale?: boolean;
  new_arrivals?: boolean;
  sizes?: string;
  colors?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  sort?: 'newest' | 'price_low' | 'price_high' | 'popular';
  page?: number;
  per_page?: number;
}

export interface FilteredSearchResponse {
  products: Product[];
  total: number;
  pages: number;
  current_page: number;
  per_page: number;
  filters_applied: {
    search: string | null;
    gender: string | null;
    product_type: string | null;
    on_sale: boolean;
    new_arrivals: boolean;
    sizes: string[];
    colors: string[];
    min_price: number | null;
    max_price: number | null;
    in_stock: boolean;
    sort: string;
  };
}

class ApiService {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // ============ PRODUCT ENDPOINTS ============

  async getAllProducts(params?: {
    gender_slug?: string; 
    product_type_slug?: string; 
    is_new?: boolean;
    is_sale?: boolean;
    sort_by?: 'name' | 'price' | 'created_at';
    order?: 'asc' | 'desc';
  }): Promise<{ success: boolean; count: number; products: Product[] }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const url = `${API_BASE}/products${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url);
    return this.handleResponse(response);
  }

  async getProductById(id: string): Promise<{ success: boolean; product: Product }> {
    const response = await fetch(`${API_BASE}/products/${id}`);
    return this.handleResponse(response);
  }

  async getProductsByGenderSlug(genderSlug: string, params?: { 
    product_type_slug?: string;
    is_new?: boolean;
    is_sale?: boolean;
    sort_by?: 'name' | 'price' | 'created_at';
    order?: 'asc' | 'desc';
  }): Promise<{ success: boolean; gender: string; count: number; products: Product[] }> { 
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const url = `${API_BASE}/products/gender/${genderSlug}${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url);
    return this.handleResponse(response);
  }

  async getProductsByProductTypeSlug(productTypeSlug: string, params?: { 
    is_new?: boolean;
    is_sale?: boolean;
    sort_by?: 'name' | 'price' | 'created_at';
    order?: 'asc' | 'desc';
  }): Promise<{ success: boolean; product_type_slug: string; count: number; products: Product[] }> { 
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const url = `${API_BASE}/products/product-type/${productTypeSlug}${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url);
    return this.handleResponse(response);
  }

  // ============ CATEGORY ENDPOINTS ============

  async getAllCategories(): Promise<{ 
    success: boolean; 
    categories: Array<{
      id: number;
      name: string;
      slug: string;
      product_types: ProductType[];
    }>
  }> {
    const response = await fetch(`${API_BASE}/categories`);
    return this.handleResponse(response);
  }

  async getGenders(): Promise<{ success: boolean; genders: Gender[] }> {
    const response = await fetch(`${API_BASE}/categories/genders`);
    return this.handleResponse(response);
  }

  async getProductTypes(genderSlug?: string): Promise<{ success: boolean; product_types: ProductType[] }> {
    const url = genderSlug 
      ? `${API_BASE}/categories/product-types?gender_slug=${genderSlug}`
      : `${API_BASE}/categories/product-types`;
    const response = await fetch(url);
    return this.handleResponse(response);
  }

  // ============ ORDER ENDPOINTS ============
  async createOrder(orderData: CreateOrderRequest): Promise<{
    success: boolean;
    message: string;
    order: Order;
  }> {
    const response = await fetch(`${API_BASE}/orders/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    return this.handleResponse(response);
  }

  async getOrderByNumber(orderNumber: string): Promise<{
    success: boolean;
    order: Order;
  }> {
    const response = await fetch(`${API_BASE}/orders/number/${orderNumber}`);
    return this.handleResponse(response);
  }

// ============ SEARCH ENDPOINTS ============
async globalSearch(params: {
    q: string;
    page?: number;
    per_page?: number;
    sort?: 'newest' | 'price_low' | 'price_high' | 'popular';
  }): Promise<GlobalSearchResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', params.q);
    if (params.page) queryParams.append('page', String(params.page));
    if (params.per_page) queryParams.append('per_page', String(params.per_page));
    if (params.sort) queryParams.append('sort', params.sort);

    const response = await fetch(`${API_BASE}/search/global?${queryParams}`);
    return this.handleResponse(response);
  }

  async filteredSearch(params: FilteredSearchParams): Promise<FilteredSearchResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const response = await fetch(`${API_BASE}/search/products?${queryParams}`);
    return this.handleResponse(response);
  }

  async getFilterOptions(params?: {
    gender?: string;
    product_type?: string;
  }): Promise<FilterOptions> {
    const queryParams = new URLSearchParams();
    if (params?.gender) queryParams.append('gender', params.gender);
    if (params?.product_type) queryParams.append('product_type', params.product_type);

    const url = `${API_BASE}/search/filters${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url);
    return this.handleResponse(response);
  }

  async getProductFilterOptions(params?: {
    gender_slug?: string;
    product_type_slug?: string;
  }): Promise<{
    success: boolean;
    sizes: string[];
    colors: string[];
    price_range: { min: number; max: number };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.gender_slug) queryParams.append('gender_slug', params.gender_slug);
    if (params?.product_type_slug) queryParams.append('product_type_slug', params.product_type_slug);

    const url = `${API_BASE}/products/filters${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url);
    return this.handleResponse(response);
  }
}

export const api = new ApiService();

export const transformProduct = (backendProduct: Product) => ({
  id: backendProduct.id,
  name: backendProduct.title,
  description: backendProduct.description,
  price: backendProduct.price,
  originalPrice: backendProduct.original_price,
  image: backendProduct.images?.[0] || '',
  images: backendProduct.images,
  sizes: backendProduct.sizes,
  colors: backendProduct.colors,
  category: backendProduct.product_type.gender.slug.includes('men') ? 'men' 
    : backendProduct.product_type.gender.slug.includes('women') ? 'women' 
    : 'unisex',
  tags: [
    ...(backendProduct.is_new ? ['new-arrival'] : []),
    ...(backendProduct.is_sale ? ['on-sale'] : [])
  ]
});