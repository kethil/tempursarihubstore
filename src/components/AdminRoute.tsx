import { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom"; // Import Outlet
import { supabase, getUserProfile, UserProfile } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function AdminRoute() { // No more children prop
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({ title: "Akses Ditolak", description: "Anda harus login terlebih dahulu", variant: "destructive" });
          navigate("/login");
          return;
        }
        
        const userProfile = await getUserProfile(user.id);
        console.log("AdminRoute - Fetched Profile:", userProfile);
        
        if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'operator')) {
          toast({ title: "Akses Ditolak", description: "Anda tidak memiliki izin untuk mengakses halaman ini", variant: "destructive" });
          navigate("/toko");
          return;
        }
        
        setProfile(userProfile);
      } catch (error) {
        console.error("Error checking user:", error);
        toast({ title: "Error", description: "Terjadi kesalahan saat memeriksa hak akses", variant: "destructive" });
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <p>Memeriksa hak akses...</p>
        </Card>
      </div>
    );
  }

  // Render the child route and pass the profile via context
  return profile ? <Outlet context={{ profile }} /> : null;
}