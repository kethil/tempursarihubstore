import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/Home";
import Layanan from "./pages/Layanan";
import LayananMandiri from "./pages/LayananMandiri";
import Informasi from "./pages/Informasi";
import Toko from "./pages/Toko";
import Keranjang from "./pages/Keranjang";
import Checkout from "./pages/Checkout";
import OrderTracking from "./pages/OrderTracking";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import UserOrders from "./pages/UserOrders";
import UserProfile from "./pages/UserProfile";
import EditProfile from "./pages/EditProfile";
import NotFound from "./pages/NotFound";
import AdminRoute from "./components/AdminRoute";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/layanan", element: <Layanan /> },
  { path: "/layanan-mandiri", element: <LayananMandiri /> },
  { path: "/informasi", element: <Informasi /> },
  { path: "/toko", element: <Toko /> },
  { path: "/keranjang", element: <Keranjang /> },
  { path: "/checkout", element: <Checkout /> },
  { path: "/orders", element: <OrderTracking /> },
  { path: "/login", element: <Login /> },
  {
    path: "/admin",
    element: <AdminRoute />,
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
    ],
  },
  { path: "/my-orders", element: <UserOrders /> },
  { path: "/profile", element: <UserProfile /> },
  { path: "/edit-profile", element: <EditProfile /> },
  { path: "*", element: <NotFound /> },
]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RouterProvider router={router} />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;