import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  ShoppingBag, 
  User, 
  LogIn, 
  LogOut,
  Package,
  ShoppingCart,
  UserCircle
} from "lucide-react";

export default function TopNavigation() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial user state
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="border-b bg-background">
      <div className="container flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate("/toko")}
            className="flex items-center gap-2 font-semibold"
          >
            <ShoppingBag className="h-5 w-5" />
            <span>Tempursari Hub</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/keranjang")}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="ml-2">Keranjang</span>
          </Button>

          {user ? (
            <>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/profile")}
              >
                <UserCircle className="h-4 w-4" />
                <span className="ml-2">Profil</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="ml-2">Logout</span>
              </Button>
            </>
          ) : (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/login")}
            >
              <LogIn className="h-4 w-4" />
              <span className="ml-2">Login</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}