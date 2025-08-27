import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function UserOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUser(user);
    };
    getUser();
  }, [navigate]);

  // Fetch user's orders
  useEffect(() => {
    if (!user) return;
    
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(`
            *,
            order_items(
              *,
              product:products(name)
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        
        setOrders(data || []);
      } catch (error: any) {
        toast({
          title: "Gagal memuat pesanan",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [user, toast]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
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
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pesanan Saya</h1>
        <p className="text-muted-foreground">Lihat riwayat pesanan Anda</p>
      </div>

      {orders.length === 0 ? (
        <Card className="p-8 text-center">
          <h3 className="font-semibold text-lg mb-2">Belum Ada Pesanan</h3>
          <p className="text-muted-foreground mb-4">
            Anda belum membuat pesanan apa pun
          </p>
          <Button onClick={() => navigate("/toko")}>
            Mulai Belanja
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">#{order.order_number}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'confirmed' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-3">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.product?.name} × {item.quantity}</span>
                    <span>Rp {(item.unit_price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>Rp {order.total_amount.toLocaleString()}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}