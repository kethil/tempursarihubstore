import { useQuery } from "@tanstack/react-query";
import { ordersApi, type OrderWithDetails, type OrderStatus } from "@/services/shopApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Package, 
  User, 
  MapPin, 
  CreditCard, 
  Calendar, 
  Phone, 
  Mail, 
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface OrderDetailsModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

export default function OrderDetailsModal({ orderId, isOpen, onClose }: OrderDetailsModalProps) {
  // Fetch order details
  const { data: orderDetails, isLoading } = useQuery({
    queryKey: ["order-details", orderId],
    queryFn: () => orderId ? ordersApi.getOrderDetails(orderId) : null,
    enabled: !!orderId && isOpen,
  });

  // Fetch status history
  const { data: statusHistory = [] } = useQuery({
    queryKey: ["order-status-history", orderId],
    queryFn: () => orderId ? ordersApi.getOrderStatusHistory(orderId) : [],
    enabled: !!orderId && isOpen,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: localeId });
  };

  const getStatusIcon = (status: OrderStatus) => {
    const IconComponent = statusIcons[status];
    return <IconComponent className="h-4 w-4" />;
  };

  const getProductImage = (images: any) => {
    if (Array.isArray(images) && images.length > 0) {
      return images[0];
    }
    return "/placeholder.svg";
  };

  if (!orderId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Detail Pesanan</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">Loading...</div>
          </div>
        ) : orderDetails ? (
          <ScrollArea className="max-h-[80vh]">
            <div className="space-y-6 pr-4">
              {/* Order Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{orderDetails.order_number}</CardTitle>
                      <CardDescription>
                        Dibuat pada {formatDate(orderDetails.created_at)}
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[orderDetails.status]} variant="secondary">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(orderDetails.status)}
                        {orderDetails.status === 'pending' ? 'Pending' :
                         orderDetails.status === 'confirmed' ? 'Konfirmasi' :
                         orderDetails.status === 'processing' ? 'Proses' :
                         orderDetails.status === 'shipped' ? 'Dikirim' :
                         orderDetails.status === 'delivered' ? 'Selesai' :
                         'Dibatal'}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informasi Pelanggan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nama</p>
                      <p className="font-medium">{orderDetails.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Telepon</p>
                      <p className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {orderDetails.customer_phone}
                      </p>
                    </div>
                  </div>
                  {orderDetails.customer_email && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {orderDetails.customer_email}
                      </p>
                    </div>
                  )}
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Alamat Pengiriman</p>
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                      <span>{orderDetails.delivery_address}</span>
                    </p>
                    {orderDetails.delivery_notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <strong>Catatan:</strong> {orderDetails.delivery_notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Item Pesanan ({orderDetails.order_items?.length || 0} item)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orderDetails.order_items?.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                        <img
                          src={getProductImage(item.product?.images)}
                          alt={item.product_name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product_name}</h4>
                          {item.product_sku && (
                            <p className="text-sm text-muted-foreground">SKU: {item.product_sku}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} x {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.total_price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Informasi Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Metode Pembayaran</span>
                      <span className="font-medium">
                        {orderDetails.payment_method === 'cash_on_delivery' ? 'Bayar di Tempat (COD)' : 'QRIS'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status Pembayaran</span>
                      <Badge variant="outline">
                        {orderDetails.payment_status === 'pending' ? 'Pending' :
                         orderDetails.payment_status === 'paid' ? 'Lunas' :
                         orderDetails.payment_status === 'failed' ? 'Gagal' :
                         'Refund'}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatCurrency(orderDetails.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ongkir</span>
                        <span>{formatCurrency(orderDetails.delivery_fee || 0)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>{formatCurrency(orderDetails.total_amount)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status History */}
              {statusHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Riwayat Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {statusHistory.map((history, index) => (
                        <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                          <div className="flex-shrink-0 mt-1">
                            {getStatusIcon(history.new_status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">
                                Status diubah ke: {' '}
                                <Badge className={statusColors[history.new_status]} variant="secondary">
                                  {history.new_status === 'pending' ? 'Pending' :
                                   history.new_status === 'confirmed' ? 'Konfirmasi' :
                                   history.new_status === 'processing' ? 'Proses' :
                                   history.new_status === 'shipped' ? 'Dikirim' :
                                   history.new_status === 'delivered' ? 'Selesai' :
                                   'Dibatal'}
                                </Badge>
                              </p>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(history.created_at)}
                              </span>
                            </div>
                            {history.old_status && (
                              <p className="text-sm text-muted-foreground">
                                Dari: {history.old_status}
                              </p>
                            )}
                            {history.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Catatan: {history.notes}
                              </p>
                            )}
                            {(history as any).updated_by_profile?.full_name && (
                              <p className="text-xs text-muted-foreground mt-1">
                                oleh: {(history as any).updated_by_profile.full_name}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Timestamps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Timeline Pesanan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Dibuat</p>
                      <p>{formatDate(orderDetails.created_at)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Terakhir Update</p>
                      <p>{formatDate(orderDetails.updated_at)}</p>
                    </div>
                    {orderDetails.confirmed_at && (
                      <div>
                        <p className="font-medium text-muted-foreground">Dikonfirmasi</p>
                        <p>{formatDate(orderDetails.confirmed_at)}</p>
                      </div>
                    )}
                    {orderDetails.shipped_at && (
                      <div>
                        <p className="font-medium text-muted-foreground">Dikirim</p>
                        <p>{formatDate(orderDetails.shipped_at)}</p>
                      </div>
                    )}
                    {orderDetails.delivered_at && (
                      <div>
                        <p className="font-medium text-muted-foreground">Selesai</p>
                        <p>{formatDate(orderDetails.delivered_at)}</p>
                      </div>
                    )}
                    {orderDetails.cancelled_at && (
                      <div>
                        <p className="font-medium text-muted-foreground">Dibatal</p>
                        <p>{formatDate(orderDetails.cancelled_at)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p>Pesanan tidak ditemukan</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}