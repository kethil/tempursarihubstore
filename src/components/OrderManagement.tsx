import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ordersApi, 
  type OrderWithDetails, 
  type OrderStatus,
  type OrderFilters,
  type UpdateOrderStatusData 
} from "@/services/shopApi";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, Edit, Package, Calendar, User, CreditCard, MapPin, Truck, CheckCircle, XCircle, Clock, Filter } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import OrderDetailsModal from "@/components/OrderDetailsModal";

interface StatusUpdateFormData {
  order_id: string;
  new_status: OrderStatus;
  notes: string;
}

const initialStatusForm: StatusUpdateFormData = {
  order_id: "",
  new_status: "pending",
  notes: "",
};

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

export default function OrderManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<string | null>(null);
  const [statusFormData, setStatusFormData] = useState<StatusUpdateFormData>(initialStatusForm);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Fetch orders with filters
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-orders", filters],
    queryFn: () => ordersApi.getAdminOrders(filters),
  });

  // Fetch order statistics
  const { data: statistics } = useQuery({
    queryKey: ["order-statistics"],
    queryFn: ordersApi.getOrderStatistics,
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (data: UpdateOrderStatusData) => ordersApi.updateOrderStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-statistics"] });
      setIsStatusDialogOpen(false);
      setStatusFormData(initialStatusForm);
      toast({
        title: "Status pesanan diperbarui",
        description: "Status pesanan berhasil diubah",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal memperbarui status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk status update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: ({ orderIds, status, notes }: { orderIds: string[]; status: OrderStatus; notes?: string }) =>
      ordersApi.bulkUpdateOrderStatus(orderIds, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-statistics"] });
      setSelectedOrders([]);
      toast({
        title: "Bulk update berhasil",
        description: "Status pesanan terpilih berhasil diperbarui",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal bulk update",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!statusFormData.order_id || !statusFormData.new_status) {
      toast({
        title: "Data tidak lengkap",
        description: "Silakan pilih pesanan dan status",
        variant: "destructive",
      });
      return;
    }

    updateStatusMutation.mutate({
      order_id: statusFormData.order_id,
      new_status: statusFormData.new_status,
      notes: statusFormData.notes,
    });
  };

  const handleBulkStatusUpdate = (status: OrderStatus) => {
    if (selectedOrders.length === 0) {
      toast({
        title: "Pilih pesanan",
        description: "Silakan pilih pesanan yang ingin diperbarui",
        variant: "destructive",
      });
      return;
    }

    bulkUpdateMutation.mutate({
      orderIds: selectedOrders,
      status,
      notes: `Bulk update to ${status}`,
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    }
  };

  const openStatusDialog = (orderId: string) => {
    setStatusFormData({ ...initialStatusForm, order_id: orderId });
    setIsStatusDialogOpen(true);
  };

  const openDetailsDialog = (orderId: string) => {
    setSelectedOrderForDetails(orderId);
    setIsDetailsDialogOpen(true);
  };

  const applyFilters = () => {
    setFilters({
      ...filters,
      customer_name: searchTerm || undefined,
      order_number: searchTerm || undefined,
    });
    refetch();
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
    refetch();
  };

  // Filter orders based on search
  const filteredOrders = orders.filter(order =>
    order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manajemen Pesanan</CardTitle>
        <CardDescription>
          Kelola pesanan dan status pengiriman
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Pesanan</p>
                    <p className="text-2xl font-bold">{statistics.total_orders}</p>
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{statistics.pending_orders}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Selesai</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.delivered_orders}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pendapatan</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(statistics.total_revenue)}
                    </p>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Actions */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari pesanan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedOrders.length > 0 && (
              <>
                <Select onValueChange={(value: OrderStatus) => handleBulkStatusUpdate(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Ubah Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Konfirmasi</SelectItem>
                    <SelectItem value="processing">Proses</SelectItem>
                    <SelectItem value="shipped">Kirim</SelectItem>
                    <SelectItem value="delivered">Selesai</SelectItem>
                    <SelectItem value="cancelled">Batal</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  {selectedOrders.length} dipilih
                </span>
              </>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select 
                  value={filters.status || ""} 
                  onValueChange={(value: OrderStatus) => setFilters({ ...filters, status: value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Konfirmasi</SelectItem>
                    <SelectItem value="processing">Proses</SelectItem>
                    <SelectItem value="shipped">Dikirim</SelectItem>
                    <SelectItem value="delivered">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payment-method-filter">Metode Pembayaran</Label>
                <Select 
                  value={filters.payment_method || ""} 
                  onValueChange={(value: any) => setFilters({ ...filters, payment_method: value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Metode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Metode</SelectItem>
                    <SelectItem value="cash_on_delivery">COD</SelectItem>
                    <SelectItem value="qris">QRIS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date-from">Dari Tanggal</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.date_from || ""}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value || undefined })}
                />
              </div>
              <div>
                <Label htmlFor="date-to">Sampai Tanggal</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={filters.date_to || ""}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value || undefined })}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={applyFilters}>Terapkan Filter</Button>
              <Button variant="outline" onClick={clearFilters}>Reset Filter</Button>
            </div>
          </Card>
        )}

        {/* Orders Table */}
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedOrders.length === filteredOrders.length &&
                        filteredOrders.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>No. Pesanan</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={(checked) => handleSelectOrder(order.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.order_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.payment_method === 'cash_on_delivery' ? 'COD' : 'QRIS'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{order.customer_phone}</div>
                        {order.customer_email && (
                          <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.order_items?.length || 0} item(s)
                      </div>
                      {order.order_items && order.order_items.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {order.order_items[0].product?.name}
                          {order.order_items.length > 1 && ` +${order.order_items.length - 1} lainnya`}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{formatCurrency(order.total_amount)}</div>
                        <div className="text-sm text-muted-foreground">
                          Subtotal: {formatCurrency(order.subtotal)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]} variant="secondary">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {order.status === 'pending' ? 'Pending' :
                           order.status === 'confirmed' ? 'Konfirmasi' :
                           order.status === 'processing' ? 'Proses' :
                           order.status === 'shipped' ? 'Dikirim' :
                           order.status === 'delivered' ? 'Selesai' :
                           'Dibatal'}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(order.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetailsDialog(order.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openStatusDialog(order.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Status Update Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Status Pesanan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <Label htmlFor="new-status">Status Baru</Label>
                <Select
                  value={statusFormData.new_status}
                  onValueChange={(value: OrderStatus) => 
                    setStatusFormData({ ...statusFormData, new_status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Konfirmasi</SelectItem>
                    <SelectItem value="processing">Proses</SelectItem>
                    <SelectItem value="shipped">Dikirim</SelectItem>
                    <SelectItem value="delivered">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Catatan (Opsional)</Label>
                <Textarea
                  id="notes"
                  value={statusFormData.notes}
                  onChange={(e) => setStatusFormData({ ...statusFormData, notes: e.target.value })}
                  placeholder="Tambahkan catatan untuk perubahan status..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsStatusDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                >
                  Update Status
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Order Details Modal */}
        <OrderDetailsModal
          orderId={selectedOrderForDetails}
          isOpen={isDetailsDialogOpen}
          onClose={() => {
            setIsDetailsDialogOpen(false);
            setSelectedOrderForDetails(null);
          }}
        />
      </CardContent>
    </Card>
  );
}