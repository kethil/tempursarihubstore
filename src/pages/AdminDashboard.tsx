import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, UserProfile } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useOutletContext } from "react-router-dom";
import { sendOrderStatusEmail } from "@/services/emailService";
import { CustomerTable } from "@/components/CustomerTable";
import { customersApi } from "@/services/shopApi";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import ProductManagement from "@/components/ProductManagement";
import CategoryManagement from "@/components/CategoryManagement";

export default function AdminDashboard() {
  const { profile } = useOutletContext<{ profile: UserProfile }>();
  console.log("AdminDashboard - Received Profile from context:", profile);
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<string>("");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [newOrderStatus, setNewOrderStatus] = useState<"pending" | "cancelled" | "confirmed" | "processing" | "shipped" | "delivered" | "">("");

  // Fetch orders
  const { data: orders, refetch: refetchOrders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items(
            *,
            product:products(name)
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch customers
  const { data: customers } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: () => customersApi.getCustomers(),
  });

  // Fetch order details when selected
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!selectedOrder) {
        setSelectedOrderDetails(null);
        return;
      }
      
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items(
            *,
            product:products(name)
          )
        `)
        .eq("id", selectedOrder)
        .single();
      
      if (!error && data) {
        setSelectedOrderDetails(data);
      }
    };
    
    fetchOrderDetails();
  }, [selectedOrder]);

  // Update order status
  const updateOrderStatus = async () => {
    if (!selectedOrder || !newOrderStatus || !selectedOrderDetails) return;
    
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newOrderStatus })
        .eq("id", selectedOrder);
      
      if (error) throw error;
      
      // Send email notification
      await sendOrderStatusEmail(
        selectedOrderDetails.customer_email,
        selectedOrderDetails.customer_name,
        selectedOrderDetails.order_number,
        newOrderStatus,
        selectedOrderDetails
      );
      
      toast({
        title: "Status pesanan diperbarui",
        description: "Status pesanan telah berhasil diubah dan notifikasi email telah dikirim",
      });
      
      refetchOrders();
      setSelectedOrder("");
      setSelectedOrderDetails(null);
      setNewOrderStatus("");
    } catch (error: any) {
      toast({
        title: "Gagal memperbarui status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
      <div className="p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Kelola produk, kategori, dan pesanan</p>
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analytics">Analitik</TabsTrigger>
            <TabsTrigger value="products">Produk</TabsTrigger>
            <TabsTrigger value="categories">Kategori</TabsTrigger>
            <TabsTrigger value="orders">Pesanan</TabsTrigger>
            <TabsTrigger value="customers">Pelanggan</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsDashboard profile={profile} />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card className="p-4">
              <h2 className="text-xl font-semibold mb-4">Daftar Pesanan</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Pesanan</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.order_number}</TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell>Rp {order.total_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'confirmed' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-3">Update Status Pesanan</h3>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor="order-select">Pilih Pesanan</Label>
                    <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih pesanan" />
                      </SelectTrigger>
                      <SelectContent>
                        {orders?.map((order) => (
                          <SelectItem key={order.id} value={order.id}>
                            {order.order_number} - {order.customer_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <Label htmlFor="status-select">Status Baru</Label>
                    <Select value={newOrderStatus} onValueChange={(value) => setNewOrderStatus(value as typeof newOrderStatus)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={updateOrderStatus} 
                    disabled={!selectedOrder || !newOrderStatus}
                  >
                    Update & Kirim Email
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card className="p-4">
              <h2 className="text-xl font-semibold mb-4">Daftar Pelanggan</h2>
              {customers && <CustomerTable customers={customers} />}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
