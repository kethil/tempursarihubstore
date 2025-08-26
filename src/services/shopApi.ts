import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

// Type definitions
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"] & {
  category?: Category;
};
export type CartItem = Database["public"]["Tables"]["cart_items"]["Row"] & {
  product?: Product;
};
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];
export type ProductStatus = Database["public"]["Enums"]["product_status"];

export interface CreateOrderData {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address: string;
  delivery_notes?: string;
  payment_method: PaymentMethod;
  items: {
    product_id: string;
    quantity: number;
  }[];
}

export interface ProductFilters {
  category_id?: string;
  search?: string;
  is_featured?: boolean;
  min_price?: number;
  max_price?: number;
  status?: ProductStatus;
}

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

  // Get category by slug
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      console.error("Error fetching category:", error);
      throw new Error(`Failed to fetch category: ${error.message}`);
    }

    return data;
  },
};

// Products API
export const productsApi = {
  // Get products with filters
  async getProducts(filters: ProductFilters = {}): Promise<Product[]> {
    let query = supabase
      .from("products")
      .select(`
        *,
        category:categories(*)
      `)
      .eq("status", filters.status || "active");

    // Apply filters
    if (filters.category_id) {
      query = query.eq("category_id", filters.category_id);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.is_featured !== undefined) {
      query = query.eq("is_featured", filters.is_featured);
    }

    if (filters.min_price !== undefined) {
      query = query.gte("price", filters.min_price);
    }

    if (filters.max_price !== undefined) {
      query = query.lte("price", filters.max_price);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching products:", error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return data || [];
  },

  // Get featured products
  async getFeaturedProducts(): Promise<Product[]> {
    return this.getProducts({ is_featured: true });
  },

  // Get product by slug
  async getProductBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(*)
      `)
      .eq("slug", slug)
      .eq("status", "active")
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      console.error("Error fetching product:", error);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    return data;
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
      if (error.code === "PGRST116") return null; // Not found
      console.error("Error fetching product:", error);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    return data;
  },
};

// Cart API
export const cartApi = {
  // Get user's cart items
  async getCartItems(userId?: string, sessionId?: string): Promise<CartItem[]> {
    let query = supabase
      .from("cart_items")
      .select(`
        *,
        product:products(
          *,
          category:categories(*)
        )
      `);

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (sessionId) {
      query = query.eq("session_id", sessionId);
    } else {
      throw new Error("Either userId or sessionId must be provided");
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching cart items:", error);
      throw new Error(`Failed to fetch cart items: ${error.message}`);
    }

    return data || [];
  },

  // Add item to cart
  async addToCart(
    productId: string,
    quantity: number = 1,
    userId?: string,
    sessionId?: string
  ): Promise<CartItem> {
    // Check if item already exists in cart
    let existingQuery = supabase
      .from("cart_items")
      .select("*")
      .eq("product_id", productId);

    if (userId) {
      existingQuery = existingQuery.eq("user_id", userId);
    } else if (sessionId) {
      existingQuery = existingQuery.eq("session_id", sessionId);
    } else {
      throw new Error("Either userId or sessionId must be provided");
    }

    const { data: existing } = await existingQuery.single();

    if (existing) {
      // Update quantity if item exists
      return this.updateCartItem(existing.id, existing.quantity + quantity);
    }

    // Add new item
    const insertData: any = {
      product_id: productId,
      quantity,
    };

    if (userId) {
      insertData.user_id = userId;
    } else {
      insertData.session_id = sessionId;
    }

    const { data, error } = await supabase
      .from("cart_items")
      .insert(insertData)
      .select(`
        *,
        product:products(
          *,
          category:categories(*)
        )
      `)
      .single();

    if (error) {
      console.error("Error adding to cart:", error);
      throw new Error(`Failed to add to cart: ${error.message}`);
    }

    return data;
  },

  // Update cart item quantity
  async updateCartItem(cartItemId: string, quantity: number): Promise<CartItem> {
    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", cartItemId)
      .select(`
        *,
        product:products(
          *,
          category:categories(*)
        )
      `)
      .single();

    if (error) {
      console.error("Error updating cart item:", error);
      throw new Error(`Failed to update cart item: ${error.message}`);
    }

    return data;
  },

  // Remove item from cart
  async removeFromCart(cartItemId: string): Promise<void> {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId);

    if (error) {
      console.error("Error removing from cart:", error);
      throw new Error(`Failed to remove from cart: ${error.message}`);
    }
  },

  // Clear user's cart
  async clearCart(userId?: string, sessionId?: string): Promise<void> {
    let query = supabase.from("cart_items").delete();

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (sessionId) {
      query = query.eq("session_id", sessionId);
    } else {
      throw new Error("Either userId or sessionId must be provided");
    }

    const { error } = await query;

    if (error) {
      console.error("Error clearing cart:", error);
      throw new Error(`Failed to clear cart: ${error.message}`);
    }
  },

  // Get cart summary
  async getCartSummary(userId?: string, sessionId?: string): Promise<{
    items: CartItem[];
    totalItems: number;
    totalAmount: number;
  }> {
    const items = await this.getCartItems(userId, sessionId);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity;
    }, 0);

    return {
      items,
      totalItems,
      totalAmount,
    };
  },
};

// Orders API
export const ordersApi = {
  // Create new order
  async createOrder(orderData: CreateOrderData, userId?: string): Promise<Order> {
    // Start transaction
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId || null,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        customer_email: orderData.customer_email,
        delivery_address: orderData.delivery_address,
        delivery_notes: orderData.delivery_notes,
        payment_method: orderData.payment_method,
        subtotal: 0, // Will be calculated
        total_amount: 0, // Will be calculated
        order_number: "", // Will be auto-generated
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    // Add order items and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of orderData.items) {
      const product = await productsApi.getProductById(item.product_id);
      if (!product) {
        throw new Error(`Product not found: ${item.product_id}`);
      }

      const unitPrice = product.price;
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      const { data: orderItem, error: itemError } = await supabase
        .from("order_items")
        .insert({
          order_id: order.id,
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
        })
        .select()
        .single();

      if (itemError) {
        console.error("Error creating order item:", itemError);
        throw new Error(`Failed to create order item: ${itemError.message}`);
      }

      orderItems.push(orderItem);
    }

    // Update order totals
    const deliveryFee = 0; // Fixed delivery for now
    const totalAmount = subtotal + deliveryFee;

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        subtotal,
        delivery_fee: deliveryFee,
        total_amount: totalAmount,
      })
      .eq("id", order.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating order totals:", updateError);
      throw new Error(`Failed to update order totals: ${updateError.message}`);
    }

    return updatedOrder;
  },

  // Get user's orders
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
      if (error.code === "PGRST116") return null; // Not found
      console.error("Error fetching order:", error);
      throw new Error(`Failed to fetch order: ${error.message}`);
    }

    return data;
  },

  // Get order items
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching order items:", error);
      throw new Error(`Failed to fetch order items: ${error.message}`);
    }

    return data || [];
  },

  // Update order status (admin only)
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    notes?: string
  ): Promise<Order> {
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      console.error("Error updating order status:", error);
      throw new Error(`Failed to update order status: ${error.message}`);
    }

    // Add to status history if notes provided
    if (notes) {
      await supabase.from("order_status_history").insert({
        order_id: orderId,
        old_status: data.status,
        new_status: status,
        notes,
      });
    }

    return data;
  },
};

// Utility functions
export const shopUtils = {
  // Format price in Indonesian Rupiah
  formatPrice: (price: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  },

  // Generate session ID for anonymous users
  generateSessionId: (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Get or create session ID
  getSessionId: (): string => {
    let sessionId = localStorage.getItem("shop_session_id");
    if (!sessionId) {
      sessionId = shopUtils.generateSessionId();
      localStorage.setItem("shop_session_id", sessionId);
    }
    return sessionId;
  },

  // Calculate discount percentage
  calculateDiscount: (originalPrice: number, salePrice: number): number => {
    if (originalPrice <= salePrice) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  },

  // Check if product is in stock
  isInStock: (product: Product): boolean => {
    return product.status === "active" && (product.stock_quantity || 0) > 0;
  },

  // Get product main image
  getProductMainImage: (product: Product): string => {
    const images = product.images as string[] | null;
    return images && images.length > 0 ? images[0] : "/placeholder.svg";
  },

  // Get product gallery images
  getProductImages: (product: Product): string[] => {
    const images = product.images as string[] | null;
    return images || ["/placeholder.svg"];
  },
};
