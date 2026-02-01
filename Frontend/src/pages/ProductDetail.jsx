import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { productsAPI, ordersAPI } from '../services/api';
import { PLACEHOLDER_IMAGE } from '../assets/placeholders';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LocalShipping, CheckCircle, Close, ShoppingBag } from '@mui/icons-material';
import { wilayas } from '../data/wilayas';

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

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  // Order Form State
  const [showOrderForm, setShowOrderForm] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    deliveryType: 'home', // home or stop_desk
    wilaya: '',
    commune: '',
    exactAddress: '' // optional
  });

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setOrderError(null);
  };

  const selectedWilayaData = wilayas.find(w => w.id === formData.wilaya);
  const availableCommunes = selectedWilayaData?.communes || [];

  const getDeliveryPrice = () => {
    if (!selectedWilayaData) return 0;
    const basePrice = selectedWilayaData.deliveryPrice || 0;
    if (formData.deliveryType === 'stop_desk') {
      return Math.round(basePrice * 0.7); // 30% less for stop desk
    }
    return basePrice; // Full price for home delivery
  };

  const deliveryPrice = getDeliveryPrice();

  const calculateSubtotal = () => {
    if (!product) return 0;
    // Calculate final price using the same logic as the display
    const basePrice = Number(product.price) || 0;
    const discountPct = Number(product.discount) || 0;
    const computedFinalPrice = discountPct > 0 ? basePrice * (1 - discountPct / 100) : basePrice;
    const finalPrice = Number(product.finalPrice ?? computedFinalPrice) || basePrice;
    return finalPrice * quantity;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + deliveryPrice;
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName || !formData.phone || !formData.commune || !formData.wilaya) {
      setOrderError(t('order.fillRequired') || 'Please fill in all required fields');
      return;
    }

    try {
      setOrderLoading(true);
      setOrderError(null);

      const wilayaName = selectedWilayaData?.name || formData.wilaya;
      const fullAddress = formData.exactAddress 
        ? `${formData.exactAddress}, ${formData.commune}, ${wilayaName}`
        : `${formData.commune}, ${wilayaName}`;

      const orderData = {
        customer: {
          fullName: formData.fullName,
          phone: formData.phone,
          address: fullAddress,
          wilaya: wilayaName,
          commune: formData.commune
        },
        products: [{
          product: product._id || product.id,
          name: product.name,
          price: calculateSubtotal() / quantity,
          originalPrice: Number(product.price) || 0,
          discount: Number(product.discount) || 0,
          quantity: quantity,
          size: selectedSize,
          color: selectedColor,
          image: product.images?.main || product.image
        }],
        paymentMethod: 'cash_on_delivery',
        orderTotal: calculateSubtotal(),
        shippingCost: deliveryPrice,
        tax: 0,
        totalAmount: calculateTotal()
      };

      await ordersAPI.createOrder(orderData);
      setShowSuccessModal(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err) {
      console.error("Order failed", err);
      setOrderError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setOrderLoading(false);
    }
  };


  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productsAPI.getProductById(id);
        const data = response.data || response;

        // Normalize data structure
        const normalizedProduct = {
          ...data,
          category: data.category || 'Equipment',
          imagesList: [
            data.images?.main || data.image,
            ...(data.images?.gallery || [])
          ].filter(Boolean)
        };

        setProduct(normalizedProduct);
        setSelectedImage(0);

        // Track product view/click for analytics (best-effort, no noisy logging)
        try {
          const analytics = JSON.parse(localStorage.getItem('productClicks') || '[]');
          analytics.push({
            productId: normalizedProduct._id || normalizedProduct.id,
            productName: normalizedProduct.name,
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0]
          });
          if (analytics.length > 1000) analytics.splice(0, analytics.length - 1000);
          localStorage.setItem('productClicks', JSON.stringify(analytics));
        } catch (_) {}

        // Fetch Related Products
        try {
          const allRes = await productsAPI.getAllProducts();
          const allProducts = allRes.products || allRes.data?.products || allRes.data || [];
          const related = allProducts
            .filter(p => p.category === normalizedProduct.category && (p._id || p.id) !== (normalizedProduct._id || normalizedProduct.id))
            .slice(0, 4)
            .map(p => ({
              ...p,
              id: p._id || p.id,
              image: p.images?.main || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0].url || p.images[0] : (p.image || PLACEHOLDER_IMAGE))
            }));
          setRelatedProducts(related);
        } catch (err) {
          console.error('Error fetching related products:', err);
        }

      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
    window.scrollTo(0, 0);
  }, [id, navigate]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-yellow-500 rounded-full animate-spin"></div>
    </div>
  );

  if (!product) return null;

  // Normalize pricing + stock fields (backend schema: price, discount, finalPrice, stock, lowStockAlert, status)
  const basePrice = Number(product.price) || 0;
  const discountPct = Number(product.discount) || 0;
  const computedFinalPrice = discountPct > 0 ? basePrice * (1 - discountPct / 100) : basePrice;
  const finalPrice = Number(product.finalPrice ?? computedFinalPrice) || 0;
  const hasDiscount = discountPct > 0 && finalPrice > 0 && finalPrice < basePrice;

  const stock = Number(product.stock ?? product.stockQuantity ?? 0) || 0;
  const lowStockAlert = Number(product.lowStockAlert ?? 5) || 5;
  // Prioritize actual stock value over status field (status might be stale)
  const isOutOfStock = stock <= 0;
  const isLowStock = !isOutOfStock && stock <= lowStockAlert;

  const displayStatus = product.status || (isOutOfStock ? 'Out of stock' : 'Active');

  const specList = (() => {
    const s = product.specifications || {};
    const rows = [];
    if (s.material) rows.push({ key: 'Material', value: s.material });
    if (s.weight !== undefined && s.weight !== null && s.weight !== '') rows.push({ key: 'Weight', value: `${s.weight} kg` });
    if (s.maxLoad !== undefined && s.maxLoad !== null && s.maxLoad !== '') rows.push({ key: 'Max Load', value: `${s.maxLoad} kg` });
    if (s.usage) rows.push({ key: 'Usage', value: s.usage });
    if (s.difficulty) rows.push({ key: 'Difficulty', value: s.difficulty });
    if (Array.isArray(s.bodyTarget) && s.bodyTarget.length > 0) rows.push({ key: 'Body Target', value: s.bodyTarget.join(', ') });
    return rows;
  })();

  return (
    <div className="min-h-screen bg-gray-50 pt-16 sm:pt-20 md:pt-24 pb-6 sm:pb-8 md:pb-12">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-7xl">
        {/* Breadcrumbs */}
        <nav className="flex text-[10px] xs:text-xs sm:text-sm md:text-sm text-gray-500 mb-3 sm:mb-4 md:mb-8 overflow-x-auto whitespace-nowrap -mx-3 sm:mx-0 px-3 sm:px-0">
          <Link to="/" className="hover:text-yellow-500 transition-colors py-1">{t('header.home')}</Link>
          <span className="mx-1 sm:mx-2">/</span>
          <Link to="/shop" className="hover:text-yellow-500 transition-colors py-1">{t('header.shop')}</Link>
          <span className="mx-1 sm:mx-2">/</span>
          <span className="text-gray-900 font-medium truncate py-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-12 mb-8 sm:mb-12 md:mb-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative group"
            >
              <img
                src={product.imagesList[selectedImage] || PLACEHOLDER_IMAGE}
                alt={product.name}
                onError={(e) => {
                  // Handle image load error silently - use data URI fallback
                  e.target.onerror = null; // Prevent infinite loop
                  e.target.src = PLACEHOLDER_IMAGE;
                }}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
            </motion.div>

            {product.imagesList.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {product.imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-transparent hover:border-gray-200'
                      }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 tracking-tight font-outfit leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 flex-wrap">
              <div className="flex text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className={`w-4 h-4 sm:w-5 sm:h-5 ${i < Math.floor(product.rating?.average || 5) ? 'fill-current' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-gray-500 text-xs sm:text-sm">({product.rating?.count || 0} {t('product.reviews')})</span>
              {isOutOfStock ? (
                <span className="text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded-full">{t('product.outOfStock')}</span>
              ) : isLowStock ? (
                <span className="text-orange-600 text-sm font-medium bg-orange-50 px-2 py-1 rounded-full">{t('product.lowStock')}</span>
              ) : (
                <span className="text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded-full">{t('product.inStock')}</span>
              )}
            </div>

            <div className="flex flex-col gap-2 mb-4 sm:mb-6 md:mb-8">
              <div className="flex items-baseline gap-2 sm:gap-3 md:gap-4 flex-wrap">
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">{finalPrice.toLocaleString()} DA</span>
                {hasDiscount && (
                  <>
                    <span className="text-lg md:text-xl text-gray-400 line-through">{basePrice.toLocaleString()} DA</span>
                    <span className="text-sm md:text-base font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-full">
                      -{discountPct}%
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                <span className="bg-gray-50 border border-gray-100 px-2 py-1 rounded-full">
                  {t('product.category')}: <span className="font-semibold text-gray-900">{product.category || '—'}</span>
                </span>
                <span className="bg-gray-50 border border-gray-100 px-2 py-1 rounded-full">
                  {t('product.status')}: <span className="font-semibold text-gray-900">{displayStatus}</span>
                </span>
              </div>

              {isLowStock && (
                <div className="text-sm font-medium text-orange-700 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                  {t('product.lowStockWarning')}
                </div>
              )}
            </div>

            <p className="text-gray-600 leading-relaxed mb-6 md:mb-8 text-base md:text-lg">
              {product.description}
            </p>

            {/* Size Selection */}
            {product.variants?.sizes && product.variants.sizes.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-2 sm:mb-3">{t('product.size')}</h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {product.variants.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border-2 font-medium transition-all min-h-[44px] touch-manipulation text-sm sm:text-base ${
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
            {product.variants?.colors && product.variants.colors.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-2 sm:mb-3">{t('product.color')}</h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {product.variants.colors.map((color) => {
                    const colorValue = getColorValue(color);
                    const isSelected = selectedColor === color;
                    const isLightColor = color.toLowerCase() === 'white' || color.toLowerCase() === 'yellow';
                    
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        style={{
                          backgroundColor: colorValue,
                          borderColor: colorValue,
                          borderWidth: '2px',
                          borderStyle: 'solid',
                          color: isLightColor ? '#000000' : '#FFFFFF',
                          boxShadow: isSelected ? `0 0 0 3px rgba(251, 191, 36, 0.3)` : 'none'
                        }}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all hover:opacity-80 min-h-[44px] touch-manipulation text-sm sm:text-base"
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 md:gap-4 mb-6 sm:mb-8 md:mb-10 pb-6 sm:pb-8 md:pb-10 border-b border-gray-100">
              <div className="flex items-center border border-gray-300 rounded-xl bg-white w-full sm:w-max justify-center sm:justify-start">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 sm:px-4 py-3 hover:bg-gray-50 text-gray-600 transition-colors min-h-[44px] touch-manipulation text-lg sm:text-xl"
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-12 sm:w-14 text-center font-medium text-gray-900 text-base sm:text-lg">{quantity}</span>
                <button
                  onClick={() => setQuantity(prev => {
                    const next = prev + 1;
                    return stock > 0 ? Math.min(next, stock) : next;
                  })}
                  className="px-4 sm:px-4 py-3 hover:bg-gray-50 text-gray-600 transition-colors min-h-[44px] touch-manipulation text-lg sm:text-xl"
                  disabled={isOutOfStock || (stock > 0 && quantity >= stock)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                disabled={isOutOfStock}
                onClick={() => {
                  const cartProduct = {
                    ...product,
                    price: finalPrice,
                    originalPrice: hasDiscount ? basePrice : null,
                    images: product.images || { main: product.imagesList?.[0] || product.image || PLACEHOLDER_IMAGE, gallery: product.imagesList?.slice(1) || [] }
                  };
                  addToCart(cartProduct, quantity, selectedSize, selectedColor);
                }}
                className={`flex-1 font-bold py-3 sm:py-3.5 md:py-3 px-4 sm:px-6 md:px-8 rounded-xl transition-all transform active:scale-95 shadow-lg text-sm sm:text-base md:text-lg min-h-[44px] touch-manipulation ${
                  isOutOfStock
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                    : 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-yellow-500/20'
                }`}
              >
                {isOutOfStock ? t('product.outOfStock') : t('product.addToCart')}
              </button>
            </div>

            {/* Quick Order Form Integration - Always Visible */}
            {!isOutOfStock && (
              <motion.div
                id="quick-order-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden mb-8"
              >
                  <div className="bg-white rounded-2xl border-2 border-yellow-500 shadow-xl shadow-yellow-500/10 p-5 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <LocalShipping className="text-yellow-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{t('order.clientInfo')}</h2>
                        <p className="text-sm text-gray-500">{t('order.subtitle')}</p>
                      </div>
                    </div>

                    <form onSubmit={handleOrderSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Full Name */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            {t('order.fullName')} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleFormChange}
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                            placeholder={t('order.fullName')}
                          />
                        </div>

                        {/* Phone */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            {t('order.phone')} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleFormChange}
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                            placeholder="+213 XXX XXX XXX"
                          />
                        </div>

                        {/* Wilaya */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            {t('order.wilaya')} <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="wilaya"
                            value={formData.wilaya}
                            onChange={handleFormChange}
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none transition-all bg-white"
                          >
                            <option value="">{t('order.selectWilaya')}</option>
                            {wilayas.map(w => (
                              <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Commune */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            {t('order.commune')} <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="commune"
                            value={formData.commune}
                            onChange={handleFormChange}
                            required
                            disabled={!formData.wilaya}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none transition-all bg-white disabled:bg-gray-50"
                          >
                            <option value="">{t('order.selectCommune')}</option>
                            {availableCommunes.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        {/* Delivery Type */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-3">
                            {t('order.deliveryType')}
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${formData.deliveryType === 'home' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-100 hover:border-gray-200'}`}>
                              <input type="radio" name="deliveryType" value="home" checked={formData.deliveryType === 'home'} onChange={handleFormChange} className="w-4 h-4 text-yellow-500 mr-3" />
                              <span className="text-sm font-bold text-gray-900">{t('order.deliveryHome')}</span>
                            </label>
                            <label className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${formData.deliveryType === 'stop_desk' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-100 hover:border-gray-200'}`}>
                              <input type="radio" name="deliveryType" value="stop_desk" checked={formData.deliveryType === 'stop_desk'} onChange={handleFormChange} className="w-4 h-4 text-yellow-500 mr-3" />
                              <span className="text-sm font-bold text-gray-900">{t('order.deliveryStopDesk')}</span>
                            </label>
                          </div>
                        </div>

                        {/* Exact Address */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            {t('order.exactAddress')}
                          </label>
                          <textarea
                            name="exactAddress"
                            value={formData.exactAddress}
                            onChange={handleFormChange}
                            rows="2"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none transition-all resize-none"
                            placeholder={t('order.exactAddressPlaceholder')}
                          />
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{t('order.productDetails')}</span>
                          <span>{calculateSubtotal().toLocaleString()} DA</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{t('order.delivery')}</span>
                          <span>{deliveryPrice === 0 ? '—' : `${deliveryPrice.toLocaleString()} DA`}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span className="font-bold text-gray-900">{t('order.total')}</span>
                          <span className="text-xl font-black text-yellow-600">{calculateTotal().toLocaleString()} DA</span>
                        </div>
                      </div>

                      {orderError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                          <p className="text-red-700 text-sm font-medium">{orderError}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={orderLoading}
                        className="w-full bg-black text-white hover:bg-gray-800 font-black py-4 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                      >
                        {orderLoading ? t('order.processing') : t('order.placeOrder')}
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

            {/* Fast Features */}
            {product.features && (
              <div className="grid grid-cols-2 gap-4">
                {product.features.slice(0, 4).map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8 sm:mb-12 md:mb-16">
          <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0">
            {['description', 'specifications', 'usage'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-6 md:px-8 py-3 sm:py-4 font-medium text-xs sm:text-sm md:text-base capitalize whitespace-nowrap transition-colors relative min-h-[44px] touch-manipulation flex-shrink-0 ${activeTab === tab ? 'text-yellow-600' : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                {t(`product.${tab}`)}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6 md:p-8 lg:p-12">
            {activeTab === 'description' && (
              <div className="prose max-w-none text-gray-600">
                <p className="text-lg leading-relaxed">{product.description}</p>
                {/* Additional descriptive content could go here */}
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {specList.length > 0 ? (
                  specList.map((spec, i) => (
                    <div key={`${spec.key}-${i}`} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                      <span className="font-medium text-gray-900">{spec.key}</span>
                      <span className="text-gray-600 text-right">{spec.value}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">{t('product.noSpecs')}</p>
                )}
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-yellow-100 p-3 rounded-lg text-yellow-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Training Tips</h3>
                    <p className="text-gray-600">Perfect for progressively overloading your calisthenics skills. Start with basic movements and work your way up.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Safety First</h3>
                    <p className="text-gray-600">Always check equipment before use. Ensure all bolts are tightened and the setup is stable.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="container mx-auto px-3 sm:px-4 max-w-7xl mt-12 sm:mt-16 md:mt-24">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 md:mb-8 font-outfit">{t('product.youMayAlsoLike')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {relatedProducts.map((related) => (
              <Link
                to={`/product/${related.id}`}
                key={related.id}
                className="group bg-white rounded-lg sm:rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="aspect-square bg-gray-50 overflow-hidden relative">
                  <img
                    src={related.image}
                    alt={related.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 truncate text-sm sm:text-base">{related.name}</h3>
                  <p className="text-yellow-600 font-bold text-sm sm:text-base">{Number(related.price || 0).toLocaleString()} DA</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center relative"
            >
              <button
                onClick={() => navigate('/')}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <Close />
              </button>
              
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-green-600 text-5xl" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('order.confirmed')}</h2>
              <p className="text-gray-600 mb-2">
                {t('order.successSingle')} <span className="font-bold">{product.name}</span> {t('order.successEnd')}
              </p>
              <p className="text-sm text-gray-500 mt-4">
                {t('order.redirecting')}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ProductDetail;
