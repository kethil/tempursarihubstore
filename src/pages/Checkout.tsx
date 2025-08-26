import { MobileLayout, MobileHeader, MobileContent } from "@/components/MobileLayout";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CreditCard, QrCode, Truck, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cartApi, ordersApi, shopUtils, type CartItem } from "@/services/shopApi";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type PaymentMethod = 'cash_on_delivery' | 'qris';

interface CheckoutFormData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_address: string;
  delivery_notes: string;
  payment_method: PaymentMethod;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');

  const [formData, setFormData] = useState<CheckoutFormData>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_address: '',
    delivery_notes: '',
    payment_method: 'cash_on_delivery'
  });

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Pre-fill form with user data if available
      if (user?.user_metadata) {
        setFormData(prev => ({
          ...prev,
          customer_name: user.user_metadata.full_name || '',
          customer_email: user.email || '',
          customer_phone: user.user_metadata.phone || ''
        }));
      }
    };
    getUser();
  }, []);

  // Fetch cart items
  const { data: cartSummary, isLoading, error: cartError } = useQuery({
    queryKey: ["cart-summary", user?.id],
    queryFn: () => cartApi.getCartSummary(user?.id, shopUtils.getSessionId()),
    enabled: !!user?.id || !!shopUtils.getSessionId(),
    retry: 1,
    onError: (error) => {
      console.error('Cart fetch error:', error);
      toast({
        title: "Error loading cart",
        description: "Gagal memuat data keranjang",
        variant: "destructive"
      });
    }
  });

  const cartItems = cartSummary?.items || [];
  const totalItems = cartSummary?.totalItems || 0;
  const totalAmount = cartSummary?.totalAmount || 0;

  // Debug logging
  console.log('Checkout Debug:', {
    user: user?.id,
    sessionId: shopUtils.getSessionId(),
    cartItems: cartItems.length,
    isLoading,
    cartError
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (!isLoading && cartItems.length === 0) {
      navigate('/keranjang');
      toast({
        title: "Keranjang kosong",
        description: "Silakan tambahkan produk ke keranjang terlebih dahulu",
        variant: "destructive"
      });
    }
  }, [cartItems.length, isLoading, navigate, toast]);

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_name || !formData.customer_phone || !formData.delivery_address) {
      toast({
        title: "Data tidak lengkap",
        description: "Mohon lengkapi nama, nomor telepon, dan alamat pengiriman",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order data
      const orderData = {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email || undefined,
        delivery_address: formData.delivery_address,
        delivery_notes: formData.delivery_notes || undefined,
        payment_method: formData.payment_method,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      };

      // Create order
      const order = await ordersApi.createOrder(orderData, user?.id);
      
      // Clear cart after successful order
      await cartApi.clearCart(user?.id, shopUtils.getSessionId());
      
      setOrderNumber(order.order_number);
      setOrderSuccess(true);

      toast({
        title: "Pesanan berhasil dibuat",
        description: `Order #${order.order_number} telah dibuat`,
      });

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Gagal membuat pesanan",
        description: error.message || "Terjadi kesalahan saat membuat pesanan",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <MobileLayout>
        <MobileHeader 
          title="Pesanan Berhasil" 
          showBack
          onBack={() => navigate("/toko")}
        />
        
        <MobileContent>
          <div className="p-4 space-y-6">
            <Card className="p-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Pesanan Berhasil Dibuat!</h2>
              <p className="text-muted-foreground mb-4">
                Terima kasih telah berbelanja di Tempursari Hub Store
              </p>
              <div className="bg-primary/5 p-4 rounded-lg mb-4">
                <p className="text-sm text-muted-foreground">Nomor Pesanan</p>
                <p className="font-bold text-lg">{orderNumber}</p>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Kami akan menghubungi Anda segera untuk konfirmasi pesanan
              </p>
              
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={() => navigate("/orders")}
                >
                  Lihat Pesanan
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/toko")}
                >
                  Lanjut Belanja
                </Button>
              </div>
            </Card>
          </div>
        </MobileContent>
        
        <BottomNavigation />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <MobileHeader 
        title="Checkout" 
        subtitle={`${totalItems} item${totalItems !== 1 ? 's' : ''}`}
        showBack
        onBack={() => navigate("/keranjang")}
      />
      
      <MobileContent>
        {isLoading ? (
          <div className="p-4 space-y-6">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : cartError ? (
          <div className="p-4">
            <Card className="p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">Error Loading Cart</h3>
              <p className="text-muted-foreground mb-4">
                Terjadi kesalahan saat memuat keranjang
              </p>
              <Button onClick={() => navigate("/keranjang")}>
                Kembali ke Keranjang
              </Button>
            </Card>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Customer Information */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Informasi Pelanggan</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customer_name">Nama Lengkap *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange('customer_name', e.target.value)}
                  required
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div>
                <Label htmlFor="customer_phone">Nomor Telepon *</Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                  required
                  placeholder="Contoh: 081234567890"
                />
              </div>

              <div>
                <Label htmlFor="customer_email">Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => handleInputChange('customer_email', e.target.value)}
                  placeholder="contoh@email.com"
                />
              </div>
            </div>
          </Card>

          {/* Delivery Information */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Informasi Pengiriman</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="delivery_address">Alamat Pengiriman *</Label>
                <Textarea
                  id="delivery_address"
                  value={formData.delivery_address}
                  onChange={(e) => handleInputChange('delivery_address', e.target.value)}
                  required
                  placeholder="Masukkan alamat lengkap pengiriman"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="delivery_notes">Catatan Pengiriman</Label>
                <Textarea
                  id="delivery_notes"
                  value={formData.delivery_notes}
                  onChange={(e) => handleInputChange('delivery_notes', e.target.value)}
                  placeholder="Catatan tambahan untuk pengiriman (opsional)"
                  rows={2}
                />
              </div>
            </div>
          </Card>

          {/* Payment Method */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Metode Pembayaran</h3>
            <RadioGroup
              value={formData.payment_method}
              onValueChange={(value: PaymentMethod) => handleInputChange('payment_method', value)}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash_on_delivery" id="cod" />
                  <Label htmlFor="cod" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Bayar di Tempat (COD)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="qris" id="qris" />
                  <Label htmlFor="qris" className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    QRIS
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </Card>

          {/* Order Summary */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Ringkasan Pesanan</h3>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded">
                      <img 
                        src={shopUtils.getProductMainImage(item.product!)} 
                        alt={item.product?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.product?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {shopUtils.formatPrice(item.product?.price || 0)} x {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium text-sm">
                    {shopUtils.formatPrice((item.product?.price || 0) * item.quantity)}
                  </p>
                </div>
              ))}
              
              <Separator />
              
              <div className="space-y-2">
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
            </div>
          </Card>

                     {/* Submit Button */}
           <Button 
             type="submit"
             className="w-full h-12 text-base font-semibold"
             disabled={isSubmitting || cartItems.length === 0}
           >
             {isSubmitting ? "Memproses Pesanan..." : "Buat Pesanan"}
           </Button>
         </form>
        )}
      </MobileContent>
      
      <BottomNavigation />
    </MobileLayout>
  );
}
