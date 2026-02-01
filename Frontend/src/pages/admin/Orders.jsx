import React, { useState, useEffect } from 'react';
import {
  Edit,
  Delete,
  Visibility,
  Search,
  FilterList,
  Clear,
  LocalShipping,
  Payment,
  Person,
  CalendarToday,
  AttachMoney,
  ShoppingCart,
  Close
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200'
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch orders from API using axios (interceptor handles x-admin-password)
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllOrders();
      // Backend returns { success: true, data: { orders: [...], pagination: {...} } }
      // Axios wraps it, so we need response.data.data.orders
      setOrders(response.data?.data?.orders || response.data?.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' ||
      order.customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.phone.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle order status update using axios (interceptor handles x-admin-password)
  const handleStatusUpdate = async (orderId, newStatus, notes, trackingNumber) => {
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus, notes, trackingNumber);

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId
            ? { ...order, status: newStatus, notes, trackingNumber }
            : order
        )
      );

      setSnackbar({ open: true, message: 'Order updated successfully!', severity: 'success' });
      setEditDialogOpen(false);
      setSelectedOrder(null);
    } catch (err) {
      console.error('Error updating order:', err);
      setSnackbar({ open: true, message: `Failed to update order: ${err.message}`, severity: 'error' });
    }
  };

  // Handle order deletion using axios (interceptor handles x-admin-password)
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;

    try {
      await adminAPI.deleteOrder(orderId);
      setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
      setSnackbar({ open: true, message: 'Order deleted successfully!', severity: 'success' });
    } catch (err) {
      console.error('Error deleting order:', err);
      setSnackbar({ open: true, message: `Failed to delete order: ${err.message}`, severity: 'error' });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading orders...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-black mb-2">Orders Management</h1>
        <p className="text-gray-500">Manage customer orders, update status, and track deliveries</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-black font-display mb-1">{orders.length}</h3>
              <p className="text-gray-500">Total Orders</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-100 text-gray-600">
              <ShoppingCart />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-black font-display mb-1 text-green-600">
                {orders.filter(o => o.status === 'delivered').length}
              </h3>
              <p className="text-gray-500">Delivered</p>
            </div>
            <div className="p-3 rounded-xl bg-green-50 text-green-600">
              <LocalShipping />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-black font-display mb-1 text-blue-600">
                {orders.filter(o => o.status === 'shipped').length}
              </h3>
              <p className="text-gray-500">In Transit</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <LocalShipping />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-black font-display mb-1 text-secondary">
                {orders.reduce((total, order) => total + order.totalAmount, 0).toLocaleString()} DA
              </h3>
              <p className="text-gray-500">Total Revenue</p>
            </div>
            <div className="p-3 rounded-xl bg-yellow-50 text-yellow-600">
              <AttachMoney />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
          />
        </div>
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary appearance-none bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button
          onClick={clearFilters}
          className="px-4 py-2 text-red-500 font-bold hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
        >
          <Clear fontSize="small" /> Clear
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-bold text-gray-600 text-sm">Order ID</th>
                <th className="p-4 font-bold text-gray-600 text-sm">Customer</th>
                <th className="p-4 font-bold text-gray-600 text-sm">Products</th>
                <th className="p-4 font-bold text-gray-600 text-sm">Total</th>
                <th className="p-4 font-bold text-gray-600 text-sm">Status</th>
                <th className="p-4 font-bold text-gray-600 text-sm">Date</th>
                <th className="p-4 font-bold text-gray-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono text-sm text-gray-500">
                    #{order._id.toString().slice(-8).toUpperCase()}
                  </td>
                  <td className="p-4">
                    <div className="font-bold">{order.customer.fullName}</div>
                    <div className="text-xs text-gray-500">{order.customer.phone}</div>
                    <div className="text-xs text-gray-400">{order.customer.wilaya}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      {order.products.map((product, idx) => (
                        <div key={idx} className="text-sm">
                          {product.name} <span className="text-gray-500">x{product.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 font-bold">
                    {order.totalAmount.toFixed(2)} DA
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setSelectedOrder(order); setViewDialogOpen(true); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors" title="View Details">
                        <Visibility fontSize="small" />
                      </button>
                      <button onClick={() => { setSelectedOrder(order); setEditDialogOpen(true); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-green-600 transition-colors" title="Edit Status">
                        <Edit fontSize="small" />
                      </button>
                      <button onClick={() => handleDeleteOrder(order._id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors" title="Delete">
                        <Delete fontSize="small" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    No orders found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dialog */}
      <AnimatePresence>
        {editDialogOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditDialogOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden z-10"
            >
              <h2 className="text-2xl font-bold mb-6">Update Order Status</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Status</label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, status: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Tracking Number</label>
                  <input
                    type="text"
                    value={selectedOrder.trackingNumber || ''}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, trackingNumber: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Notes</label>
                  <textarea
                    rows="3"
                    value={selectedOrder.notes || ''}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, notes: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditDialogOpen(false)}
                    className="flex-1 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder._id, selectedOrder.status, selectedOrder.notes, selectedOrder.trackingNumber)}
                    className="flex-1 py-3 bg-black text-secondary rounded-lg font-bold hover:bg-gray-900 transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Dialog */}
      <AnimatePresence>
        {viewDialogOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewDialogOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 overflow-hidden z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Order Details</h2>
                <button onClick={() => setViewDialogOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <Close />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-lg mb-3 pb-2 border-b border-gray-100">Customer Info</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-bold">Name:</span> {selectedOrder.customer.fullName}</p>
                    <p><span className="font-bold">Phone:</span> {selectedOrder.customer.phone}</p>
                    <p><span className="font-bold">Wilaya:</span> {selectedOrder.customer.wilaya}</p>
                    <p><span className="font-bold">Address:</span> {selectedOrder.customer.address}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-3 pb-2 border-b border-gray-100">Order Info</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-bold">Order ID:</span> #{selectedOrder._id.toString().slice(-8).toUpperCase()}</p>
                    <p className="flex items-center gap-2">
                      <span className="font-bold">Status:</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${statusColors[selectedOrder.status]}`}>
                        {selectedOrder.status}
                      </span>
                    </p>
                    <p><span className="font-bold">Date:</span> {new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
                    <p><span className="font-bold">Payment:</span> {selectedOrder.paymentMethod}</p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h3 className="font-bold text-lg mb-3 pb-2 border-b border-gray-100">Products</h3>
                  <div className="space-y-3">
                    {selectedOrder.products.map((product, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <div>
                          <p className="font-bold text-sm">{product.name}</p>
                          <p className="text-xs text-gray-500">Qty: {product.quantity}</p>
                        </div>
                        <p className="font-bold font-mono">{(product.price * product.quantity).toFixed(2)} DA</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="bg-black text-secondary p-4 rounded-xl flex justify-between items-center shadow-lg">
                    <span className="font-bold text-lg">Total Amount</span>
                    <span className="font-display font-black text-2xl">{selectedOrder.totalAmount.toFixed(2)} DA</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Snackbar Notification */}
      <AnimatePresence>
        {snackbar.open && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl z-50 text-white font-bold ${snackbar.severity === 'success' ? 'bg-green-600' : 'bg-red-600'
              }`}
          >
            {snackbar.message}
            <button onClick={() => setSnackbar({ ...snackbar, open: false })} className="ml-4 opacity-75 hover:opacity-100">
              <Close fontSize="small" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
