import { Home, FileText, Info, ShoppingBag, Package } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const navItems: NavItem[] = [
  {
    id: "home",
    label: "Beranda",
    icon: Home,
    path: "/",
  },
  {
    id: "layanan",
    label: "Layanan",
    icon: FileText,
    path: "/layanan",
  },
  {
    id: "shop",
    label: "Toko",
    icon: ShoppingBag,
    path: "/toko",
  },
  {
    id: "info",
    label: "Informasi",
    icon: Info,
    path: "/informasi",
  },
  {
    id: "orders",
    label: "Pesanan",
    icon: Package,
    path: "/orders",
  },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bg-card border-t border-outline-variant px-2 py-2 shadow-app-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200",
                "min-w-0 flex-1 max-w-16",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-variant"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 mb-1",
                isActive && "animate-scale-in"
              )} />
              <span className="text-xs font-medium truncate">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};