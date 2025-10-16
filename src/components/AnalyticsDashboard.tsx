import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/useAnalytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { DollarSign, ShoppingCart, Users, BadgePercent, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { StatsSkeleton, ChartSkeleton } from "@/components/ui/loading-skeleton";

export function AnalyticsDashboard({ profile }) {
  const { isLoading, kpis, charts } = useAnalytics(profile);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <StatsSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          <div className="lg:col-span-4">
            <ChartSkeleton />
          </div>
          <div className="lg:col-span-3">
            <ChartSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const StatCard = ({ title, value, description, icon: Icon, trend, trendValue, gradient, iconColor }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 overflow-hidden">
      <div className={`${gradient} p-6 relative`}>
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/90">{title}</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-white">{value}</p>
                {trend && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    trend === 'up' ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
                  }`}>
                    {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {trendValue}%
                  </div>
                )}
              </div>
              <p className="text-xs text-white/70">{description}</p>
            </div>
            <div className={`p-3 rounded-xl bg-white/20 backdrop-blur-sm`}>
              <Icon className={`h-6 w-6 ${iconColor || 'text-white'}`} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Analytics Overview
          </h2>
          <p className="text-slate-600 mt-1">Monitor your business performance and key metrics</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
          <Activity className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">Live Data</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`Rp ${kpis.totalRevenue.toLocaleString()}`}
          description="All-time revenue"
          icon={DollarSign}
          trend="up"
          trendValue="12.5"
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          iconColor="text-blue-100"
        />
        <StatCard
          title="Total Orders"
          value={kpis.totalOrders.toLocaleString()}
          description="All-time orders"
          icon={ShoppingCart}
          trend="up"
          trendValue="8.2"
          gradient="bg-gradient-to-br from-green-500 to-green-600"
          iconColor="text-green-100"
        />
        <StatCard
          title="Avg. Order Value"
          value={`Rp ${kpis.avgOrderValue.toLocaleString()}`}
          description="Average per order"
          icon={BadgePercent}
          trend="up"
          trendValue="5.4"
          gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          iconColor="text-purple-100"
        />
        <StatCard
          title="New Customers"
          value={kpis.newCustomersThisWeek.toLocaleString()}
          description="This week"
          icon={Users}
          trend="up"
          trendValue="15.3"
          gradient="bg-gradient-to-br from-orange-500 to-orange-600"
          iconColor="text-orange-100"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-4 shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              Sales Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={charts.salesData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748B" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748B" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `Rp${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                  name="Sales"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="lg:col-span-3 shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-green-600" />
              </div>
              Top Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {charts.topProducts.map((product, index) => (
                <div key={index} className="flex items-center p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{product.name}</p>
                      <p className="text-sm text-slate-500">{product.sales} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                        style={{ width: `${(product.sales / Math.max(...charts.topProducts.map(p => p.sales))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Order Status Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              Order Status Distribution
            </CardTitle>
            </CardHeader>
          <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                <Pie 
                  data={charts.orderStatusData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                            {charts.orderStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-blue-900">Conversion Rate</p>
                  <p className="text-2xl font-bold text-blue-600">12.4%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-900">Customer Retention</p>
                  <p className="text-2xl font-bold text-green-600">78.2%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-purple-900">Avg. Session Duration</p>
                  <p className="text-2xl font-bold text-purple-600">4m 32s</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
