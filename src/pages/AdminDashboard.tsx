import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, UserProfile } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useOutletContext } from "react-router-dom";
import { CustomerTable } from "@/components/CustomerTable";
import { customersApi } from "@/services/shopApi";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import ProductManagement from "@/components/ProductManagement";
import CategoryManagement from "@/components/CategoryManagement";
import OrderManagement from "@/components/OrderManagement";
import ServiceRequestManagement from "@/components/ServiceRequestManagement";

export default function AdminDashboard() {
  const { profile } = useOutletContext<{ profile: UserProfile }>();
  console.log("AdminDashboard - Received Profile from context:", profile);
  const { toast } = useToast();

  // Fetch customers
  const { data: customers } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: () => customersApi.getCustomers(),
  });

  return (
      <div className="p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Kelola produk, kategori, dan pesanan</p>
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="analytics">Analitik</TabsTrigger>
            <TabsTrigger value="products">Produk</TabsTrigger>
            <TabsTrigger value="categories">Kategori</TabsTrigger>
            <TabsTrigger value="orders">Pesanan</TabsTrigger>
            <TabsTrigger value="customers">Pelanggan</TabsTrigger>
            <TabsTrigger value="services">Layanan</TabsTrigger>
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

          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="customers">
            <Card className="p-4">
              <h2 className="text-xl font-semibold mb-4">Daftar Pelanggan</h2>
              {customers && <CustomerTable customers={customers} />}
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <ServiceRequestManagement />
          </TabsContent>
        </Tabs>
      </div>
  );
}
