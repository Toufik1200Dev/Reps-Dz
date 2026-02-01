import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingBag, LocalShipping, CheckCircle, Close } from '@mui/icons-material';
import { ordersAPI } from '../services/api';
import { wilayas } from '../data/wilayas';
import { PLACEHOLDER_IMAGE } from '../assets/placeholders';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

// Color name to hex mapping
const getColorValue = (colorName) => {
  const colorMap = {
    'red': '#EF4444',
    'blue': '#3B82F6',
    'green': '#10B981',
    'yellow': '#FBBF24',
    'orange': '#F97316',
    'purple': '#A855F7',
    'pink': '#EC4899',
    'black': '#000000',
    'white': '#FFFFFF',
    'gray': '#6B7280',
    'grey': '#6B7280',
    'brown': '#92400E',
    'navy': '#1E3A8A',
    'teal': '#14B8A6',
    'cyan': '#06B6D4',
    'lime': '#84CC16',
    'indigo': '#6366F1',
    'violet': '#8B5CF6',
    'fuchsia': '#D946EF',
    'rose': '#F43F5E',
    'amber': '#F59E0B',
    'emerald': '#10B981',
    'sky': '#0EA5E9',
    'slate': '#64748B',
  };
  
  const normalizedColor = colorName?.toLowerCase().trim();
  return colorMap[normalizedColor] || '#6B7280'; // Default to gray if not found
};

export default function Order() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const { t } = useLanguage();
  
  // Get product data from location state - support both single product (Buy Now) and cart items (Cart checkout)
  const { product: initialProduct, quantity: initialQuantity = 1, size: initialSize = null, color: initialColor = null, cartItems: initialCartItems } = location.state || {};
  
  // Determine if this is a cart checkout or single product order
  const isCartCheckout = !!initialCartItems && initialCartItems.length > 0;
  const orderItems = isCartCheckout ? initialCartItems : (initialProduct ? [{
    ...initialProduct,
    quantity: initialQuantity,
    size: initialSize,
    color: initialColor
  }] : []);
  
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState(null);
  
  // Product options state (only for single product Buy Now)
  const [quantity, setQuantity] = useState(initialQuantity);
  const [selectedSize, setSelectedSize] = useState(initialSize);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  
  // Client data state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    deliveryType: 'home', // home or stop_desk
    wilaya: '',
    commune: '',
    exactAddress: '' // optional
  });

  // Redirect if no product/cart data
  useEffect(() => {
    if (!initialProduct && !isCartCheckout) {
      navigate('/shop');
    }
  }, [initialProduct, isCartCheckout, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const selectedWilayaData = wilayas.find(w => w.id === formData.wilaya);
  const availableCommunes = selectedWilayaData?.communes || [];
  
  // Calculate delivery price based on delivery type
  const getDeliveryPrice = () => {
    if (!selectedWilayaData) return 0;
    const basePrice = selectedWilayaData.deliveryPrice || 0;
    if (formData.deliveryType === 'stop_desk') {
      return Math.round(basePrice * 0.7); // 30% less for stop desk
    }
    return basePrice; // Full price for home delivery
  };

  const deliveryPrice = getDeliveryPrice();

  // Helper function to calculate final price with discount
  const getFinalPrice = (product) => {
    const basePrice = parseFloat(product.price) || 0;
    const discountPct = parseFloat(product.discount) || 0;
    const computedFinalPrice = discountPct > 0 ? basePrice * (1 - discountPct / 100) : basePrice;
    return parseFloat(product.finalPrice ?? computedFinalPrice) || basePrice;
  };

  const calculateSubtotal = () => {
    if (isCartCheckout) {
      return orderItems.reduce((total, item) => {
        const finalPrice = getFinalPrice(item);
        const qty = item.quantity || 1;
        return total + (finalPrice * qty);
      }, 0);
    }
    if (!initialProduct) return 0;
    const finalPrice = getFinalPrice(initialProduct);
    return finalPrice * quantity;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + deliveryPrice;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName || !formData.phone || !formData.commune || !formData.wilaya) {
      setError(t('order.fillRequired') || 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const wilayaName = selectedWilayaData?.name || formData.wilaya;
      const fullAddress = formData.exactAddress 
        ? `${formData.exactAddress}, ${formData.commune}, ${wilayaName}`
        : `${formData.commune}, ${wilayaName}`;

      // Format products for order
      const products = isCartCheckout 
        ? orderItems.map(item => ({
            product: item.id || item._id || item.productId,
            name: item.name,
            price: getFinalPrice(item), // Use discounted price
            originalPrice: parseFloat(item.price) || 0, // Store original for reference
            discount: parseFloat(item.discount) || 0,
            quantity: item.quantity || 1,
            size: item.size || null,
            color: item.color || null,
            image: item.image || item.images?.main || item.images?.[0]?.url || item.images?.[0] || PLACEHOLDER_IMAGE
          }))
        : [{
            product: initialProduct._id || initialProduct.id,
            name: initialProduct.name,
            price: getFinalPrice(initialProduct), // Use discounted price
            originalPrice: parseFloat(initialProduct.price) || 0, // Store original for reference
            discount: parseFloat(initialProduct.discount) || 0,
            quantity: quantity,
            size: selectedSize,
            color: selectedColor,
            image: initialProduct.images?.main || initialProduct.image
          }];

      const orderData = {
        customer: {
          fullName: formData.fullName,
          phone: formData.phone,
          address: fullAddress,
          wilaya: wilayaName,
          commune: formData.commune
        },
        products: products,
        paymentMethod: 'cash_on_delivery',
        orderTotal: calculateSubtotal(),
        shippingCost: deliveryPrice,
        tax: 0,
        totalAmount: calculateTotal()
      };

      await ordersAPI.createOrder(orderData);
      
      // Clear cart if this was a cart checkout
      if (isCartCheckout) {
        clearCart();
      }
      
      setShowSuccessModal(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err) {
      console.error("Order failed", err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!initialProduct && !isCartCheckout) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors"
          >
            <ArrowLeft />
            <span className="font-medium">{t('common.back')}</span>
          </button>

          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{t('order.title')}</h1>
            <p className="text-sm md:text-base text-gray-600">{t('order.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2">
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Section 1: Product Details */}
                <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 lg:p-8">
                  <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="text-blue-600 text-lg md:text-xl" />
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">{t('order.productDetails')}</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Cart Items (for cart checkout) or Single Product (for Buy Now) */}
                    {isCartCheckout ? (
                      // Show all cart items
                      <div className="space-y-4">
                        {orderItems.map((item, idx) => {
                          const itemImage = item.image || item.images?.main || item.images?.[0]?.url || item.images?.[0] || PLACEHOLDER_IMAGE;
                          const basePrice = parseFloat(item.price) || 0;
                          const discountPct = parseFloat(item.discount) || 0;
                          const finalPrice = getFinalPrice(item);
                          const hasDiscount = discountPct > 0 && finalPrice < basePrice;
                          const itemQty = item.quantity || 1;
                          
                          return (
                            <div key={idx} className="flex gap-3 md:gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                              <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg md:rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                <img
                                  src={itemImage}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base md:text-lg text-gray-900 mb-1 md:mb-2 line-clamp-2">{item.name}</h3>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {item.size && (
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{t('product.size')}: {item.size}</span>
                                  )}
                                  {item.color && (
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{t('product.color')}: {item.color}</span>
                                  )}
                                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{t('product.quantity')}: {itemQty}</span>
                                </div>
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <div className="flex items-baseline gap-2">
                                    <p className="text-xl md:text-2xl font-black text-gray-900">{(finalPrice * itemQty).toLocaleString()} DA</p>
                                    {hasDiscount && (
                                      <>
                                        <span className="text-sm text-gray-400 line-through">{(basePrice * itemQty).toLocaleString()} DA</span>
                                        <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">-{discountPct}%</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Single product with quantity/size/color selection
                      <>
                        {/* Product Image and Name */}
                        <div className="flex gap-3 md:gap-4 pb-4 md:pb-6 border-b border-gray-100">
                          <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg md:rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                            <img
                              src={initialProduct.images?.main || initialProduct.image || PLACEHOLDER_IMAGE}
                              alt={initialProduct.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base md:text-lg text-gray-900 mb-1 md:mb-2 line-clamp-2">{initialProduct.name}</h3>
                            {(() => {
                              const basePrice = parseFloat(initialProduct.price) || 0;
                              const discountPct = parseFloat(initialProduct.discount) || 0;
                              const finalPrice = getFinalPrice(initialProduct);
                              const hasDiscount = discountPct > 0 && finalPrice < basePrice;
                              
                              return (
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <div className="flex items-baseline gap-2">
                                    <p className="text-xl md:text-2xl font-black text-gray-900">{finalPrice.toLocaleString()} DA</p>
                                    {hasDiscount && (
                                      <>
                                        <span className="text-sm md:text-base text-gray-400 line-through">{basePrice.toLocaleString()} DA</span>
                                        <span className="text-xs md:text-sm font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">-{discountPct}%</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Quantity */}
                        <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          {t('product.quantity')} <span className="text-red-500">{t('order.required')}</span>
                        </label>
                          <div className="flex items-center border border-gray-200 rounded-xl bg-white w-max">
                            <button
                              type="button"
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              className="px-4 py-3 hover:bg-gray-50 text-gray-600 transition-colors rounded-l-xl"
                            >
                              −
                            </button>
                            <span className="w-16 text-center font-bold text-gray-900">{quantity}</span>
                            <button
                              type="button"
                              onClick={() => setQuantity(quantity + 1)}
                              className="px-4 py-3 hover:bg-gray-50 text-gray-600 transition-colors rounded-r-xl"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Size Selection */}
                        {initialProduct.variants?.sizes && initialProduct.variants.sizes.length > 0 && (
                          <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          {t('product.size')}
                        </label>
                            <div className="flex flex-wrap gap-3">
                              {initialProduct.variants.sizes.map((size) => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => setSelectedSize(size)}
                                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                                    selectedSize === size
                                      ? 'border-yellow-500 bg-yellow-50 text-yellow-900'
                                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                  }`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Color Selection */}
                        {initialProduct.variants?.colors && initialProduct.variants.colors.length > 0 && (
                          <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          {t('product.color')}
                        </label>
                            <div className="flex flex-wrap gap-3">
                              {initialProduct.variants.colors.map((color) => {
                                const colorValue = getColorValue(color);
                                const isSelected = selectedColor === color;
                                const isLightColor = color.toLowerCase() === 'white' || color.toLowerCase() === 'yellow';
                                
                                return (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => setSelectedColor(color)}
                                    style={{
                                      backgroundColor: colorValue,
                                      borderColor: colorValue,
                                      borderWidth: '2px',
                                      borderStyle: 'solid',
                                      color: isLightColor ? '#000000' : '#FFFFFF',
                                      boxShadow: isSelected ? `0 0 0 3px rgba(251, 191, 36, 0.3)` : 'none'
                                    }}
                                    className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80"
                                  >
                                    {color}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Section 2: Client Data */}
                <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 lg:p-8">
                  <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <LocalShipping className="text-green-600 text-lg md:text-xl" />
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">{t('order.clientInfo')}</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {t('order.fullName')} <span className="text-red-500">{t('order.required')}</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                        placeholder={t('order.fullName')}
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {t('order.phone')} <span className="text-red-500">{t('order.required')}</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                        placeholder="+213 XXX XXX XXX"
                      />
                    </div>

                    {/* Delivery Type */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">
                        {t('order.deliveryType')} <span className="text-red-500">{t('order.required')}</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.deliveryType === 'home'
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <input
                            type="radio"
                            name="deliveryType"
                            value="home"
                            checked={formData.deliveryType === 'home'}
                            onChange={handleChange}
                            className="w-5 h-5 text-yellow-500 focus:ring-yellow-500 mr-3"
                          />
                          <div>
                            <div className="font-bold text-gray-900">{t('order.deliveryHome')}</div>
                            <div className="text-xs text-gray-500">{t('order.deliveryHomeDesc')}</div>
                          </div>
                        </label>

                        <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.deliveryType === 'stop_desk'
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <input
                            type="radio"
                            name="deliveryType"
                            value="stop_desk"
                            checked={formData.deliveryType === 'stop_desk'}
                            onChange={handleChange}
                            className="w-5 h-5 text-yellow-500 focus:ring-yellow-500 mr-3"
                          />
                          <div>
                            <div className="font-bold text-gray-900">{t('order.deliveryStopDesk')}</div>
                            <div className="text-xs text-gray-500">{t('order.deliveryStopDeskDesc')}</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Wilaya */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {t('order.wilaya')} <span className="text-red-500">{t('order.required')}</span>
                      </label>
                      <select
                        name="wilaya"
                        value={formData.wilaya}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all bg-white"
                      >
                        <option value="">{t('order.selectWilaya')}</option>
                        {wilayas.map(wilaya => (
                          <option key={wilaya.id} value={wilaya.id}>
                            {wilaya.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Commune */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {t('order.commune')} <span className="text-red-500">{t('order.required')}</span>
                      </label>
                      <select
                        name="commune"
                        value={formData.commune}
                        onChange={handleChange}
                        required
                        disabled={!formData.wilaya}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                      >
                        <option value="">{t('order.selectCommune')}</option>
                        {availableCommunes.map(commune => (
                          <option key={commune} value={commune}>
                            {commune}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {t('order.exactAddress')}
                      </label>
                      <textarea
                        name="exactAddress"
                        value={formData.exactAddress}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all resize-none"
                        placeholder={t('order.exactAddressPlaceholder')}
                      />
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 md:py-4 px-6 md:px-8 rounded-xl transition-all transform active:scale-95 shadow-lg shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-lg"
                >
                        {loading ? t('order.processing') : t('order.placeOrder')}
                </button>
              </motion.form>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1 order-first lg:order-last">
              <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 lg:sticky lg:top-24">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">{t('order.orderSummary')}</h3>

                {/* Products */}
                <div className="space-y-4 mb-4 md:mb-6 pb-4 md:pb-6 border-b border-gray-100 max-h-64 overflow-y-auto">
                  {isCartCheckout ? (
                    // Show all cart items
                    orderItems.map((item, idx) => {
                      const itemImage = item.image || item.images?.main || item.images?.[0]?.url || item.images?.[0] || PLACEHOLDER_IMAGE;
                      const basePrice = parseFloat(item.price) || 0;
                      const discountPct = parseFloat(item.discount) || 0;
                      const finalPrice = getFinalPrice(item);
                      const hasDiscount = discountPct > 0 && finalPrice < basePrice;
                      const itemQty = item.quantity || 1;
                      
                      return (
                        <div key={idx} className="flex gap-3">
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg md:rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                            <img
                              src={itemImage}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm md:text-base text-gray-900 mb-1 line-clamp-2">{item.name}</h4>
                        <p className="text-xs md:text-sm text-gray-500 mb-1">{t('product.quantity')}: {itemQty}</p>
                        {item.size && <p className="text-xs md:text-sm text-gray-500 mb-1">{t('product.size')}: {item.size}</p>}
                        {item.color && <p className="text-xs md:text-sm text-gray-500 mb-1">{t('product.color')}: {item.color}</p>}
                            <div className="flex items-baseline gap-2 flex-wrap mt-1">
                              <div className="flex items-baseline gap-1.5">
                                <p className="text-xs md:text-sm font-bold text-gray-900">{(finalPrice * itemQty).toLocaleString()} DA</p>
                                {hasDiscount && (
                                  <>
                                    <span className="text-[10px] md:text-xs text-gray-400 line-through">{(basePrice * itemQty).toLocaleString()} DA</span>
                                    <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">-{discountPct}%</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // Single product
                    <div className="flex gap-3 md:gap-4">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg md:rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={initialProduct.images?.main || initialProduct.image || PLACEHOLDER_IMAGE}
                          alt={initialProduct.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm md:text-base text-gray-900 mb-1 line-clamp-2">{initialProduct.name}</h4>
                        <p className="text-xs md:text-sm text-gray-500 mb-1">{t('product.quantity')}: {quantity}</p>
                        {selectedSize && <p className="text-xs md:text-sm text-gray-500 mb-1">{t('product.size')}: {selectedSize}</p>}
                        {selectedColor && <p className="text-xs md:text-sm text-gray-500 mb-1">{t('product.color')}: {selectedColor}</p>}
                        {(() => {
                          const basePrice = parseFloat(initialProduct.price) || 0;
                          const discountPct = parseFloat(initialProduct.discount) || 0;
                          const finalPrice = getFinalPrice(initialProduct);
                          const hasDiscount = discountPct > 0 && finalPrice < basePrice;
                          
                          return (
                            <div className="flex items-baseline gap-2 flex-wrap mt-1">
                              <div className="flex items-baseline gap-1.5">
                                <p className="text-xs md:text-sm font-bold text-gray-900">{(finalPrice * quantity).toLocaleString()} DA</p>
                                {hasDiscount && (
                                  <>
                                    <span className="text-[10px] md:text-xs text-gray-400 line-through">{(basePrice * quantity).toLocaleString()} DA</span>
                                    <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">-{discountPct}%</span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>{t('cart.subtotal')}</span>
                    <span className="font-medium">{calculateSubtotal().toLocaleString()} DA</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{t('order.delivery')} ({formData.deliveryType === 'stop_desk' ? t('order.deliveryStopDesk') : t('order.deliveryHome')})</span>
                    <span className="font-medium">
                      {deliveryPrice === 0 ? t('cart.freeShipping') : `${deliveryPrice.toLocaleString()} DA`}
                    </span>
                  </div>
                  <div className="pt-3 md:pt-4 border-t-2 border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-base md:text-lg font-bold text-gray-900">{t('cart.total')}</span>
                      <span className="text-xl md:text-2xl font-black text-gray-900">
                        {calculateTotal().toLocaleString()} DA
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-yellow-800">
                    <span className="font-bold">{t('order.note')}</span> {t('order.noteText')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => navigate('/')}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl md:rounded-2xl shadow-xl p-6 md:p-8 max-w-md w-full mx-4 text-center relative"
              >
                <button
                  onClick={() => navigate('/')}
                  className="absolute top-3 right-3 md:top-4 md:right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close className="text-lg md:text-xl" />
                </button>
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="w-16 h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6"
                >
                  <CheckCircle className="text-green-600 text-4xl md:text-5xl" />
                </motion.div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">{t('order.confirmed')}</h2>
                <p className="text-sm md:text-base text-gray-600 mb-2">
                  {isCartCheckout 
                    ? `${t('order.successMultiple')} ${orderItems.length} ${orderItems.length > 1 ? t('order.successItemsPlural') : t('order.successItems')} ${t('order.successEnd')}`
                    : <>{t('order.successSingle')} <span className="font-bold">{initialProduct.name}</span> {t('order.successEnd')}</>
                  }
                </p>
                <p className="text-xs md:text-sm text-gray-500 mt-4">
                  {t('order.redirecting')}
                </p>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
