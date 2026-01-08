import axios from 'axios';

// Create axios instance with base configuration
import API_CONFIG from '../config/api.js';
const API_BASE_URL = API_CONFIG.getBaseURL();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and admin password
api.interceptors.request.use(
  (config) => {
    // Add user auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add admin password header if available (standardized to x-admin-password only)
    // Only if not already set explicitly in config (for admin routes that set it explicitly)
    if (!config.headers['x-admin-password']) {
      const adminPassword = localStorage.getItem('adminPassword');
      if (adminPassword) {
        config.headers['x-admin-password'] = adminPassword.trim();
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle user auth errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Handle admin auth errors - clear password and force re-login
    if (error.response?.status === 403 && error.config?.headers?.['x-admin-password']) {
      localStorage.removeItem('adminPassword');
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle admin auth errors
const handleAdminAuthError = (error) => {
  if (error.response?.status === 403 || error.response?.status === 401) {
    localStorage.removeItem('adminPassword');
    throw new Error('Invalid admin password. Please log in again.');
  }
  throw error;
};

// Auth API
export const authAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  logout: () => api.post('/users/logout'),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  changePassword: (passwordData) => api.put('/users/change-password', passwordData),
  forgotPassword: (email) => api.post('/users/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/users/reset-password', { token, password }),
  verifyEmail: (token) => api.post('/users/verify-email', { token }),
  resendVerification: (email) => api.post('/users/resend-verification', { email }),
};

// Products API
export const productsAPI = {
  // Public routes - use fetch (no auth needed)
  getAllProducts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    try {
      const response = await fetch(`${API_BASE_URL}/products?${queryString}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  },

  getFeaturedProducts: async () => {
    const response = await fetch(`${API_BASE_URL}/products/featured`);
    if (!response.ok) throw new Error('Failed to fetch featured products');
    return response.json();
  },

  getBestOffers: async (limit = 12) => {
    const response = await fetch(`${API_BASE_URL}/products/best-offers?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch best offers');
    return response.json();
  },

  getProductById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    return response.json();
  },

  getProductsByCategory: async (category, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/products/category/${category}?${queryString}`);
    if (!response.ok) throw new Error('Failed to fetch products by category');
    return response.json();
  },

  searchProducts: async (query, params = {}) => {
    const searchParams = new URLSearchParams({ q: query, ...params });
    const response = await fetch(`${API_BASE_URL}/products/search?${searchParams}`);
    if (!response.ok) throw new Error('Failed to search products');
    return response.json();
  },

  getCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/products/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  // Admin routes - explicitly set x-admin-password header for CORS preflight
  create: async (productData) => {
    const adminPassword = localStorage.getItem('adminPassword');
    if (!adminPassword) {
      throw new Error('Admin authentication required. Please log in again.');
    }
    
    const trimmedPassword = adminPassword.trim();
    if (!trimmedPassword) {
      localStorage.removeItem('adminPassword');
      throw new Error('Invalid admin password. Please log in again.');
    }
    
    try {
      // Explicitly set header in config for CORS preflight
      // Content-Type will be set automatically by axios for JSON data
      const config = {
        headers: {
          'x-admin-password': trimmedPassword
        }
      };
      
      const response = await api.post('/products', productData, config);
      return response.data;
    } catch (error) {
      // Log detailed error for debugging
      if (error.response) {
        console.error('Failed to create product:', {
          status: error.response.status,
          data: error.response.data,
          requestUrl: error.config?.url,
          requestMethod: error.config?.method,
          sentHeaders: {
            'x-admin-password': error.config?.headers?.['x-admin-password'] ? 
              `${error.config.headers['x-admin-password'].substring(0, 2)}*** (length: ${error.config.headers['x-admin-password'].length})` : 
              'NOT SET'
          }
        });
        
        if (error.response.status === 403) {
          console.error('Admin auth failed. Check backend logs for password comparison.');
          localStorage.removeItem('adminPassword');
        }
      } else {
        console.error('Failed to create product (no response):', error.message);
      }
      handleAdminAuthError(error);
      throw error;
    }
  },

  update: async (id, productData) => {
    const adminPassword = localStorage.getItem('adminPassword');
    if (!adminPassword) {
      throw new Error('Admin authentication required. Please log in again.');
    }
    
    const trimmedPassword = adminPassword.trim();
    if (!trimmedPassword) {
      throw new Error('Invalid admin password. Please log in again.');
    }
    
    try {
      // Explicitly set header in config for CORS preflight
      // For FormData, axios automatically sets Content-Type - don't set it manually
      const response = await api.put(`/products/${id}`, productData, {
        headers: {
          'x-admin-password': trimmedPassword
        }
      });
      return response.data;
    } catch (error) {
      handleAdminAuthError(error);
      console.error('Failed to update product:', error);
      throw error;
    }
  },

  delete: async (id) => {
    const adminPassword = localStorage.getItem('adminPassword');
    if (!adminPassword) {
      throw new Error('Admin authentication required. Please log in again.');
    }
    
    const trimmedPassword = adminPassword.trim();
    if (!trimmedPassword) {
      throw new Error('Invalid admin password. Please log in again.');
    }
    
    try {
      // Explicitly set header in config for CORS preflight
      const response = await api.delete(`/products/${id}`, {
        headers: {
          'x-admin-password': trimmedPassword
        }
      });
      return response.data;
    } catch (error) {
      handleAdminAuthError(error);
      console.error('Failed to delete product:', error);
      throw error;
    }
  },

  // Upload image to Cloudinary - use axios with FormData
  uploadImage: async (file) => {
    const adminPassword = localStorage.getItem('adminPassword');
    
    if (!adminPassword) {
      alert('❌ Admin authentication required.\n\nPlease log in to the admin panel first.');
      throw new Error('Admin authentication required. Please log in to the admin panel first.');
    }
    
    const trimmedPassword = adminPassword.trim();
    if (!trimmedPassword) {
      alert('🔐 Invalid admin password. Please log in again.');
      localStorage.removeItem('adminPassword');
      throw new Error('Invalid admin password. Please log in again.');
    }
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      // Explicitly set header in config for CORS preflight
      // Axios automatically sets Content-Type to multipart/form-data for FormData - don't set it manually
      const response = await api.post('/upload/image', formData, {
        headers: {
          'x-admin-password': trimmedPassword
        }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        localStorage.removeItem('adminPassword');
        alert('🔐 Invalid admin password. Please log in again.');
        throw new Error('Invalid admin password. Please log in again.');
      }
      console.error('Image upload error:', error);
      throw error;
    }
  }
};

// Admin API (comprehensive admin functions)
export const adminAPI = {
  // Admin Authentication - Verify password with backend
  login: async (password) => {
    try {
      // Trim password before sending
      const trimmedPassword = (password || '').trim();
      
      if (!trimmedPassword) {
        localStorage.removeItem('adminPassword');
        return { success: false, message: 'Password cannot be empty' };
      }
      
      const response = await api.post('/admin/login', { password: trimmedPassword });
      
      if (response.data && response.data.success) {
        // Store trimmed password
        localStorage.setItem('adminPassword', trimmedPassword);
        return { success: true, message: 'Admin logged in successfully' };
      }
      
      localStorage.removeItem('adminPassword');
      return { success: false, message: response.data?.message || 'Invalid password' };
    } catch (error) {
      localStorage.removeItem('adminPassword');
      const message = error.response?.data?.message || error.message || 'Error verifying admin password. Please check your connection.';
      console.error('Admin login error:', message);
      return { success: false, message };
    }
  },
  
  logout: () => {
    localStorage.removeItem('adminPassword');
    return Promise.resolve({ success: true, message: 'Admin logged out successfully' });
  },
  
  // Dashboard - interceptor handles x-admin-password automatically
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getRecentOrders: () => api.get('/admin/dashboard/recent-orders'),
  getTopProducts: () => api.get('/admin/dashboard/top-products'),
  
  // Products Management - use productsAPI methods
  createProduct: (productData) => productsAPI.create(productData),
  updateProduct: (id, productData) => productsAPI.update(id, productData),
  deleteProduct: (id) => productsAPI.delete(id),
  getAllProducts: (params) => api.get('/admin/products', { params }),
  
  // Orders Management - interceptor handles x-admin-password automatically
  getAllOrders: (params) => api.get('/admin/orders', { params }),
  getOrderById: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status, notes, trackingNumber) => 
    api.patch(`/admin/orders/${id}/status`, { status, notes, trackingNumber }),
  updateOrderPayment: (id, paymentData) => api.patch(`/admin/orders/${id}/payment`, paymentData),
  deleteOrder: (id) => api.delete(`/admin/orders/${id}`),
  
  // Customers Management - interceptor handles x-admin-password automatically
  getAllCustomers: (params) => api.get('/admin/customers', { params }),
  getCustomerById: (id) => api.get(`/admin/customers/${id}`),
  updateCustomer: (id, customerData) => api.put(`/admin/customers/${id}`, customerData),
  
  // Analytics - interceptor handles x-admin-password automatically
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  getSalesReport: (params) => api.get('/admin/analytics/sales', { params }),
  getCustomerReport: (params) => api.get('/admin/analytics/customers', { params }),
};

// Orders API (public routes)
export const ordersAPI = {
  createOrder: async (orderData) => {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    if (!response.ok) throw new Error('Failed to create order');
    return response.json();
  },
};

// Delivery API (public routes)
export const deliveryAPI = {
  getWilayas: () => api.get('/delivery/wilayas'),
  getWilayaById: (id) => api.get(`/delivery/wilayas/${id}`),
  getCommunesByWilaya: (wilayaId) => api.get(`/delivery/wilayas/${wilayaId}/communes`),
  calculatePrice: (deliveryData) => api.post('/delivery/calculate', deliveryData),
  getZones: () => api.get('/delivery/zones'),
  searchWilayas: (query) => api.get('/delivery/search', { params: { q: query } }),
  getStats: () => api.get('/delivery/stats'),
};

// Cart API (public routes - uses user token from interceptor)
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (item) => api.post('/cart/add', item),
  update: (itemId, quantity) => api.put(`/cart/${itemId}`, { quantity }),
  remove: (itemId) => api.delete(`/cart/${itemId}`),
  clear: () => api.delete('/cart'),
  sync: (items) => api.post('/cart/sync', { items })
};

// Contact API (public routes)
export const contactAPI = {
  submit: (contactData) => api.post('/contact', contactData),
  getAll: (params) => api.get('/contact', { params }),
  getById: (id) => api.get(`/contact/${id}`),
  update: (id, contactData) => api.put(`/contact/${id}`, contactData),
  delete: (id) => api.delete(`/contact/${id}`),
  markAsRead: (id) => api.patch(`/contact/${id}/read`),
  getStats: () => api.get('/contact/stats'),
};

// Utility functions
export const apiUtils = {
  handleError: (error) => {
    if (error.response) {
      const message = error.response.data?.message || 'An error occurred';
      return { error: true, message };
    } else if (error.request) {
      return { error: true, message: 'Network error. Please check your connection.' };
    } else {
      return { error: true, message: 'An unexpected error occurred.' };
    }
  },

  formatOrderData: (cartItems, shippingInfo, paymentMethod) => {
    const products = cartItems.map(item => ({
      product: item.product._id || item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      image: item.product.images?.[0]?.url || item.product.image
    }));

    const subtotal = products.reduce((total, item) => total + (item.price * item.quantity), 0);
    const deliveryFee = subtotal > 100 ? 0 : 15;
    const total = subtotal + deliveryFee;

    return {
      items: products,
      shippingAddress: {
        firstName: shippingInfo.firstName,
        lastName: shippingInfo.lastName,
        phone: shippingInfo.phone,
        street: shippingInfo.street,
        city: shippingInfo.city,
        state: shippingInfo.state,
        postalCode: shippingInfo.postalCode,
        country: shippingInfo.country,
      },
      delivery: {
        wilaya: shippingInfo.wilaya,
        commune: shippingInfo.commune,
        deliveryPrice: deliveryFee,
        estimatedDays: 3,
      },
      payment: {
        method: paymentMethod,
        status: 'pending',
      },
      subtotal,
      deliveryFee,
      total,
      currency: 'DZD',
    };
  },

  formatProductData: (productData) => {
    return {
      name: productData.name,
      price: parseFloat(productData.price),
      originalPrice: productData.originalPrice ? parseFloat(productData.originalPrice) : undefined,
      description: productData.description,
      category: productData.category,
      images: productData.images || [],
      stockQuantity: parseInt(productData.stockQuantity) || 0,
      inStock: productData.inStock !== undefined ? productData.inStock : true,
      isFeatured: productData.isFeatured || false,
      specifications: productData.specifications || {},
      tags: productData.tags || [],
    };
  },
};

export default api;
