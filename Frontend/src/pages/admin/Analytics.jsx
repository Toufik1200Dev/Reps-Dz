import React, { useState, useEffect } from 'react';
import {
  Assessment,
  Visibility,
  ShoppingCart,
  TrendingUp,
  People,
  LocalShipping,
  MenuBook,
  Article,
  CalendarViewMonth
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { getVisitorStats, getProductClickStats, getBlogClickStats, getPageViewStats, getProgramEventStats } from '../../utils/analytics';

export default function Analytics() {
  const [visitorStats, setVisitorStats] = useState({ daily: [], total: 0, today: 0 });
  const [productClickStats, setProductClickStats] = useState({ byProduct: [], total: 0 });
  const [blogClickStats, setBlogClickStats] = useState({ byGuide: [], totalClicks: 0, reach: 0 });
  const [pageViewStats, setPageViewStats] = useState({ byPage: [], total: 0, today: 0 });
  const [programEventStats, setProgramEventStats] = useState({ planSelects: { free: 0, paid: 0 }, generates: { free: 0, paid: 0 } });
  const [orderStats, setOrderStats] = useState({ byProduct: [], total: 0, totalOrders: 0 });
  const [sixWeekRequests, setSixWeekRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch orders data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get visitor, product click, blog, page view, program stats from localStorage
        setVisitorStats(getVisitorStats());
        setProductClickStats(getProductClickStats());
        setBlogClickStats(getBlogClickStats());
        setPageViewStats(getPageViewStats());
        setProgramEventStats(getProgramEventStats());

        // Fetch 6-week plan requests from backend
        try {
          const genRes = await adminAPI.getGeneratorStats({ range: 'all' });
          const sixWeek = genRes.data?.data?.stats?.sixWeekRequests || [];
          setSixWeekRequests(sixWeek);
        } catch (e) {
          console.error('Error fetching 6-week stats:', e);
        }

        // Fetch orders from API using axios (interceptor handles x-admin-password)
        const response = await adminAPI.getAllOrders();
        // Backend returns { success: true, data: { orders: [...], pagination: {...} } }
        // Axios wraps it, so we need response.data.data.orders
        const orders = response.data?.data?.orders || response.data?.orders || [];

          // Calculate order statistics by product
          const ordersByProduct = {};
          let totalRevenue = 0;

          orders.forEach(order => {
            totalRevenue += order.totalAmount || 0;
            order.products?.forEach(product => {
              const productId = product.product?._id || product.product || 'unknown';
              const productName = product.name || 'Unknown Product';
              
              if (!ordersByProduct[productId]) {
                ordersByProduct[productId] = {
                  productId,
                  productName,
                  orders: 0,
                  quantity: 0,
                  revenue: 0
                };
              }
              
              ordersByProduct[productId].orders += 1;
              ordersByProduct[productId].quantity += product.quantity || 1;
              ordersByProduct[productId].revenue += (product.price || 0) * (product.quantity || 1);
            });
          });

          // Convert to array and sort by orders
          const productOrderStats = Object.values(ordersByProduct).sort((a, b) => b.orders - a.orders);

        setOrderStats({
          byProduct: productOrderStats,
          total: totalRevenue,
          totalOrders: orders.length
        });
      } catch (err) {
        console.error('Error fetching analytics data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-gray-500">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-black mb-2">Analytics Dashboard</h1>
        <p className="text-gray-500">Track visitors, product clicks, blog reach, and order statistics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-black font-display mb-1">{visitorStats.total}</h3>
              <p className="text-gray-500">Total Visitors</p>
              <p className="text-xs text-green-600 mt-1">{visitorStats.today} today</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <People />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-black font-display mb-1">{pageViewStats.total}</h3>
              <p className="text-gray-500">Page Views</p>
              <p className="text-xs text-indigo-600 mt-1">{pageViewStats.today} today</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <Article />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-black font-display mb-1">{productClickStats.total}</h3>
              <p className="text-gray-500">Product Clicks</p>
              <p className="text-xs text-purple-600 mt-1">{productClickStats.byProduct.length} products</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <Visibility />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-black font-display mb-1">{blogClickStats.totalClicks}</h3>
              <p className="text-gray-500">Blog Clicks</p>
              <p className="text-xs text-teal-600 mt-1">{blogClickStats.totalClicks} guide views</p>
            </div>
            <div className="p-3 rounded-xl bg-teal-50 text-teal-600">
              <MenuBook />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-black font-display mb-1">{blogClickStats.reach}</h3>
              <p className="text-gray-500">Blog Reach</p>
              <p className="text-xs text-indigo-600 mt-1">guides with views</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <Article />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-black font-display mb-1">{orderStats.totalOrders}</h3>
              <p className="text-gray-500">Total Orders</p>
              <p className="text-xs text-orange-600 mt-1">{orderStats.byProduct.length} products</p>
            </div>
            <div className="p-3 rounded-xl bg-green-50 text-green-600">
              <ShoppingCart />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-black font-display mb-1">{sixWeekRequests.length}</h3>
              <p className="text-gray-500">6-Week Plan</p>
              <p className="text-xs text-rose-600 mt-1">Paid plans sent</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
              <CalendarViewMonth />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-black font-display mb-1">
                {orderStats.total.toLocaleString()} DA
              </h3>
              <p className="text-gray-500">Total Revenue</p>
            </div>
            <div className="p-3 rounded-xl bg-yellow-50 text-yellow-600">
              <TrendingUp />
            </div>
          </div>
        </div>
      </div>

      {/* Visitors Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <People className="text-blue-600" />
            Visitors ({visitorStats.total} total)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-bold text-gray-600 text-sm">Date</th>
                <th className="p-4 font-bold text-gray-600 text-sm text-right">Visits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visitorStats.daily.slice(-30).reverse().map((visitor, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium">{new Date(visitor.date).toLocaleDateString()}</td>
                  <td className="p-4 text-right font-bold">{visitor.count || 1}</td>
                </tr>
              ))}
              {visitorStats.daily.length === 0 && (
                <tr>
                  <td colSpan="2" className="p-8 text-center text-gray-500">
                    No visitor data available
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td className="p-4 font-bold text-gray-900">Total</td>
                <td className="p-4 text-right font-black text-lg">{visitorStats.total}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Page Views Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Article className="text-indigo-600" />
            Page Views ({pageViewStats.total} total, {pageViewStats.today} today)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-bold text-gray-600 text-sm">Page</th>
                <th className="p-4 font-bold text-gray-600 text-sm text-right">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pageViewStats.byPage.map((page, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium">{page.pageName || page.path || '—'}</td>
                  <td className="p-4 text-right font-bold">{page.views}</td>
                </tr>
              ))}
              {pageViewStats.byPage.length === 0 && (
                <tr>
                  <td colSpan="2" className="p-8 text-center text-gray-500">
                    No page view data yet. Views are tracked when users visit pages.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td className="p-4 font-bold text-gray-900">Total</td>
                <td className="p-4 text-right font-black text-lg">{pageViewStats.total}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 6-Week Plan Requests Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CalendarViewMonth className="text-rose-600" />
            6-Week Plan Requests ({sixWeekRequests.length} total)
          </h2>
          <p className="text-sm text-gray-500 mt-1">Paid 6-week programs sent via email</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-bold text-gray-600 text-sm">Email</th>
                <th className="p-4 font-bold text-gray-600 text-sm">Name</th>
                <th className="p-4 font-bold text-gray-600 text-sm">Level</th>
                <th className="p-4 font-bold text-gray-600 text-sm">Max Reps</th>
                <th className="p-4 font-bold text-gray-600 text-sm">H/W</th>
                <th className="p-4 font-bold text-gray-600 text-sm text-right">Payment</th>
                <th className="p-4 font-bold text-gray-600 text-sm text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sixWeekRequests.map((row, idx) => {
                const mr = row.maxReps || {};
                const repsStr = [mr.pullUps, mr.dips, mr.pushUps].map((n) => n ?? '–').join('/');
                const hw = [row.heightCm && `${row.heightCm}cm`, row.weightKg && `${row.weightKg}kg`].filter(Boolean).join(' ') || '–';
                const amt = row.amountPaid != null ? `$${(row.amountPaid / 100).toFixed(2)}` : '—';
                return (
                  <tr key={row._id || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium">{row.email || '—'}</td>
                    <td className="p-4">{row.userName || '—'}</td>
                    <td className="p-4 capitalize">{row.level || '—'}</td>
                    <td className="p-4 text-xs">{repsStr}</td>
                    <td className="p-4 text-xs">{hw}</td>
                    <td className="p-4 text-right font-medium text-green-600">{amt}</td>
                    <td className="p-4 text-right text-sm text-gray-500 whitespace-nowrap">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</td>
                  </tr>
                );
              })}
              {sixWeekRequests.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    No 6-week plan requests yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blog / Guide Clicks Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MenuBook className="text-teal-600" />
            Blog / Guide Clicks ({blogClickStats.totalClicks} total, reach: {blogClickStats.reach} guides)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-bold text-gray-600 text-sm">Guide / Article</th>
                <th className="p-4 font-bold text-gray-600 text-sm text-right">Views (clicks)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {blogClickStats.byGuide.map((guide, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium">{guide.title || guide.slug || '—'}</td>
                  <td className="p-4 text-right font-bold">{guide.clicks}</td>
                </tr>
              ))}
              {blogClickStats.byGuide.length === 0 && (
                <tr>
                  <td colSpan="2" className="p-8 text-center text-gray-500">
                    No blog / guide view data yet. Views are tracked when users open a guide article.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td className="p-4 font-bold text-gray-900">Total</td>
                <td className="p-4 text-right font-black text-lg">{blogClickStats.totalClicks}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Product Clicks Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Visibility className="text-purple-600" />
            Product Clicks ({productClickStats.total} total)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-bold text-gray-600 text-sm">Product Name</th>
                <th className="p-4 font-bold text-gray-600 text-sm text-right">Clicks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {productClickStats.byProduct.map((product, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium">{product.productName}</td>
                  <td className="p-4 text-right font-bold">{product.clicks}</td>
                </tr>
              ))}
              {productClickStats.byProduct.length === 0 && (
                <tr>
                  <td colSpan="2" className="p-8 text-center text-gray-500">
                    No product click data available
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td className="p-4 font-bold text-gray-900">Total</td>
                <td className="p-4 text-right font-black text-lg">{productClickStats.total}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Orders by Product Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="text-green-600" />
            Orders by Product ({orderStats.totalOrders} total orders)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-bold text-gray-600 text-sm">Product Name</th>
                <th className="p-4 font-bold text-gray-600 text-sm text-right">Orders</th>
                <th className="p-4 font-bold text-gray-600 text-sm text-right">Quantity Sold</th>
                <th className="p-4 font-bold text-gray-600 text-sm text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orderStats.byProduct.map((product, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium">{product.productName}</td>
                  <td className="p-4 text-right font-bold">{product.orders}</td>
                  <td className="p-4 text-right">{product.quantity}</td>
                  <td className="p-4 text-right font-bold">{product.revenue.toLocaleString()} DA</td>
                </tr>
              ))}
              {orderStats.byProduct.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    No order data available
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td className="p-4 font-bold text-gray-900">Total</td>
                <td className="p-4 text-right font-black text-lg">{orderStats.totalOrders}</td>
                <td className="p-4 text-right font-black text-lg">
                  {orderStats.byProduct.reduce((sum, p) => sum + p.quantity, 0)}
                </td>
                <td className="p-4 text-right font-black text-lg">{orderStats.total.toLocaleString()} DA</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
