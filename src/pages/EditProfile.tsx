import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function EditProfile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
  });
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
        
        // Set form data
        setFormData({
          full_name: profile?.full_name || user.user_metadata?.full_name || "",
          email: user.email || "",
          phone: profile?.phone || user.user_metadata?.phone || "",
        });
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          phone: formData.phone,
        }
      });
      
      if (authError) throw authError;
      
      // Update profile in database
      let profileUpdate;
      if (profile) {
        // Update existing profile
        profileUpdate = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);
      } else {
        // Create new profile
        profileUpdate = await supabase
          .from('profiles')
          .insert([
            {
              user_id: user.id,
              full_name: formData.full_name,
              phone: formData.phone,
            }
          ]);
      }
      
      if (profileUpdate.error) throw profileUpdate.error;
      
      toast({
        title: "Berhasil",
        description: "Profil telah diperbarui",
      });
      
      // Refresh profile data
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setProfile(updatedProfile);
    } catch (error: any) {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!formData.email || formData.email === user?.email) return;
    
    setUpdating(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        email: formData.email,
      });
      
      if (error) throw error;
      
      toast({
        title: "Email diperbarui",
        description: "Silakan cek email Anda untuk konfirmasi",
      });
    } catch (error: any) {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
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
        <h1 className="text-2xl font-bold">Edit Profil</h1>
        <p className="text-muted-foreground">Perbarui informasi akun Anda</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div>
            <h2 className="font-semibold mb-3">Informasi Pribadi</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="full-name">Nama Lengkap</Label>
                <Input
                  id="full-name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-3">Informasi Akun</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                  {formData.email !== user?.email && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleUpdateEmail}
                      disabled={updating}
                    >
                      Update
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Mengubah email memerlukan verifikasi
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={updating}>
              {updating ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate("/profile")}
            >
              Batal
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}