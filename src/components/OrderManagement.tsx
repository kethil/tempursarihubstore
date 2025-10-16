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
import { Search, Eye, Edit, Package, Calendar, User, CreditCard, MapPin, Truck, CheckCircle, XCircle, Clock, Filter, TrendingUp, Users, DollarSign } from "lucide-react";
import { TableSkeleton, StatsSkeleton } from "@/components/ui/loading-skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    <Card className="shadow-lg border-0 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Package className="h-5 w-5 text-orange-600" />
          </div>
          Manajemen Pesanan
        </CardTitle>
        <CardDescription>
          Kelola pesanan dan status pengiriman dengan mudah
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Statistics Cards */}
        {statistics ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Pesanan</p>
                    <p className="text-3xl font-bold text-slate-900">{statistics.total_orders}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12% dari bulan lalu
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600">{statistics.pending_orders}</p>
                    <p className="text-xs text-yellow-600 flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      Menunggu konfirmasi
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Selesai</p>
                    <p className="text-3xl font-bold text-green-600">{statistics.delivered_orders}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Berhasil dikirim
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Pendapatan</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(statistics.total_revenue)}
                    </p>
                    <p className="text-xs text-blue-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +8.5% dari bulan lalu
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <StatsSkeleton count={4} />
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
          <TableSkeleton rows={5} columns={8} />
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
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
                  <TableRow 
                    key={order.id} 
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={(checked) => handleSelectOrder(order.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900">{order.order_number}</div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            order.payment_method === 'cash_on_delivery' 
                              ? 'border-orange-200 text-orange-700 bg-orange-50' 
                              : 'border-blue-200 text-blue-700 bg-blue-50'
                          }`}
                        >
                          {order.payment_method === 'cash_on_delivery' ? 'COD' : 'QRIS'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={order.customer_avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                            {order.customer_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-slate-900">{order.customer_name}</div>
                          <div className="text-sm text-slate-500">{order.customer_phone}</div>
                          {order.customer_email && (
                            <div className="text-xs text-slate-400">{order.customer_email}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <Package className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">
                            {order.order_items?.length || 0} item(s)
                          </div>
                          {order.order_items && order.order_items.length > 0 && (
                            <div className="text-xs text-slate-500">
                              {order.order_items[0].product?.name}
                              {order.order_items.length > 1 && ` +${order.order_items.length - 1} lainnya`}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-bold text-slate-900">{formatCurrency(order.total_amount)}</div>
                        <div className="text-sm text-slate-500">
                          Subtotal: {formatCurrency(order.subtotal)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={`${statusColors[order.status]} border-0`}
                        variant="secondary"
                      >
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
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <div className="text-sm text-slate-600">
                          {formatDate(order.created_at)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetailsDialog(order.id)}
                          className="hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openStatusDialog(order.id)}
                          className="hover:bg-green-50"
                        >
                          <Edit className="h-4 w-4 text-green-600" />
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