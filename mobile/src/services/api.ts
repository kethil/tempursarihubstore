import { supabase } from '../lib/supabase';
import { Database } from '../lib/types';

// Type definitions (matching web app)
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"] & {
  category?: Category;
};
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ServiceRequest = Database["public"]["Tables"]["service_requests"]["Row"];

export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];
export type ProductStatus = Database["public"]["Enums"]["product_status"];
export type ServiceType = Database["public"]["Enums"]["service_type"];
export type RequestStatus = Database["public"]["Enums"]["request_status"];

// Dashboard Statistics Interface
export interface DashboardStats {
  totalPopulation: number;
  activeServices: number;
  newRequests: number;
  completedToday: number;
  totalOrders: number;
  revenue: number;
}

// News/Announcements Interface
export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  image?: string;
  category: string;
  date: string;
  location: string;
  author?: string;
}

// Village API Service
export const villageApi = {
  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get service requests count
      const { data: requests, error: requestsError } = await supabase
        .from('service_requests')
        .select('id, status, created_at');

      if (requestsError) throw requestsError;

      // Get orders count
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, created_at, status');

      if (ordersError) throw ordersError;

      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Calculate statistics
      const activeServices = requests?.filter(r => r.status === 'in_progress').length || 0;
      const newRequests = requests?.filter(r => r.status === 'pending').length || 0;
      const completedToday = requests?.filter(r => 
        r.status === 'completed' && 
        r.created_at?.startsWith(today)
      ).length || 0;

      const totalOrders = orders?.length || 0;
      const revenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      return {
        totalPopulation: 2847, // Static data - can be made dynamic
        activeServices,
        newRequests,
        completedToday,
        totalOrders,
        revenue,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  },

  // Get recent news/announcements
  async getNews(): Promise<NewsItem[]> {
    // For now, return mock data - can be integrated with a news table later
    return [
      {
        id: '1',
        title: 'Pembangunan Jalan Desa Tahap 2 Dimulai',
        excerpt: 'Proyek pembangunan infrastruktur jalan desa memasuki tahap kedua dengan target selesai dalam 3 bulan.',
        image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400',
        category: 'Infrastruktur',
        date: '2 jam lalu',
        location: 'Desa Tempursari',
      },
      {
        id: '2',
        title: 'Program Vaksinasi COVID-19 Dosis Booster',
        excerpt: 'Pelaksanaan vaksinasi dosis booster untuk warga desa akan dilakukan di balai desa mulai besok.',
        image: 'https://images.unsplash.com/photo-1584118624012-df056829fbd0?w=400',
        category: 'Kesehatan',
        date: '4 jam lalu',
        location: 'Balai Desa',
      },
      {
        id: '3',
        title: 'Festival Budaya Desa 2024',
        excerpt: 'Persiapan festival budaya tahunan sedang berlangsung dengan berbagai pertunjukan seni tradisional.',
        image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400',
        category: 'Budaya',
        date: '1 hari lalu',
        location: 'Lapangan Desa',
      },
    ];
  },
};

// Products API (from existing shopApi)
export const productsApi = {
  // Get featured products
  async getFeaturedProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(*)
      `)
      .eq("status", "active")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching featured products:", error);
      throw new Error(`Failed to fetch featured products: ${error.message}`);
    }

    return data || [];
  },

  // Get all products with filters
  async getProducts(categoryId?: string, search?: string): Promise<Product[]> {
    let query = supabase
      .from("products")
      .select(`
        *,
        category:categories(*)
      `)
      .eq("status", "active");

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching products:", error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return data || [];
  },

  // Get product by ID
  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      console.error("Error fetching product:", error);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    return data;
  },
};

// Categories API
export const categoriesApi = {
  // Get all active categories
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data || [];
  },
};

// Orders API (for user orders)
export const ordersApi = {
  // Get user orders
  async getUserOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user orders:", error);
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return data || [];
  },

  // Get order by ID
  async getOrderById(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      console.error("Error fetching order:", error);
      throw new Error(`Failed to fetch order: ${error.message}`);
    }

    return data;
  },
};

// Service Requests API
export const serviceRequestsApi = {
  // Get user service requests
  async getUserRequests(userId: string): Promise<ServiceRequest[]> {
    const { data, error } = await supabase
      .from("service_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching service requests:", error);
      throw new Error(`Failed to fetch service requests: ${error.message}`);
    }

    return data || [];
  },

  // Create new service request
  async createServiceRequest(requestData: {
    full_name: string;
    nik: string;
    phone: string;
    request_type: ServiceType;
    documents?: any;
    user_id?: string;
  }): Promise<ServiceRequest> {
    const { data, error } = await supabase
      .from("service_requests")
      .insert({
        ...requestData,
        status: 'pending',
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating service request:", error);
      throw new Error(`Failed to create service request: ${error.message}`);
    }

    return data;
  },

  // Get request by ID
  async getRequestById(requestId: string): Promise<ServiceRequest | null> {
    const { data, error } = await supabase
      .from("service_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      console.error("Error fetching service request:", error);
      throw new Error(`Failed to fetch service request: ${error.message}`);
    }

    return data;
  },

  // Search service request by NIK
  async searchByNik(nik: string): Promise<ServiceRequest | null> {
    const { data, error } = await supabase
      .from("service_requests")
      .select("*")
      .eq("nik", nik.trim())
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error searching service request by NIK:", error);
      throw new Error(`Failed to search service request: ${error.message}`);
    }

    return data && data.length > 0 ? data[0] : null;
  },
};

// Utility functions
export const utils = {
  // Format price in Indonesian Rupiah
  formatPrice: (price: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  },

  // Format date to Indonesian format
  formatDate: (date: string): string => {
    return new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  },

  // Format relative time
  formatRelativeTime: (date: string): string => {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
    
    return utils.formatDate(date);
  },

  // Get product main image
  getProductMainImage: (product: Product): string => {
    const images = product.images as string[] | null;
    return images && images.length > 0 ? images[0] : 'https://via.placeholder.com/300x200?text=No+Image';
  },

  // Get status color
  getStatusColor: (status: string): string => {
    const colors: { [key: string]: string } = {
      'pending': '#f59e0b',
      'in_progress': '#06b6d4',
      'completed': '#10b981',
      'rejected': '#ef4444',
      'cancelled': '#6b7280',
      'confirmed': '#10b981',
      'processing': '#06b6d4',
      'shipped': '#8b5cf6',
      'delivered': '#10b981',
    };
    return colors[status] || '#6b7280';
  },
};