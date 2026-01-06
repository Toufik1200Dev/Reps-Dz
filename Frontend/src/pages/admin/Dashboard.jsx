import React, { useState } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  People,
  AttachMoney,
  Inventory,
  LocalShipping,
  Assessment,
  Add,
  Visibility,
  MoreVert
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  // Mock data - in real app, fetch from API
  const [stats, setStats] = useState({
    totalRevenue: 125000,
    totalOrders: 156,
    totalCustomers: 89,
    totalProducts: 24,
    pendingOrders: 12,
    lowStockProducts: 3,
  });

  const [recentOrders, setRecentOrders] = useState([
    {
      id: 1,
      orderNumber: 'SB24120001',
      customer: 'John Doe',
      amount: 89.99,
      status: 'pending',
      date: '2024-01-15',
    },
    {
      id: 2,
      orderNumber: 'SB24120002',
      customer: 'Sarah Smith',
      amount: 149.99,
      status: 'confirmed',
      date: '2024-01-14',
    },
    {
      id: 3,
      orderNumber: 'SB24120003',
      customer: 'Mike Johnson',
      amount: 79.99,
      status: 'shipped',
      date: '2024-01-13',
    },
  ]);

  const [topProducts, setTopProducts] = useState([
    {
      id: 1,
      name: 'Professional Pull-Up Bar',
      sales: 45,
      revenue: 4049.55,
      stock: 12,
    },
    {
      id: 2,
      name: 'Parallel Bars Set',
      sales: 32,
      revenue: 4799.68,
      stock: 8,
    },
    {
      id: 3,
      name: 'Resistance Bands Kit',
      sales: 28,
      revenue: 1119.72,
      stock: 15,
    },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'shipped': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const StatCard = ({ title, value, icon, subtitle, colorClass, onClick }) => (
    <div
      onClick={onClick}
      className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-black font-display mb-1">{value}</h2>
          <p className="text-gray-500 font-medium">{title}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
          {icon}
        </div>
      </div>
      {subtitle && (
        <div className="flex items-center gap-1 text-sm text-green-600 font-bold">
          <TrendingUp fontSize="small" />
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-black mb-2">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's what's happening with your store today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={<AttachMoney className="text-green-600" />}
          colorClass="bg-green-50"
          subtitle="+12% from last month"
          onClick={() => navigate('/admin/analytics')}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={<ShoppingCart className="text-blue-600" />}
          colorClass="bg-blue-50"
          subtitle="+8% from last month"
          onClick={() => navigate('/admin/orders')}
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={<People className="text-purple-600" />}
          colorClass="bg-purple-50"
          subtitle="+15% from last month"
          onClick={() => navigate('/admin/customers')}
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={<Inventory className="text-orange-600" />}
          colorClass="bg-orange-50"
          subtitle={`${stats.lowStockProducts} low stock`}
          onClick={() => navigate('/admin/products')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-lg">Recent Orders</h2>
              <button
                onClick={() => navigate('/admin/orders')}
                className="text-sm font-bold text-secondary bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-full text-gray-500">
                      <ShoppingCart fontSize="small" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{order.customer} • ${order.amount} • {order.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <button className="text-gray-400 hover:text-black">
                      <Visibility fontSize="small" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-lg mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/admin/products/new')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-secondary hover:bg-secondary/5 transition-all group"
              >
                <Add className="mb-2 text-gray-600 group-hover:text-black" />
                <span className="text-xs font-bold text-gray-600 group-hover:text-black">Add Product</span>
              </button>
              <button
                onClick={() => navigate('/admin/analytics')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-secondary hover:bg-secondary/5 transition-all group"
              >
                <Assessment className="mb-2 text-gray-600 group-hover:text-black" />
                <span className="text-xs font-bold text-gray-600 group-hover:text-black">Analytics</span>
              </button>
              <button
                onClick={() => navigate('/admin/orders')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-secondary hover:bg-secondary/5 transition-all group"
              >
                <LocalShipping className="mb-2 text-gray-600 group-hover:text-black" />
                <span className="text-xs font-bold text-gray-600 group-hover:text-black">Orders</span>
              </button>
              <button
                onClick={() => navigate('/admin/customers')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-secondary hover:bg-secondary/5 transition-all group"
              >
                <People className="mb-2 text-gray-600 group-hover:text-black" />
                <span className="text-xs font-bold text-gray-600 group-hover:text-black">Customers</span>
              </button>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-lg mb-4">Top Products</h2>
            <div className="space-y-6">
              {topProducts.map((product) => (
                <div key={product.id}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-gray-800">{product.name}</h4>
                      <p className="text-xs text-gray-500">{product.sales} sales • Stock: {product.stock}</p>
                    </div>
                    <span className="font-bold text-sm">${product.revenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary"
                      style={{ width: `${(product.sales / 50) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
