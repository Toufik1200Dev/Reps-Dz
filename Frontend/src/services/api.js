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

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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
  // Get all products with filtering and pagination
  getAllProducts: async (params = {}) => {
    console.log('🚀 Frontend: Fetching products...');
    console.log('🚀 Frontend: Params:', params);
    
    const queryString = new URLSearchParams(params).toString();
    console.log('🚀 Frontend: API URL:', `${API_BASE_URL}/products?${queryString}`);
    
    try {
      console.log('🚀 Frontend: Sending request...');
      const response = await fetch(`${API_BASE_URL}/products?${queryString}`);

      console.log('🚀 Frontend: Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Frontend: Products fetch failed:', errorText);
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Frontend: Products fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Frontend: Products fetch error:', error);
      throw error;
    }
  },

  // Get featured products
  getFeaturedProducts: async () => {
    const response = await fetch(`${API_BASE_URL}/products/featured`);
    if (!response.ok) throw new Error('Failed to fetch featured products');
    return response.json();
  },

  // Get best offers (products with discounts)
  getBestOffers: async (limit = 12) => {
    const response = await fetch(`${API_BASE_URL}/products/best-offers?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch best offers');
    return response.json();
  },

  // Get single product by ID
  getProductById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    return response.json();
  },

  // Get products by category
  getProductsByCategory: async (category, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/products/category/${category}?${queryString}`);
    if (!response.ok) throw new Error('Failed to fetch products by category');
    return response.json();
  },

  // Search products
  searchProducts: async (query, params = {}) => {
    const searchParams = new URLSearchParams({ q: query, ...params });
    const response = await fetch(`${API_BASE_URL}/products/search?${searchParams}`);
    if (!response.ok) throw new Error('Failed to search products');
    return response.json();
  },

  // Get product categories
  getCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/products/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  // Create new product
  create: async (productData) => {
    // Check if productData is FormData, if so, let axios handle headers
    const isFormData = productData instanceof FormData;
    // Axios automatically sets 'Content-Type: multipart/form-data' for FormData
    // For JSON, the default 'application/json' from the axios instance is used.
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await api.post('/products', productData, config);
    return response.data;
  },

  // Update existing product
  update: async (id, productData) => {
    // Check if productData is FormData
    const isFormData = productData instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await api.put(`/products/${id}`, productData, config);
    return response.data;
  },

  // Delete product
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete product');
    return response.json();
  },

  // Upload image to Cloudinary
  uploadImage: async (file) => {
    console.log('🚀 Frontend: Starting image upload...');
    console.log('🚀 Frontend: File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    // Get admin password from localStorage
    const adminPassword = localStorage.getItem('adminPassword');
    
    if (!adminPassword) {
      console.error('❌ No admin password found in localStorage!');
      throw new Error('Admin authentication required. Please log in to the admin panel first.');
    }
    
    // Verify password is still valid before uploading
    console.log('🔐 Verifying admin password before upload...');
    console.log('   Password length:', adminPassword.length);
    console.log('   Password ends with:', adminPassword.substring(adminPassword.length - 2));
    
    try {
      const verifyResponse = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      });
      
      const verifyData = await verifyResponse.json();
      console.log('🔐 Verification response:', verifyData);
      
      if (!verifyData.success) {
        console.error('❌ Stored password is invalid! Clearing localStorage...');
        localStorage.removeItem('adminPassword');
        throw new Error('Your admin session has expired or the password changed. Please log in again.');
      }
      
      console.log('✅ Admin password verified, proceeding with upload...');
    } catch (verifyError) {
      console.error('❌ Password verification failed:', verifyError);
      if (verifyError.message.includes('session has expired') || verifyError.message.includes('password changed')) {
        throw verifyError;
      }
      console.warn('⚠️ Could not verify password, but proceeding with upload anyway...');
      // Don't throw - let the upload attempt happen so we can see the actual error
    }
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      console.log('🚀 Frontend: Sending upload request...');
      
      // Use Headers API to properly set custom headers with FormData
      const headers = new Headers();
      headers.append('adminpassword', adminPassword);
      headers.append('AdminPassword', adminPassword);
      headers.append('adminPassword', adminPassword);
      
      console.log('🚀 Frontend: Upload headers prepared');
      console.log('   Password being sent:', adminPassword.substring(0, 2) + '***' + adminPassword.substring(adminPassword.length - 2));
      console.log('   Password length:', adminPassword.length);
      
      // Log all headers being sent
      const headersObj = {};
      headers.forEach((value, key) => {
        if (key.toLowerCase().includes('password')) {
          headersObj[key] = value.substring(0, 2) + '***' + value.substring(value.length - 2);
        } else {
          headersObj[key] = value;
        }
      });
      console.log('   Headers being sent:', headersObj);
      
      const response = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      console.log('🚀 Frontend: Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ Frontend: Upload failed:', errorData);
        console.error('❌ Response status:', response.status);
        console.error('❌ Error message:', errorData.message);
        
        if (response.status === 403 || response.status === 401) {
          // Authentication error - clear stored password and prompt re-login
          console.error('❌ Authentication failed - clearing stored password');
          localStorage.removeItem('adminPassword');
          
          // Try to get more info about what went wrong
          const errorMsg = errorData.message || 'Authentication failed';
          throw new Error(`${errorMsg}. Your stored password doesn't match the server. Please go to the admin login page and log in again with the correct password from Render environment variables.`);
        }
        
        throw new Error(errorData.message || `Failed to upload image: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Frontend: Upload successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Frontend: Upload error:', error);
      throw error;
    }
  }
};

// Admin API (comprehensive admin functions)
export const adminAPI = {
  // Admin Authentication - Verify password with backend (NO FALLBACK)
  login: async (password) => {
    try {
      console.log('🔐 Attempting admin login with backend...');
      console.log('   Password provided:', password ? `***${password.substring(password.length - 2)}` : 'empty');
      
      const response = await api.post('/admin/login', { password });
      console.log('📡 Admin login response:', response.data);
      
      if (response.data && response.data.success) {
        // Store admin password in localStorage for future requests
        localStorage.setItem('adminPassword', password);
        console.log('✅ Admin login successful - password stored');
        return { success: true, message: 'Admin logged in successfully' };
      }
      
      console.log('❌ Admin login failed:', response.data?.message);
      // Clear any old password on failure
      localStorage.removeItem('adminPassword');
      return { success: false, message: response.data?.message || 'Invalid password' };
    } catch (error) {
      console.error('❌ Admin login API error:', error);
      console.error('   Error response:', error.response?.data);
      console.error('   Error status:', error.response?.status);
      
      // Clear password on API error (don't allow old passwords)
      localStorage.removeItem('adminPassword');
      
      const message = error.response?.data?.message || error.message || 'Error verifying admin password. Please check your connection.';
      return { success: false, message };
    }
  },
  
  logout: () => {
    // Remove admin password from localStorage
    localStorage.removeItem('adminPassword');
    return Promise.resolve({ success: true, message: 'Admin logged out successfully' });
  },
  
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getRecentOrders: () => api.get('/admin/dashboard/recent-orders'),
  getTopProducts: () => api.get('/admin/dashboard/top-products'),
  
  // Products Management
  createProduct: async (productData) => {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(productData)
    });
    if (!response.ok) throw new Error('Failed to create product');
    return response.json();
  },

  updateProduct: async (id, productData) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(productData)
    });
    if (!response.ok) throw new Error('Failed to update product');
    return response.json();
  },

  deleteProduct: async (id) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete product');
    return response.json();
  },

  getAllProducts: (params) => api.get('/admin/products', { params }),
  
  // Orders Management
  getAllOrders: (params) => api.get('/admin/orders', { params }),
  getOrderById: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { status }),
  updateOrderPayment: (id, paymentData) => api.patch(`/admin/orders/${id}/payment`, paymentData),
  
  // Customers Management
  getAllCustomers: (params) => api.get('/admin/customers', { params }),
  getCustomerById: (id) => api.get(`/admin/customers/${id}`),
  updateCustomer: (id, customerData) => api.put(`/admin/customers/${id}`, customerData),
  
  // Analytics
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  getSalesReport: (params) => api.get('/admin/analytics/sales', { params }),
  getCustomerReport: (params) => api.get('/admin/analytics/customers', { params }),
};

// Orders API
export const ordersAPI = {
  // Create order
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

  // Get all orders (admin)
  getAllOrders: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/orders`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  },

  // Get order by ID (admin)
  getOrderById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch order');
    return response.json();
  },

  // Update order status (admin)
  updateOrderStatus: async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update order status');
    return response.json();
  },

  // Delete order (admin)
  deleteOrder: async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete order');
    return response.json();
  }
};

// Delivery API
export const deliveryAPI = {
  getWilayas: () => api.get('/delivery/wilayas'),
  getWilayaById: (id) => api.get(`/delivery/wilayas/${id}`),
  getCommunesByWilaya: (wilayaId) => api.get(`/delivery/wilayas/${wilayaId}/communes`),
  calculatePrice: (deliveryData) => api.post('/delivery/calculate', deliveryData),
  getZones: () => api.get('/delivery/zones'),
  searchWilayas: (query) => api.get('/delivery/search', { params: { q: query } }),
  getStats: () => api.get('/delivery/stats'),
};

// Cart API
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (item) => api.post('/cart/add', item),
  update: (itemId, quantity) => api.put(`/cart/${itemId}`, { quantity }),
  remove: (itemId) => api.delete(`/cart/${itemId}`),
  clear: () => api.delete('/cart'),
  sync: (items) => api.post('/cart/sync', { items })
};

// Contact API
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
  // Handle API errors
  handleError: (error) => {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'An error occurred';
      return { error: true, message };
    } else if (error.request) {
      // Request was made but no response received
      return { error: true, message: 'Network error. Please check your connection.' };
    } else {
      // Something else happened
      return { error: true, message: 'An unexpected error occurred.' };
    }
  },

  // Format order data for API
  formatOrderData: (cartItems, shippingInfo, paymentMethod) => {
    const products = cartItems.map(item => ({
        product: item.product._id || item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        size: item.size,    // Add size
        color: item.color,  // Add color
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

  // Format product data for API
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

// Helper function to get admin authentication headers
function getAuthHeaders() {
  // Get admin password from localStorage
  const adminPassword = localStorage.getItem('adminPassword');
  
  if (!adminPassword) {
    console.warn('⚠️ Admin password not found in localStorage. Please log in as admin first.');
    return {};
  }
  
  // Send as 'adminpassword' header (lowercase as per backend expectation)
  // Also send as 'AdminPassword' and 'adminPassword' for compatibility
  return { 
    'adminpassword': adminPassword,
    'AdminPassword': adminPassword,
    'adminPassword': adminPassword
  };
}
