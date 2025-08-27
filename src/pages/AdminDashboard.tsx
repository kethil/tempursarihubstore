import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, UserProfile } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function AdminDashboard() {
  const { profile } = useOutletContext<{ profile: UserProfile }>();
  console.log("AdminDashboard - Received Profile from context:", profile);
  const { toast } = useToast();
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: 0,
    stock_quantity: 0,
    description: "",
    category_id: ""
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string>("");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [newOrderStatus, setNewOrderStatus] = useState<string>("");

  // Fetch categories for product form
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true);
      
      if (!error && data) {
        setCategories(data);
      }
    };
    
    fetchCategories();
  }, []);

  // Fetch products
  const { data: products, refetch: refetchProducts } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

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
    enabled: !!profile && profile.role === 'admin',
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

  // Add new product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("products")
        .insert([{
          ...newProduct,
          price: Number(newProduct.price),
          stock_quantity: Number(newProduct.stock_quantity),
          status: "active",
          slug: newProduct.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        }]);
      
      if (error) throw error;
      
      toast({
        title: "Produk berhasil ditambahkan",
        description: `${newProduct.name} telah ditambahkan ke inventory`,
      });
      
      setNewProduct({
        name: "",
        price: 0,
        stock_quantity: 0,
        description: "",
        category_id: ""
      });
      
      refetchProducts();
    } catch (error: any) {
      toast({
        title: "Gagal menambahkan produk",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Update product stock
  const updateProductStock = async (productId: string, newStock: number) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ stock_quantity: newStock })
        .eq("id", productId);
      
      if (error) throw error;
      
      toast({
        title: "Stok berhasil diperbarui",
        description: "Jumlah stok telah diperbarui",
      });
      
      refetchProducts();
    } catch (error: any) {
      toast({
        title: "Gagal memperbarui stok",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
          <p className="text-muted-foreground">Kelola produk dan pesanan</p>
        </div>

        <Tabs defaultValue={profile?.role === 'admin' ? 'dashboard' : 'products'}>
          <TabsList>
            {profile?.role === 'admin' && <TabsTrigger value="dashboard">Dashboard</TabsTrigger>}
            <TabsTrigger value="products">Produk</TabsTrigger>
            <TabsTrigger value="orders">Pesanan</TabsTrigger>
            {profile?.role === 'admin' && <TabsTrigger value="customers">Pelanggan</TabsTrigger>}
            <TabsTrigger value="add-product">Tambah Produk</TabsTrigger>
          </TabsList>

          {profile?.role === 'admin' && (
            <TabsContent value="dashboard" className="space-y-6">
              <AnalyticsDashboard profile={profile} />
            </TabsContent>
          )}

          <TabsContent value="products" className="space-y-4">
            <Card className="p-4">
              <h2 className="text-xl font-semibold mb-4">Daftar Produk</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category?.name || "-"}</TableCell>
                      <TableCell>Rp {product.price.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            defaultValue={product.stock_quantity}
                            className="w-20"
                            onBlur={(e) => updateProductStock(product.id, parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
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
                    <Select value={newOrderStatus} onValueChange={setNewOrderStatus}>
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

          {profile?.role === 'admin' && (
            <TabsContent value="customers">
              <Card className="p-4">
                <h2 className="text-xl font-semibold mb-4">Daftar Pelanggan</h2>
                {customers && <CustomerTable customers={customers} />}
              </Card>
            </TabsContent>
          )}

          <TabsContent value="add-product">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Tambah Produk Baru</h2>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nama Produk</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="price">Harga (Rp)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="stock">Stok</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newProduct.stock_quantity}
                    onChange={(e) => setNewProduct({...newProduct, stock_quantity: Number(e.target.value)})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Kategori</Label>
                  <Select 
                    value={newProduct.category_id} 
                    onValueChange={(value) => setNewProduct({...newProduct, category_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <Input
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  />
                </div>
                
                <Button type="submit">Tambah Produk</Button>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
