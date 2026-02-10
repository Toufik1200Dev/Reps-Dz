import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  People,
  AttachMoney,
  Inventory,
  LocalShipping,
  Assessment,
  Add,
  Visibility,
  MenuBook,
  Article,
  FitnessCenter,
  CalendarViewMonth
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { productsAPI } from '../../services/api';
import { getVisitorStats, getBlogClickStats, getPageViewStats, getProductClickStats, getProgramEventStats } from '../../utils/analytics';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    reach: 0,
    reachToday: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    blogClicks: 0,
    blogReach: 0,
    pageViews: 0,
    pageViewsToday: 0,
    productClicks: 0,
    sixWeekTotal: 0,
    programGenerates: { free: 0, paid: 0 },
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Reach (visitors), blog, page views, product clicks from localStorage analytics
        const visitorStats = getVisitorStats();
        const blogStats = getBlogClickStats();
        const pageStats = getPageViewStats();
        const productStats = getProductClickStats();
        const programStats = getProgramEventStats();
        setStats(prev => ({
          ...prev,
          reach: visitorStats.total,
          reachToday: visitorStats.today,
          blogClicks: blogStats.totalClicks,
          blogReach: blogStats.reach,
          pageViews: pageStats.total,
          pageViewsToday: pageStats.today,
          productClicks: productStats.total,
          programGenerates: programStats.generates,
        }));

        // Orders: fetch from API
        const ordersRes = await adminAPI.getAllOrders({ limit: 50, page: 1 });
        const orders = ordersRes.data?.data?.orders || ordersRes.data?.orders || [];
        const pagination = ordersRes.data?.data?.pagination || ordersRes.data?.pagination || {};
        const totalOrdersCount = pagination.totalOrders ?? orders.length;

        const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        // Recent orders (first 8)
        const recent = orders.slice(0, 8).map((o) => ({
          id: o._id,
          orderNumber: o._id ? String(o._id).slice(-8).toUpperCase() : '—',
          customer: o.customer?.fullName || '—',
          amount: o.totalAmount ?? 0,
          status: o.status || 'pending',
          date: o.orderDate ? new Date(o.orderDate).toLocaleDateString() : '—',
        }));
        setRecentOrders(recent);

        // Top products by revenue from orders
        const byProduct = {};
        orders.forEach((order) => {
          order.products?.forEach((item) => {
            const id = item.product?._id || item.product || item.name;
            const name = item.name || 'Unknown';
            if (!byProduct[id]) {
              byProduct[id] = { name, quantity: 0, revenue: 0 };
            }
            byProduct[id].quantity += item.quantity || 1;
            byProduct[id].revenue += (item.price || 0) * (item.quantity || 1);
          });
        });
        const top = Object.entries(byProduct)
          .map(([id, v]) => ({ id, ...v }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
        setTopProducts(top);

        setStats(prev => ({
          ...prev,
          totalRevenue,
          totalOrders: totalOrdersCount,
        }));

        // Products count and low stock (public API)
        try {
          const productsRes = await productsAPI.getAllProducts({ limit: 500, page: 1 });
          const products = productsRes.products || [];
          const pag = productsRes.pagination || {};
          const totalProducts = pag.totalProducts ?? products.length;
          const lowStock = products.filter((p) => (p.stock ?? p.stockQuantity ?? 0) < 5).length;
          setStats(prev => ({
            ...prev,
            totalProducts,
            lowStockProducts: lowStock,
          }));
        } catch (e) {
          console.error('Error fetching products for dashboard:', e);
        }

        // 6-week plan stats from backend
        try {
          const genRes = await adminAPI.getGeneratorStats({ range: 'all' });
          const genData = genRes.data?.data?.stats;
          if (genData?.sixWeekTotal != null) {
            setStats(prev => ({ ...prev, sixWeekTotal: genData.sixWeekTotal }));
          }
        } catch (e) {
          console.error('Error fetching generator stats for dashboard:', e);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
          <h2 className="text-2xl sm:text-3xl font-black font-display mb-1 break-words">{value}</h2>
          <p className="text-gray-500 font-medium text-sm sm:text-base">{title}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
          {icon}
        </div>
      </div>
      {subtitle != null && subtitle !== '' && (
        <div className="flex items-center gap-1 text-sm text-gray-500 font-medium">
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-[#FFD700] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-black mb-2">Dashboard</h1>
        <p className="text-gray-500">Reach and orders at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`${stats.totalRevenue.toLocaleString()} DA`}
          icon={<AttachMoney className="text-green-600" />}
          colorClass="bg-green-50"
          subtitle="From orders"
          onClick={() => { navigate('/admin/analytics'); }}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={<ShoppingCart className="text-blue-600" />}
          colorClass="bg-blue-50"
          subtitle="All time"
          onClick={() => { navigate('/admin/orders'); }}
        />
        <StatCard
          title="Reach"
          value={stats.reach}
          icon={<People className="text-purple-600" />}
          colorClass="bg-purple-50"
          subtitle={stats.reachToday > 0 ? `${stats.reachToday} today` : 'Site visitors'}
          onClick={() => { navigate('/admin/analytics'); }}
        />
        <StatCard
          title="Page Views"
          value={stats.pageViews}
          icon={<Article className="text-indigo-600" />}
          colorClass="bg-indigo-50"
          subtitle={stats.pageViewsToday > 0 ? `${stats.pageViewsToday} today` : 'Across all pages'}
          onClick={() => { navigate('/admin/analytics'); }}
        />
        <StatCard
          title="Product Clicks"
          value={stats.productClicks}
          icon={<Visibility className="text-amber-600" />}
          colorClass="bg-amber-50"
          subtitle="Product detail views"
          onClick={() => { navigate('/admin/analytics'); }}
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={<Inventory className="text-orange-600" />}
          colorClass="bg-orange-50"
          subtitle={stats.lowStockProducts > 0 ? `${stats.lowStockProducts} low stock` : ''}
          onClick={() => { navigate('/admin/products'); }}
        />
        <StatCard
          title="Blog Clicks"
          value={stats.blogClicks}
          icon={<MenuBook className="text-teal-600" />}
          colorClass="bg-teal-50"
          subtitle={stats.blogReach > 0 ? `Reach: ${stats.blogReach} guides` : 'Guide views'}
          onClick={() => { navigate('/admin/analytics'); }}
        />
        <StatCard
          title="6-Week Plan"
          value={stats.sixWeekTotal}
          icon={<CalendarViewMonth className="text-rose-600" />}
          colorClass="bg-rose-50"
          subtitle="Paid plans sent via email"
          onClick={() => { navigate('/admin/generator-stats'); }}
        />
        <StatCard
          title="Program Generates"
          value={(stats.programGenerates?.free || 0) + (stats.programGenerates?.paid || 0)}
          icon={<FitnessCenter className="text-cyan-600" />}
          colorClass="bg-cyan-50"
          subtitle={stats.programGenerates?.free ? `${stats.programGenerates.free} free, ${stats.programGenerates.paid || 0} paid` : '1-week & 6-week'}
          onClick={() => { navigate('/admin/generator-stats'); }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-lg">Recent Orders</h2>
              <button
                onClick={() => { navigate('/admin/orders'); }}
                className="text-sm font-bold text-[#FFD700] bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {recentOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No orders yet.</div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-100 rounded-full text-gray-500">
                        <ShoppingCart fontSize="small" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{order.customer} • {order.amount.toLocaleString()} DA • {order.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <button
                        onClick={() => { navigate('/admin/orders'); }}
                        className="text-gray-400 hover:text-black"
                        aria-label="View order"
                      >
                        <Visibility fontSize="small" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-lg mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { navigate('/admin/products'); }}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-[#FFD700] hover:bg-[#FFD700]/5 transition-all group"
              >
                <Add className="mb-2 text-gray-600 group-hover:text-black" />
                <span className="text-xs font-bold text-gray-600 group-hover:text-black">Add Product</span>
              </button>
              <button
                onClick={() => { navigate('/admin/analytics'); }}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-[#FFD700] hover:bg-[#FFD700]/5 transition-all group"
              >
                <Assessment className="mb-2 text-gray-600 group-hover:text-black" />
                <span className="text-xs font-bold text-gray-600 group-hover:text-black">Analytics</span>
              </button>
              <button
                onClick={() => { navigate('/admin/orders'); }}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-[#FFD700] hover:bg-[#FFD700]/5 transition-all group"
              >
                <LocalShipping className="mb-2 text-gray-600 group-hover:text-black" />
                <span className="text-xs font-bold text-gray-600 group-hover:text-black">Orders</span>
              </button>
              <button
                onClick={() => { navigate('/admin/analytics'); }}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-[#FFD700] hover:bg-[#FFD700]/5 transition-all group"
              >
                <People className="mb-2 text-gray-600 group-hover:text-black" />
                <span className="text-xs font-bold text-gray-600 group-hover:text-black">Reach</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-lg mb-4">Top Products</h2>
            {topProducts.length === 0 ? (
              <p className="text-sm text-gray-500">No order data yet.</p>
            ) : (
              <div className="space-y-6">
                {topProducts.map((product, idx) => (
                  <div key={product.id || idx}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{product.name}</h4>
                        <p className="text-xs text-gray-500">{product.quantity} sold</p>
                      </div>
                      <span className="font-bold text-sm">{product.revenue.toLocaleString()} DA</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FFD700]"
                        style={{ width: `${topProducts[0]?.revenue ? (product.revenue / topProducts[0].revenue) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
