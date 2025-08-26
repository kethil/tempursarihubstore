import { MobileLayout, MobileHeader, MobileContent } from "@/components/MobileLayout";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ProductCard } from "@/components/ProductCard";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Search, ShoppingCart, RefreshCw, Filter, Grid3X3, List, Package, Utensils, Palette, Smartphone, Home, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { productsApi, categoriesApi, cartApi, shopUtils, type Product, type Category } from "@/services/shopApi";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Toko() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("semua");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getCategories,
  });

  // Fetch products with filters
  const { data: products = [], isLoading: productsLoading, refetch } = useQuery({
    queryKey: ["products", selectedCategory, searchTerm],
    queryFn: () => productsApi.getProducts({
      category_id: selectedCategory === "semua" ? undefined : selectedCategory,
      search: searchTerm || undefined,
    }),
  });

  // Fetch cart summary
  const { data: cartSummary, refetch: refetchCart } = useQuery({
    queryKey: ["cart-summary", user?.id],
    queryFn: () => cartApi.getCartSummary(user?.id, shopUtils.getSessionId()),
    enabled: true,
  });

  // Add to cart handler
  const handleAddToCart = async (product: Product) => {
    try {
      await cartApi.addToCart(
        product.id,
        1,
        user?.id,
        user ? undefined : shopUtils.getSessionId()
      );
      
      await refetchCart();
      
      toast({
        title: "Berhasil ditambahkan!",
        description: `${product.name} telah ditambahkan ke keranjang`,
      });
    } catch (error) {
      toast({
        title: "Gagal menambahkan",
        description: "Terjadi kesalahan saat menambahkan produk ke keranjang",
        variant: "destructive",
      });
    }
  };

  // Get category icon
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: any } = {
      'Fashion': Package,
      'Makanan': Utensils,
      'Kerajinan': Palette,
      'Elektronik': Smartphone,
      'Rumah Tangga': Home,
      'default': Package
    };
    
    return iconMap[categoryName] || iconMap.default;
  };

  // Filter products based on search
  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true;
    return product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           product.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <MobileLayout>
      <MobileHeader 
        title="Toko Desa" 
        subtitle="Belanja produk lokal berkualitas"
        action={
          <Button 
            size="sm" 
            variant="secondary" 
            className="bg-primary-foreground/20 text-primary-foreground border-0 relative"
            onClick={() => navigate("/keranjang")}
          >
            <ShoppingCart className="h-4 w-4" />
            {(cartSummary?.totalItems || 0) > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                {cartSummary?.totalItems}
              </Badge>
            )}
          </Button>
        }
      />
      
      <MobileContent>
        <div className="p-4 space-y-4">
          {/* Search and View Toggle */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className={`h-4 w-4 ${productsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Categories */}
          {!categoriesLoading && categories.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">Kategori</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {/* All Categories */}
                <Button
                  variant={selectedCategory === "semua" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("semua")}
                  className="flex-shrink-0 flex flex-col items-center gap-1 h-20 w-20 p-2 hover:scale-105 transition-transform"
                >
                  <Star className="h-6 w-6" />
                  <span className="text-xs font-medium">Semua</span>
                </Button>
                
                {/* Category Icons */}
                {categories.slice(0, 5).map((category) => {
                  const IconComponent = getCategoryIcon(category.name);
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="flex-shrink-0 flex flex-col items-center gap-1 h-20 w-20 p-2 hover:scale-105 transition-transform"
                    >
                      <IconComponent className="h-6 w-6" />
                      <span className="text-xs font-medium">{category.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Featured Products */}
          {selectedCategory === "semua" && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Produk Unggulan</h3>
              <div className="grid grid-cols-2 gap-3">
                {products
                  .filter(p => p.is_featured)
                  .slice(0, 4)
                  .map((product) => (
                    <ProductCard
                      key={product.id}
                      name={product.name}
                      price={product.price}
                      originalPrice={product.original_price || undefined}
                      discount={product.original_price ? shopUtils.calculateDiscount(product.original_price, product.price) : undefined}
                      image={shopUtils.getProductMainImage(product)}
                      inStock={shopUtils.isInStock(product)}
                      onAddToCart={() => handleAddToCart(product)}
                      onClick={() => {
                        // Navigate to product detail (will implement later)
                        toast({
                          title: "Coming Soon",
                          description: "Product detail page will be available soon",
                        });
                      }}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* All Products */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                {selectedCategory === "semua" ? "Semua Produk" : categories.find(c => c.id === selectedCategory)?.name}
              </h3>
              <Badge variant="secondary">
                {filteredProducts.length} produk
              </Badge>
            </div>

            {productsLoading ? (
              <div className={`grid ${viewMode === "grid" ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="p-3 animate-pulse">
                    <div className={`${viewMode === "grid" ? "aspect-square" : "h-24"} bg-muted rounded mb-2`}></div>
                    <div className="h-3 bg-muted rounded mb-1"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={`grid ${viewMode === "grid" ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    name={product.name}
                    price={product.price}
                    originalPrice={product.original_price || undefined}
                    discount={product.original_price ? shopUtils.calculateDiscount(product.original_price, product.price) : undefined}
                    image={shopUtils.getProductMainImage(product)}
                    inStock={shopUtils.isInStock(product)}
                    layout={viewMode}
                    onAddToCart={() => handleAddToCart(product)}
                    onClick={() => {
                      // Navigate to product detail (will implement later)
                      toast({
                        title: "Coming Soon",
                        description: "Product detail page will be available soon",
                      });
                    }}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {searchTerm ? "Tidak ada produk yang ditemukan" : "Belum ada produk dalam kategori ini"}
                </p>
              </Card>
            )}
          </div>

          {/* Cart Summary */}
          {cartSummary && cartSummary.totalItems > 0 && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{cartSummary.totalItems} item di keranjang</p>
                  <p className="text-sm text-muted-foreground">
                    Total: {shopUtils.formatPrice(cartSummary.totalAmount)}
                  </p>
                </div>
                <Button size="sm" onClick={() => navigate("/keranjang")}>
                  Lihat Keranjang
                </Button>
              </div>
            </Card>
          )}
        </div>
      </MobileContent>
      
      <BottomNavigation />
    </MobileLayout>
  );
}