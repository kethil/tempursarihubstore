import { MobileLayout, MobileHeader, MobileContent } from "@/components/MobileLayout";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Clock, Truck, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ordersApi, shopUtils } from "@/services/shopApi";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const orderStatusConfig = {
  pending: {
    label: 'Menunggu Konfirmasi',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock
  },
  confirmed: {
    label: 'Dikonfirmasi',
    color: 'bg-blue-100 text-blue-800',
    icon: Package
  },
  processing: {
    label: 'Diproses',
    color: 'bg-purple-100 text-purple-800',
    icon: Package
  },
  shipped: {
    label: 'Dikirim',
    color: 'bg-orange-100 text-orange-800',
    icon: Truck
  },
  delivered: {
    label: 'Diterima',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Dibatalkan',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  }
};

export default function OrderTracking() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Fetch user orders
  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ["user-orders", user?.id],
    queryFn: () => ordersApi.getUserOrders(user?.id!),
    enabled: !!user?.id,
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Memperbarui data",
      description: "Data pesanan berhasil diperbarui",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status: string) => {
    return orderStatusConfig[status as keyof typeof orderStatusConfig] || orderStatusConfig.pending;
  };

  return (
    <MobileLayout>
      <MobileHeader 
        title="Riwayat Pesanan" 
        subtitle={`${orders?.length || 0} pesanan`}
        showBack
        onBack={() => navigate("/")}
      />
      
      <MobileContent>
        <div className="p-4 space-y-4">
          {!user ? (
            <Card className="p-6 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Login Diperlukan</h3>
              <p className="text-muted-foreground mb-4">
                Silakan login untuk melihat riwayat pesanan Anda
              </p>
              <Button onClick={() => navigate("/")}>
                Kembali ke Beranda
              </Button>
            </Card>
          ) : isLoading ? (
            // Loading skeleton
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
          ) : orders?.length === 0 ? (
            <Card className="p-6 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Belum Ada Pesanan</h3>
              <p className="text-muted-foreground mb-4">
                Anda belum memiliki riwayat pesanan
              </p>
              <Button onClick={() => navigate("/toko")}>
                Mulai Belanja
              </Button>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Pesanan Anda</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                >
                  Refresh
                </Button>
              </div>

              <div className="space-y-4">
                {orders?.map((order) => {
                  const statusConfig = getStatusConfig(order.status || 'pending');
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <Card key={order.id} className="p-4">
                      <div className="space-y-3">
                        {/* Order Header */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">#{order.order_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(order.created_at || '')}
                            </p>
                          </div>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>

                        <Separator />

                        {/* Order Details */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total:</span>
                            <span className="font-semibold">
                              {shopUtils.formatPrice(order.total_amount)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Metode Pembayaran:</span>
                            <span className="capitalize">
                              {order.payment_method === 'cash_on_delivery' ? 'COD' : 'QRIS'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Status Pembayaran:</span>
                            <Badge 
                              variant={order.payment_status === 'paid' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {order.payment_status === 'paid' ? 'Lunas' : 'Menunggu'}
                            </Badge>
                          </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-xs font-medium mb-1">Alamat Pengiriman:</p>
                          <p className="text-xs text-muted-foreground">
                            {order.delivery_address}
                          </p>
                          {order.delivery_notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Catatan: {order.delivery_notes}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              // TODO: Navigate to order detail page
                              toast({
                                title: "Fitur dalam pengembangan",
                                description: "Halaman detail pesanan akan segera tersedia",
                              });
                            }}
                          >
                            Detail Pesanan
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => navigate("/toko")}
                          >
                            Belanja Lagi
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </MobileContent>
      
      <BottomNavigation />
    </MobileLayout>
  );
}
