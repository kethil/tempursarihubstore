import { MobileLayout, MobileHeader, MobileContent } from "@/components/MobileLayout";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cartApi, shopUtils, type CartItem } from "@/services/shopApi";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Keranjang() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const fromCheckout = searchParams.get('from') === 'checkout';

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Fetch cart items
  const { data: cartSummary, refetch: refetchCart, isLoading } = useQuery({
    queryKey: ["cart-summary", user?.id],
    queryFn: () => cartApi.getCartSummary(user?.id, shopUtils.getSessionId()),
    enabled: !!user?.id || !!shopUtils.getSessionId(),
  });

  // Update cart item quantity
  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await handleRemoveItem(cartItemId);
      return;
    }

    try {
      await cartApi.updateCartItem(cartItemId, newQuantity);
      await refetchCart();
      
      toast({
        title: "Keranjang diperbarui",
        description: "Jumlah produk berhasil diperbarui",
      });
    } catch (error) {
      toast({
        title: "Gagal memperbarui",
        description: "Terjadi kesalahan saat memperbarui keranjang",
        variant: "destructive",
      });
    }
  };

  // Remove item from cart
  const handleRemoveItem = async (cartItemId: string) => {
    try {
      await cartApi.removeFromCart(cartItemId);
      await refetchCart();
      
      toast({
        title: "Produk dihapus",
        description: "Produk berhasil dihapus dari keranjang",
      });
    } catch (error) {
      toast({
        title: "Gagal menghapus",
        description: "Terjadi kesalahan saat menghapus produk",
        variant: "destructive",
      });
    }
  };

  // Clear entire cart
  const handleClearCart = async () => {
    try {
      await cartApi.clearCart(user?.id, shopUtils.getSessionId());
      await refetchCart();
      
      toast({
        title: "Keranjang dikosongkan",
        description: "Semua produk berhasil dihapus dari keranjang",
      });
    } catch (error) {
      toast({
        title: "Gagal mengosongkan",
        description: "Terjadi kesalahan saat mengosongkan keranjang",
        variant: "destructive",
      });
    }
  };

  const cartItems = cartSummary?.items || [];
  const totalItems = cartSummary?.totalItems || 0;
  const totalAmount = cartSummary?.totalAmount || 0;

  return (
    <MobileLayout>
      <MobileHeader 
        title="Keranjang Belanja" 
        subtitle={`${totalItems} item${totalItems !== 1 ? 's' : ''}`}
        showBack
        onBack={() => navigate("/toko")}
      />
      
      <MobileContent>
        <div className="p-4 space-y-4">
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-muted rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : cartItems.length === 0 ? (
            // Empty cart
            <Card className="p-8 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Keranjang Kosong</h3>
              <p className="text-muted-foreground mb-4">
                {fromCheckout 
                  ? "Pesanan Anda telah berhasil dibuat. Terima kasih telah berbelanja!" 
                  : "Belum ada produk dalam keranjang Anda"}
              </p>
              <Button onClick={() => navigate("/toko")}>
                {fromCheckout ? "Lanjut Belanja" : "Mulai Belanja"}
              </Button>
            </Card>
          ) : (
            // Cart items
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Produk dalam Keranjang</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearCart}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Kosongkan
                </Button>
              </div>

              <div className="space-y-3">
                {cartItems.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex gap-3">
                      {/* Product Image */}
                      <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded">
                        <img 
                          src={shopUtils.getProductMainImage(item.product!)} 
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2 mb-1">
                          {item.product?.name}
                        </h4>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-primary text-sm">
                            {shopUtils.formatPrice(item.product?.price || 0)}
                          </span>
                          {item.product?.original_price && (
                            <span className="text-xs text-muted-foreground line-through">
                              {shopUtils.formatPrice(item.product.original_price)}
                            </span>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            
                            <span className="font-medium text-sm min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Cart Summary */}
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Item:</span>
                    <span className="font-medium">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{shopUtils.formatPrice(totalAmount)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ongkir:</span>
                    <span className="font-medium">Gratis</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">Total:</span>
                    <span className="font-bold text-lg text-primary">
                      {shopUtils.formatPrice(totalAmount)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Checkout Button */}
              <div className="space-y-3">
                <Button 
                  className="w-full h-12 text-base font-semibold"
                  onClick={() => navigate("/checkout")}
                  disabled={cartItems.length === 0}
                >
                  Lanjut ke Pembayaran
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/toko")}
                >
                  Lanjut Belanja
                </Button>
              </div>
            </>
          )}
        </div>
      </MobileContent>
      
      <BottomNavigation />
    </MobileLayout>
  );
}

