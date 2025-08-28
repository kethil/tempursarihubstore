export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cart_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          quantity: number
          session_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          quantity?: number
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          quantity?: number
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivered_at: string | null
          delivery_address: string
          delivery_fee: number | null
          delivery_notes: string | null
          id: string
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          shipped_at: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delivered_at?: string | null
          delivery_address: string
          delivery_fee?: number | null
          delivery_notes?: string | null
          id?: string
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivered_at?: string | null
          delivery_address?: string
          delivery_fee?: number | null
          delivery_notes?: string | null
          id?: string
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          dimensions: Json | null
          id: string
          images: Json | null
          is_featured: boolean | null
          meta_description: string | null
          meta_title: string | null
          min_stock_level: number | null
          name: string
          original_price: number | null
          price: number
          short_description: string | null
          sku: string | null
          slug: string
          specifications: Json | null
          status: Database["public"]["Enums"]["product_status"] | null
          stock_quantity: number | null
          updated_at: string | null
          weight_grams: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          images?: Json | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_level?: number | null
          name: string
          original_price?: number | null
          price: number
          short_description?: string | null
          sku?: string | null
          slug: string
          specifications?: Json | null
          status?: Database["public"]["Enums"]["product_status"] | null
          stock_quantity?: number | null
          updated_at?: string | null
          weight_grams?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          images?: Json | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_level?: number | null
          name?: string
          original_price?: number | null
          price?: number
          short_description?: string | null
          sku?: string | null
          slug?: string
          specifications?: Json | null
          status?: Database["public"]["Enums"]["product_status"] | null
          stock_quantity?: number | null
          updated_at?: string | null
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          documents: Json | null
          full_name: string
          id: string
          nik: string
          operator_id: string | null
          operator_notes: string | null
          phone_number: string
          request_number: string
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["request_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          documents?: Json | null
          full_name: string
          id?: string
          nik: string
          operator_id?: string | null
          operator_notes?: string | null
          phone_number: string
          request_number?: string
          service_type: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          documents?: Json | null
          full_name?: string
          id?: string
          nik?: string
          operator_id?: string | null
          operator_notes?: string | null
          phone_number?: string
          request_number?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
      payment_method: "transfer_bank" | "e_wallet" | "cod"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      product_status: "active" | "inactive" | "draft"
      request_status: "pending" | "on_process" | "completed" | "cancelled"
      service_type: "surat_pengantar_ktp" | "surat_keterangan_domisili" | "surat_keterangan_usaha" | "surat_keterangan_tidak_mampu" | "surat_keterangan_belum_menikah" | "surat_pengantar_nikah" | "surat_keterangan_kematian" | "surat_keterangan_kelahiran"
      user_role: "user" | "admin" | "operator"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}