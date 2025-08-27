import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Edit, LogOut, ShoppingBag } from "lucide-react";

export default function UserProfile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get current user and profile
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }
        
        setUser(user);
        
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        
        setProfile(profile || null);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Gagal memuat data pengguna",
          variant: "destructive",
        });
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndProfile();
  }, [navigate, toast]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logout berhasil",
        description: "Anda telah keluar dari akun",
      });
      
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Logout gagal",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <Card className="p-6 animate-pulse">
          <div className="space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profil Pengguna</h1>
        <p className="text-muted-foreground">Kelola akun Anda</p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h2 className="font-semibold mb-3">Informasi Akun</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Nama Lengkap</p>
                <p className="font-medium">
                  {profile?.full_name || user?.user_metadata?.full_name || "Belum diatur"}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Nomor Telepon</p>
                <p className="font-medium">
                  {profile?.phone || user?.user_metadata?.phone || "Belum diatur"}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">ID Pengguna</p>
                <p className="font-medium text-sm">{user?.id}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h2 className="font-semibold mb-3">Aksi</h2>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => navigate("/edit-profile")}
                className="justify-start"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profil
              </Button>
              
              <Button 
                onClick={() => navigate("/my-orders")}
                className="justify-start"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Riwayat Pesanan
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="justify-start"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}