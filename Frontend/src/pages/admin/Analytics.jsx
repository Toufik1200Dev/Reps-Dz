import React, { useState, useEffect } from 'react';
import {
  Assessment,
  Visibility,
  ShoppingCart,
  TrendingUp,
  People,
  LocalShipping
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { getVisitorStats, getProductClickStats } from '../../utils/analytics';

export default function Analytics() {
  const [visitorStats, setVisitorStats] = useState({ daily: [], total: 0, today: 0 });
  const [productClickStats, setProductClickStats] = useState({ byProduct: [], total: 0 });
  const [orderStats, setOrderStats] = useState({ byProduct: [], total: 0, totalOrders: 0 });
  const [loading, setLoading] = useState(true);

  // Fetch orders data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get visitor and click stats from localStorage
        setVisitorStats(getVisitorStats());
        setProductClickStats(getProductClickStats());

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
        <p className="text-gray-500">Track visitors, product clicks, and order statistics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <h3 className="text-3xl font-black font-display mb-1">{productClickStats.total}</h3>
              <p className="text-gray-500">Product Clicks</p>
              <p className="text-xs text-blue-600 mt-1">{productClickStats.byProduct.length} products</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <Visibility />
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
