import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek } from 'date-fns';

export const useAnalytics = (profile) => {
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['analytics-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('created_at, total_amount, status');
      if (error) throw error;
      return data;
    },
    enabled: !!profile && profile.role === 'admin',
  });

  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['analytics-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!profile && profile.role === 'admin',
  });

  const { data: orderItems, isLoading: isLoadingOrderItems } = useQuery({
    queryKey: ['analytics-order-items'],
    queryFn: async () => {
        const { data, error } = await supabase
            .from('order_items')
            .select('product_id, quantity, products(name)');
        if (error) throw error;
        return data;
    },
    enabled: !!profile && profile.role === 'admin',
  });


  const totalRevenue = orders?.reduce((sum, order) => order.status !== 'cancelled' ? sum + order.total_amount : sum, 0) || 0;
  const totalOrders = orders?.filter(order => order.status !== 'cancelled').length || 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  const newCustomersThisWeek = customers?.filter(c => new Date(c.created_at) >= startOfWeek(new Date())).length || 0;

  const topProducts = orderItems
    ? Object.values(
        orderItems.reduce((acc, item) => {
          if (!acc[item.product_id]) {
            acc[item.product_id] = { name: item.products.name, sales: 0 };
          }
          acc[item.product_id].sales += item.quantity;
          return acc;
        }, {})
      ).sort((a, b) => b.sales - a.sales).slice(0, 5)
    : [];

  const salesData = orders
    ? Object.values(
        orders.reduce((acc, order) => {
          if (order.status !== 'cancelled') {
            const date = new Date(order.created_at).toLocaleDateString('id-ID');
            if (!acc[date]) {
              acc[date] = { date, sales: 0 };
            }
            acc[date].sales += order.total_amount;
          }
          return acc;
        }, {})
      )
    : [];

  const orderStatusData = orders
    ? Object.entries(
        orders.reduce((acc, order) => {
          const status = order.status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value }))
    : [];


  return {
    isLoading: isLoadingOrders || isLoadingCustomers || isLoadingOrderItems,
    kpis: {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      newCustomersThisWeek,
    },
    charts: {
      topProducts,
      salesData,
      orderStatusData,
    },
  };
};
