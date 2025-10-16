import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Package,
  FolderOpen,
  ShoppingCart,
  Users,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight,
  Home,
  Bell,
} from "lucide-react";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  color?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: "analytics",
    label: "Analitik",
    icon: BarChart3,
    color: "text-blue-600",
  },
  {
    id: "products",
    label: "Produk",
    icon: Package,
    color: "text-green-600",
  },
  {
    id: "categories",
    label: "Kategori",
    icon: FolderOpen,
    color: "text-purple-600",
  },
  {
    id: "orders",
    label: "Pesanan",
    icon: ShoppingCart,
    color: "text-orange-600",
  },
  {
    id: "customers",
    label: "Pelanggan",
    icon: Users,
    color: "text-cyan-600",
  },
  {
    id: "services",
    label: "Layanan",
    icon: FileText,
    color: "text-pink-600",
  },
];

export function AdminSidebar({ activeTab, onTabChange, className }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-gradient-to-b from-slate-50 to-white border-r border-slate-200 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Admin Panel</h2>
                <p className="text-xs text-slate-500">Tempursari Digital</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0 hover:bg-slate-100"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-12 transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md hover:from-blue-700 hover:to-purple-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                isCollapsed && "px-2"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className={cn("h-5 w-5", !isActive && item.color)} />
              {!isCollapsed && (
                <>
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className="ml-auto bg-red-100 text-red-800 hover:bg-red-100"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-12 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            isCollapsed && "px-2"
          )}
        >
          <Bell className="h-5 w-5" />
          {!isCollapsed && <span className="font-medium">Notifikasi</span>}
        </Button>
      </div>
    </div>
  );
}
