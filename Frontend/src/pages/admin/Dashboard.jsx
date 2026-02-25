import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  Inventory,
  AttachMoney,
  FitnessCenter,
  Calculate,
  RateReview,
  Email,
  Description,
  CalendarViewMonth,
  ArrowForward,
  Visibility,
  TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { productsAPI } from '../../services/api';
import { contactAPI } from '../../services/api';
import { getVisitorStats, getPageViewStats } from '../../utils/analytics';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    orders: [],
    totalOrders: 0,
    totalRevenue: 0,
    products: { total: 0, lowStock: 0 },
    generator: { sixWeekTotal: 0, savedTotal: 0, free: 0, paid: 0 },
    calories: { totalCalculations: 0, totalUsers: 0 },
    feedback: { total: 0 },
    contact: { total: 0, new: 0 },
    recentOrders: [],
    topProducts: [],
    reach: 0,
    pageViews: 0,
  });

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [
        ordersRes,
        productsRes,
        genRes,
        calorieRes,
        contactRes,
        feedbackRes,
        analyticsRes,
      ] = await Promise.allSettled([
        adminAPI.getAllOrders({ limit: 1000, page: 1 }),
        productsAPI.getAllProducts({ limit: 500, page: 1 }),
          adminAPI.getGeneratorStats({ range: 'all' }),
          adminAPI.getCalorieStats({ range: 'all' }),
          contactAPI.getStats(),
          adminAPI.getFeedbackList({ limit: 1 }),
          adminAPI.getAnalyticsStats(),
        ]);

        const orders = ordersRes.status === 'fulfilled'
          ? (ordersRes.value.data?.data?.orders || ordersRes.value.data?.orders || [])
          : [];
        const pagination = ordersRes.status === 'fulfilled'
          ? (ordersRes.value.data?.data?.pagination || ordersRes.value.data?.pagination || {})
          : {};
        const totalOrders = pagination.totalOrders ?? orders.length;
        const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const recentOrders = orders.slice(0, 6).map((o) => ({
          id: o._id,
          orderNumber: o._id ? String(o._id).slice(-8).toUpperCase() : '—',
          customer: o.customer?.fullName || '—',
          amount: o.totalAmount ?? 0,
          status: o.status || 'pending',
          date: o.orderDate ? new Date(o.orderDate).toLocaleDateString() : '—',
        }));

        const products = productsRes.status === 'fulfilled' ? productsRes.value : null;
        const productsList = products?.products || [];
        const totalProducts = products?.pagination?.totalProducts ?? productsList.length;
        const lowStock = productsList.filter((p) => (p.stock ?? p.stockQuantity ?? 0) < 5).length;

        const genData = genRes.status === 'fulfilled' ? genRes.value.data?.data : null;
        const genStats = genData?.stats || {};
        const sixWeekTotal = genStats.sixWeekTotal ?? 0;
        const savedTotal = genStats.totalGenerations ?? 0;
        // Emails sent: free 1-week PDF emails + paid 6/12-week PDF emails
        const emailsFree = savedTotal;
        const emailsPaid = sixWeekTotal;
        const totalEmailsSent = emailsFree + emailsPaid;

        const calorieData = calorieRes.status === 'fulfilled' ? calorieRes.value.data?.data : null;
        const calorieStats = calorieData?.stats || {};
        const totalCalculations = calorieStats.totalCalculations ?? 0;
        const totalUsers = calorieStats.totalUsers ?? 0;

        const contactData = contactRes.status === 'fulfilled' ? contactRes.value.data : null;
        const contactPayload = contactData?.data ?? contactData;
        const contactTotal = contactPayload?.totalContacts ?? (Array.isArray(contactPayload) ? contactPayload.length : 0);
        const contactNew = contactPayload?.newContacts ?? 0;

        const feedbackTotal = feedbackRes.status === 'fulfilled' && feedbackRes.value?.data?.data
          ? (feedbackRes.value.data.data.total ?? 0)
          : 0;

        const visitorStats = getVisitorStats();
        const pageStats = getPageViewStats();
        const analyticsData = analyticsRes.status === 'fulfilled' ? analyticsRes.value.data?.data : null;
        const reach = analyticsData?.totalVisitors ?? analyticsData?.totalPageViews ?? visitorStats.total;
        const pageViews = analyticsData?.totalPageViews ?? pageStats.total;

        const byProduct = {};
        orders.forEach((order) => {
          order.products?.forEach((item) => {
            const id = item.product?._id || item.product || item.name;
            const name = item.name || 'Unknown';
            if (!byProduct[id]) byProduct[id] = { name, quantity: 0, revenue: 0 };
            byProduct[id].quantity += item.quantity || 1;
            byProduct[id].revenue += (item.price || 0) * (item.quantity || 1);
          });
        });
        const topProducts = Object.entries(byProduct)
          .map(([id, v]) => ({ id, ...v }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        setData({
          orders,
          totalOrders,
          totalRevenue,
          products: { total: totalProducts, lowStock: lowStock },
          generator: { sixWeekTotal, savedTotal, totalEmailsSent, emailsFree, emailsPaid },
          calories: { totalCalculations, totalUsers },
          feedback: { total: feedbackTotal },
          contact: { total: contactTotal, new: contactNew },
          recentOrders,
          topProducts,
          reach,
          pageViews,
        });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const onFocus = () => fetchAll();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchAll]);

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

  const SectionCard = ({ title, icon, iconBg, children, onView, viewLabel = 'View all' }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${iconBg}`}>{icon}</div>
          <h2 className="font-bold text-lg text-gray-900">{title}</h2>
        </div>
        {onView && (
          <button
            onClick={onView}
            className="flex items-center gap-1 text-sm font-bold text-amber-600 hover:text-amber-700"
          >
            {viewLabel}
            <ArrowForward sx={{ fontSize: 18 }} />
          </button>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-display font-black text-gray-900 mb-1">Dashboard</h1>
        <p className="text-gray-500 text-sm sm:text-base">Overview of your store, programs, and engagement.</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50">
            <AttachMoney className="text-green-600" sx={{ fontSize: 24 }} />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">{data.totalRevenue.toLocaleString()} DA</p>
            <p className="text-xs text-gray-500">Revenue</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50">
            <ShoppingCart className="text-blue-600" sx={{ fontSize: 24 }} />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">{data.totalOrders}</p>
            <p className="text-xs text-gray-500">Orders</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50">
            <TrendingUp className="text-purple-600" sx={{ fontSize: 24 }} />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">{data.reach}</p>
            <p className="text-xs text-gray-500">Visitors</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50">
            <Visibility className="text-amber-600" sx={{ fontSize: 24 }} />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">{data.pageViews}</p>
            <p className="text-xs text-gray-500">Page views</p>
          </div>
        </div>
      </div>

      {/* Main sections grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SectionCard
          title="Products"
          icon={<Inventory className="text-orange-600" />}
          iconBg="bg-orange-50"
          onView={() => navigate('/admin/products')}
        >
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-2xl font-black text-gray-900">{data.products.total}</p>
              <p className="text-sm text-gray-500">Total products</p>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{data.products.lowStock}</p>
              <p className="text-sm text-gray-500">Low stock (&lt;5)</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Orders"
          icon={<ShoppingCart className="text-blue-600" />}
          iconBg="bg-blue-50"
          onView={() => navigate('/admin/orders')}
        >
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-2xl font-black text-gray-900">{data.totalOrders}</p>
              <p className="text-sm text-gray-500">Total orders</p>
            </div>
            <div>
              <p className="text-2xl font-black text-green-600">{data.totalRevenue.toLocaleString()} DA</p>
              <p className="text-sm text-gray-500">Revenue</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Emails sent (program PDFs)"
          icon={<FitnessCenter className="text-rose-600" />}
          iconBg="bg-rose-50"
          onView={() => navigate('/admin/emails-sent')}
          viewLabel="View all"
        >
          <div className="space-y-2 text-sm">
            <p><span className="font-bold text-gray-900">{data.generator.totalEmailsSent}</span> total emails sent</p>
            <p><span className="font-bold text-gray-900">{data.generator.emailsFree}</span> free 1-week (PDF)</p>
            <p><span className="font-bold text-gray-900">{data.generator.emailsPaid}</span> paid 6/12-week (PDF)</p>
          </div>
          <button
            onClick={() => navigate('/admin/emails-sent')}
            className="mt-3 text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            View all emails sent
            <ArrowForward sx={{ fontSize: 16 }} />
          </button>
        </SectionCard>

        <SectionCard
          title="Calorie calculator"
          icon={<Calculate className="text-teal-600" />}
          iconBg="bg-teal-50"
          onView={() => navigate('/admin/calorie-stats')}
        >
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-2xl font-black text-gray-900">{data.calories.totalCalculations}</p>
              <p className="text-sm text-gray-500">Calculations</p>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{data.calories.totalUsers}</p>
              <p className="text-sm text-gray-500">Unique users</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Feedback"
          icon={<RateReview className="text-amber-600" />}
          iconBg="bg-amber-50"
          onView={() => navigate('/admin/feedback')}
        >
          <p className="text-2xl font-black text-gray-900">{data.feedback.total}</p>
          <p className="text-sm text-gray-500">Generator feedback comments</p>
        </SectionCard>

        <SectionCard
          title="Contact messages"
          icon={<Email className="text-indigo-600" />}
          iconBg="bg-indigo-50"
          onView={() => navigate('/admin/contact-messages')}
        >
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-2xl font-black text-gray-900">{data.contact.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
            <div>
              <p className="text-2xl font-black text-blue-600">{data.contact.new}</p>
              <p className="text-sm text-gray-500">New</p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Recent orders + Top products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-lg text-gray-900">Recent orders</h2>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              View all
              <ArrowForward sx={{ fontSize: 16 }} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No orders yet.</div>
            ) : (
              data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-500 flex-shrink-0">
                      <ShoppingCart sx={{ fontSize: 20 }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500 truncate">{order.customer} · {order.amount.toLocaleString()} DA · {order.date}</p>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-lg text-gray-900">Top products</h2>
            <button
              onClick={() => navigate('/admin/products')}
              className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              Products
              <ArrowForward sx={{ fontSize: 16 }} />
            </button>
          </div>
          <div className="p-5">
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-gray-500">No order data yet.</p>
            ) : (
              <div className="space-y-4">
                {data.topProducts.map((product, idx) => (
                  <div key={product.id || idx}>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <p className="font-bold text-sm text-gray-800 line-clamp-1">{product.name}</p>
                      <span className="font-bold text-sm text-gray-900 flex-shrink-0">{product.revenue.toLocaleString()} DA</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{product.quantity} sold</p>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${data.topProducts[0]?.revenue ? (product.revenue / data.topProducts[0].revenue) * 100 : 0}%` }}
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
