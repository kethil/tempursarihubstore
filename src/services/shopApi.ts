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
export type OrderStatusHistory = Database["public"]["Tables"]["order_status_history"]["Row"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type ProductStatus = Database["public"]["Enums"]["product_status"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Extended order interface with related data
export interface OrderWithDetails extends Order {
  order_items?: (OrderItem & {
    product?: Partial<Product> & {
      id: string;
      name: string;
      price: number;
      sku?: string | null;
      images?: any;
      category?: { name: string } | null;
    };
  })[];
  status_history?: OrderStatusHistory[];
  customer_profile?: Profile;
}

export interface OrderFilters {
  status?: OrderStatus;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  customer_name?: string;
  order_number?: string;
  date_from?: string;
  date_to?: string;
  user_id?: string;
}

export interface UpdateOrderStatusData {
  order_id: string;
  new_status: OrderStatus;
  notes?: string;
  updated_by?: string;
}

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

export interface CreateProductData {
  name: string;
  slug?: string;
  description?: string;
  short_description?: string;
  sku?: string;
  price: number;
  original_price?: number;
  stock_quantity?: number;
  min_stock_level?: number;
  status?: ProductStatus;
  category_id?: string;
  images?: string[];
  specifications?: Record<string, any>;
  weight_grams?: number;
  dimensions?: Record<string, number>;
  is_featured?: boolean;
  meta_title?: string;
  meta_description?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
}

export interface CreateCategoryData {
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  id: string;
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

  // Get all categories for admin (including inactive)
  async getAdminCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching admin categories:", error);
      throw new Error(`Failed to fetch admin categories: ${error.message}`);
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

  // Get category by ID
  async getCategoryById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      console.error("Error fetching category:", error);
      throw new Error(`Failed to fetch category: ${error.message}`);
    }

    return data;
  },

  // Create new category (admin only)
  async createCategory(categoryData: CreateCategoryData): Promise<Category> {
    // Generate slug from name
    const slug = categoryData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const { data, error } = await supabase
      .from("categories")
      .insert({
        ...categoryData,
        slug,
        is_active: categoryData.is_active ?? true,
        sort_order: categoryData.sort_order ?? 0,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating category:", error);
      throw new Error(`Failed to create category: ${error.message}`);
    }

    return data;
  },

  // Update category (admin only)
  async updateCategory(categoryData: UpdateCategoryData): Promise<Category> {
    const { id, ...updateData } = categoryData;
    
    // Generate new slug if name is being updated
    if (updateData.name) {
      (updateData as any).slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }

    const { data, error } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating category:", error);
      throw new Error(`Failed to update category: ${error.message}`);
    }

    return data;
  },

  // Delete category (admin only)
  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting category:", error);
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  },

  // Toggle category status (admin only)
  async toggleCategoryStatus(id: string): Promise<Category> {
    // First get current status
    const category = await this.getCategoryById(id);
    if (!category) {
      throw new Error("Category not found");
    }

    const { data, error } = await supabase
      .from("categories")
      .update({ is_active: !category.is_active })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Error toggling category status:", error);
      throw new Error(`Failed to toggle category status: ${error.message}`);
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

  // Get all products for admin (including inactive)
  async getAdminProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching admin products:", error);
      throw new Error(`Failed to fetch admin products: ${error.message}`);
    }

    return data || [];
  },

  // Create new product (admin only)
  async createProduct(productData: CreateProductData): Promise<Product> {
    // Generate slug from name
    const slug = productData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const { data, error } = await supabase
      .from("products")
      .insert({
        ...productData,
        slug,
        status: productData.status ?? 'active',
        stock_quantity: productData.stock_quantity ?? 0,
        min_stock_level: productData.min_stock_level ?? 5,
        is_featured: productData.is_featured ?? false,
        images: productData.images ?? [],
        specifications: productData.specifications ?? {},
      })
      .select(`
        *,
        category:categories(*)
      `)
      .single();

    if (error) {
      console.error("Error creating product:", error);
      throw new Error(`Failed to create product: ${error.message}`);
    }

    return data;
  },

  // Update product (admin only)
  async updateProduct(productData: UpdateProductData): Promise<Product> {
    const { id, ...updateData } = productData;
    
    // Generate new slug if name is being updated
    if (updateData.name) {
      (updateData as any).slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        category:categories(*)
      `)
      .single();

    if (error) {
      console.error("Error updating product:", error);
      throw new Error(`Failed to update product: ${error.message}`);
    }

    return data;
  },

  // Delete product (admin only)
  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting product:", error);
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  },

  // Update product stock (admin only)
  async updateProductStock(id: string, stockQuantity: number): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .update({ stock_quantity: stockQuantity })
      .eq("id", id)
      .select(`
        *,
        category:categories(*)
      `)
      .single();

    if (error) {
      console.error("Error updating product stock:", error);
      throw new Error(`Failed to update product stock: ${error.message}`);
    }

    return data;
  },

  // Toggle product status (admin only)
  async toggleProductStatus(id: string): Promise<Product> {
    // First get current status
    const product = await this.getProductById(id);
    if (!product) {
      throw new Error("Product not found");
    }

    const newStatus = product.status === 'active' ? 'inactive' : 'active';

    const { data, error } = await supabase
      .from("products")
      .update({ status: newStatus })
      .eq("id", id)
      .select(`
        *,
        category:categories(*)
      `)
      .single();

    if (error) {
      console.error("Error toggling product status:", error);
      throw new Error(`Failed to toggle product status: ${error.message}`);
    }

    return data;
  },

  // Bulk update product status (admin only)
  async bulkUpdateProductStatus(ids: string[], status: ProductStatus): Promise<void> {
    const { error } = await supabase
      .from("products")
      .update({ status })
      .in("id", ids);

    if (error) {
      console.error("Error bulk updating product status:", error);
      throw new Error(`Failed to bulk update product status: ${error.message}`);
    }
  },

  // Get products by category (admin view)
  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(*)
      `)
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products by category:", error);
      throw new Error(`Failed to fetch products by category: ${error.message}`);
    }

    return data || [];
  },

  // Search products for admin
  async searchAdminProducts(query: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(*)
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,sku.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error searching admin products:", error);
      throw new Error(`Failed to search admin products: ${error.message}`);
    }

    return data || [];
  },
};

// Customers API
export const customersApi = {
  // Get all customers (profiles)
  async getCustomers(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching customers:", error);
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }

    return data || [];
  },
};

// Cart API
export const cartApi = {
  // Get user's cart items
  async getCartItems(userId?: string, sessionId?: string): Promise<CartItem[]> {
    // Check if we have either userId or sessionId
    if (!userId && !sessionId) {
      throw new Error("Either userId or sessionId must be provided");
    }

    let query = supabase
      .from("cart_items")
      .select(`
        *,
        product:products(
          *,
          category:categories(*)
        )
      `);

    // Apply filter based on available identifier
    if (userId) {
      query = query.eq("user_id", userId);
    } else if (sessionId) {
      query = query.eq("session_id", sessionId);
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
    // Validate inputs
    if (!productId) {
      throw new Error("Product ID is required");
    }
    
    if (!userId && !sessionId) {
      throw new Error("Either userId or sessionId must be provided");
    }

    // Check if item already exists in cart
    let existingQuery = supabase
      .from("cart_items")
      .select("*")
      .eq("product_id", productId);

    // Apply filter based on available identifier
    if (userId) {
      existingQuery = existingQuery.eq("user_id", userId);
    } else if (sessionId) {
      existingQuery = existingQuery.eq("session_id", sessionId);
    }

    const { data: existing, error: existingError } = await existingQuery.single();
    
    // Handle the case where no existing item is found (this is not an error)
    if (existingError && existingError.code !== "PGRST116") {
      // PGRST116 means "JSON object requested, multiple (or no) rows returned"
      // This is expected when no item exists
      console.error("Error checking existing cart item:", existingError);
      throw new Error(`Failed to check existing cart item: ${existingError.message}`);
    }

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
    // Validate inputs
    if (!userId && !sessionId) {
      throw new Error("Either userId or sessionId must be provided");
    }

    let query = supabase.from("cart_items").delete();

    // Apply filter based on available identifier
    if (userId) {
      query = query.eq("user_id", userId);
    } else if (sessionId) {
      query = query.eq("session_id", sessionId);
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
  // Get all orders with filters (admin)
  async getAdminOrders(filters: OrderFilters = {}): Promise<OrderWithDetails[]> {
    let query = supabase
      .from("orders")
      .select(`
        *,
        order_items(
          *,
          product:products(
            id,
            name,
            price,
            sku,
            images
          )
        )
      `);

    // Apply filters
    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.payment_method) {
      query = query.eq("payment_method", filters.payment_method);
    }

    if (filters.payment_status) {
      query = query.eq("payment_status", filters.payment_status);
    }

    if (filters.customer_name) {
      query = query.ilike("customer_name", `%${filters.customer_name}%`);
    }

    if (filters.order_number) {
      query = query.ilike("order_number", `%${filters.order_number}%`);
    }

    if (filters.user_id) {
      query = query.eq("user_id", filters.user_id);
    }

    if (filters.date_from) {
      query = query.gte("created_at", filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte("created_at", filters.date_to);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching admin orders:", error);
      throw new Error(`Failed to fetch admin orders: ${error.message}`);
    }

    return (data || []) as unknown as OrderWithDetails[];
  },

  // Get detailed order by ID (admin)
  async getOrderDetails(orderId: string): Promise<OrderWithDetails | null> {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items(
          *,
          product:products(
            id,
            name,
            price,
            sku,
            images,
            category:categories(name)
          )
        ),
        status_history:order_status_history(
          *
        )
      `)
      .eq("id", orderId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      console.error("Error fetching order details:", error);
      throw new Error(`Failed to fetch order details: ${error.message}`);
    }

    return data as unknown as OrderWithDetails;
  },

  // Update order status with history tracking (admin only)
  async updateOrderStatus(statusData: UpdateOrderStatusData): Promise<Order> {
    const { order_id, new_status, notes, updated_by } = statusData;

    // Get current order to track old status
    const currentOrder = await this.getOrderById(order_id);
    if (!currentOrder) {
      throw new Error("Order not found");
    }

    const old_status = currentOrder.status;

    // Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({ 
        status: new_status,
        updated_at: new Date().toISOString(),
        // Set specific timestamps based on status
        ...(new_status === 'confirmed' && { confirmed_at: new Date().toISOString() }),
        ...(new_status === 'shipped' && { shipped_at: new Date().toISOString() }),
        ...(new_status === 'delivered' && { delivered_at: new Date().toISOString() }),
        ...(new_status === 'cancelled' && { cancelled_at: new Date().toISOString() }),
      })
      .eq("id", order_id)
      .select("*")
      .single();

    if (updateError) {
      console.error("Error updating order status:", updateError);
      throw new Error(`Failed to update order status: ${updateError.message}`);
    }

    // Add status history entry
    if (old_status !== new_status) {
      const { error: historyError } = await supabase
        .from("order_status_history")
        .insert({
          order_id,
          old_status,
          new_status,
          notes,
          updated_by,
        });

      if (historyError) {
        console.error("Error creating status history:", historyError);
        // Don't throw here as the main update succeeded
      }
    }

    return updatedOrder;
  },

  // Get order status history
  async getOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
    const { data, error } = await supabase
      .from("order_status_history")
      .select(`
        *
      `)
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching order status history:", error);
      throw new Error(`Failed to fetch order status history: ${error.message}`);
    }

    return data || [];
  },

  // Bulk update order status (admin only)
  async bulkUpdateOrderStatus(
    orderIds: string[],
    status: OrderStatus,
    notes?: string,
    updatedBy?: string
  ): Promise<void> {
    // Update all orders
    const { error: updateError } = await supabase
      .from("orders")
      .update({ 
        status,
        updated_at: new Date().toISOString(),
        // Set specific timestamps based on status
        ...(status === 'confirmed' && { confirmed_at: new Date().toISOString() }),
        ...(status === 'shipped' && { shipped_at: new Date().toISOString() }),
        ...(status === 'delivered' && { delivered_at: new Date().toISOString() }),
        ...(status === 'cancelled' && { cancelled_at: new Date().toISOString() }),
      })
      .in("id", orderIds);

    if (updateError) {
      console.error("Error bulk updating order status:", updateError);
      throw new Error(`Failed to bulk update order status: ${updateError.message}`);
    }

    // Add status history entries for each order
    if (notes) {
      const historyEntries = orderIds.map(orderId => ({
        order_id: orderId,
        old_status: null, // We don't track old status in bulk operations
        new_status: status,
        notes,
        updated_by: updatedBy,
      }));

      const { error: historyError } = await supabase
        .from("order_status_history")
        .insert(historyEntries);

      if (historyError) {
        console.error("Error creating bulk status history:", historyError);
        // Don't throw here as the main update succeeded
      }
    }
  },

  // Cancel order (admin only)
  async cancelOrder(orderId: string, reason?: string, cancelledBy?: string): Promise<Order> {
    return this.updateOrderStatus({
      order_id: orderId,
      new_status: 'cancelled',
      notes: reason,
      updated_by: cancelledBy,
    });
  },

  // Search orders (admin)
  async searchOrders(query: string): Promise<OrderWithDetails[]> {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items(
          *,
          product:products(name)
        )
      `)
      .or(`order_number.ilike.%${query}%,customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%,customer_email.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error searching orders:", error);
      throw new Error(`Failed to search orders: ${error.message}`);
    }

    return (data || []) as unknown as OrderWithDetails[];
  },

  // Get orders by status (admin)
  async getOrdersByStatus(status: OrderStatus): Promise<OrderWithDetails[]> {
    return this.getAdminOrders({ status });
  },

  // Get order statistics (admin)
  async getOrderStatistics(): Promise<{
    total_orders: number;
    pending_orders: number;
    confirmed_orders: number;
    processing_orders: number;
    shipped_orders: number;
    delivered_orders: number;
    cancelled_orders: number;
    total_revenue: number;
    monthly_revenue: number;
  }> {
    // Get total order counts by status
    const { data: statusCounts, error: statusError } = await supabase
      .from("orders")
      .select("status")
      .not("status", "eq", "cancelled");

    if (statusError) {
      console.error("Error fetching order statistics:", statusError);
      throw new Error(`Failed to fetch order statistics: ${statusError.message}`);
    }

    // Calculate revenue
    const { data: revenueData, error: revenueError } = await supabase
      .from("orders")
      .select("total_amount, created_at")
      .in("status", ["confirmed", "processing", "shipped", "delivered"]);

    if (revenueError) {
      console.error("Error fetching revenue data:", revenueError);
      throw new Error(`Failed to fetch revenue data: ${revenueError.message}`);
    }

    const total_orders = statusCounts.length;
    const pending_orders = statusCounts.filter(o => o.status === 'pending').length;
    const confirmed_orders = statusCounts.filter(o => o.status === 'confirmed').length;
    const processing_orders = statusCounts.filter(o => o.status === 'processing').length;
    const shipped_orders = statusCounts.filter(o => o.status === 'shipped').length;
    const delivered_orders = statusCounts.filter(o => o.status === 'delivered').length;
    const cancelled_orders = statusCounts.filter(o => o.status === 'cancelled').length;

    const total_revenue = revenueData.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    
    // Calculate monthly revenue (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthly_revenue = revenueData
      .filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      })
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);

    return {
      total_orders,
      pending_orders,
      confirmed_orders,
      processing_orders,
      shipped_orders,
      delivered_orders,
      cancelled_orders,
      total_revenue,
      monthly_revenue,
    };
  },
  // Create new order
  async createOrder(orderData: CreateOrderData, userId?: string): Promise<Order> {
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    try {
      // Prepare insert data
      const insertData: any = {
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        customer_email: orderData.customer_email,
        delivery_address: orderData.delivery_address,
        delivery_notes: orderData.delivery_notes,
        payment_method: orderData.payment_method,
        subtotal: 0, // Will be calculated
        total_amount: 0, // Will be calculated
        order_number: orderNumber, // Generated in app
      };
      
      // Only include user_id if user is logged in
      if (userId) {
        insertData.user_id = userId;
      }

      // Try to create order
      let finalOrder;
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(insertData)
        .select("id, user_id, customer_name, customer_phone, customer_email, delivery_address, delivery_notes, payment_method, subtotal, delivery_fee, total_amount, status, order_number, created_at, updated_at")
        .single();

      if (orderError) {
        console.error("Error creating order:", orderError);
        // Handle RLS permission errors specifically
        if (orderError.code === '42501') {
          // Try without user_id for anonymous users
          if (!userId) {
            const anonymousInsertData = {
              ...insertData,
              user_id: null // Explicitly set to null for anonymous orders
            };
            
            const { data: anonOrder, error: anonError } = await supabase
              .from("orders")
              .insert(anonymousInsertData)
              .select("id, user_id, customer_name, customer_phone, customer_email, delivery_address, delivery_notes, payment_method, subtotal, delivery_fee, total_amount, status, order_number, created_at, updated_at")
              .single();
              
            if (anonError) {
              throw new Error(`Failed to create order: ${anonError.message}`);
            }
            
            // Assign the result to finalOrder
            finalOrder = anonOrder;
          } else {
            throw new Error("We're experiencing technical issues with order processing. Please try again later or contact support.");
          }
        } else {
          throw new Error(`Failed to create order: ${orderError.message}`);
        }
      } else {
        finalOrder = order;
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
          .select("id, order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, created_at")
          .single();

        if (itemError) {
          console.error("Error creating order item:", itemError);
          throw new Error(`Failed to create order item: ${itemError.message}`);
        }

        orderItems.push(orderItem);
      }

      // Use the final order (either original or anonymous)
      const orderToUpdate = finalOrder || order;

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
        .eq("id", orderToUpdate.id)
        .select("*")
        .single();

      if (updateError) {
        console.error("Error updating order totals:", updateError);
        throw new Error(`Failed to update order totals: ${updateError.message}`);
      }

      return updatedOrder;
    } catch (error: any) {
      console.error("Order creation failed:", error);
      if (error.message && error.message.includes("technical issues") || error.message.includes("42501")) {
        throw new Error("We're experiencing technical issues with order processing. Please try again later or contact support.");
      }
      throw error;
    }
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
