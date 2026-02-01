import React, { useState, useEffect } from 'react';
import {
  Rating,
  CircularProgress
} from '@mui/material';
import {
  ShoppingCart,
  ArrowForward,
  LocalShipping,
  Security,
  Support,
  FitnessCenter,
  Star,
  Instagram,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { productsAPI } from '../services/api';
import { PLACEHOLDER_IMAGE } from '../assets/placeholders';
import HeroSlider from '../components/HeroSlider';

// Featured Categories
import wallMountedImg from '../assets/imgs/wallmountedbarresIMG.png';
import paralellesImg from '../assets/imgs/paralellesIMG.webp';
import accessoiresImg from '../assets/imgs/accessoiresIMG.webp';

const featuredCategories = [
  {
    title: 'Wall Mounted Barres',
    image: wallMountedImg,
    path: '/shop?category=pull up bar',
    count: 'Best Seller'
  },
  {
    title: 'Paralelles',
    image: paralellesImg,
    path: '/shop?category=paralelle',
    count: 'Top Rated'
  },
  {
    title: 'Accessories',
    image: accessoiresImg,
    path: '/shop?category=Accessories',
    count: 'Essential'
  }
];

// Why Choose Us
const whyChooseUs = [
  {
    icon: FitnessCenter,
    title: 'Built for Athletes',
    description: 'Professional-grade equipment designed by calisthenics experts'
  },
  {
    icon: LocalShipping,
    title: 'Fast Delivery',
    description: 'Quick shipping across Algeria - get your gear in 24-48 hours'
  },
  {
    icon: Star,
    title: 'Premium Quality',
    description: 'Durable, battle-tested materials that last for years'
  },
  {
    icon: Support,
    title: 'Local Support',
    description: 'Expert customer service in Algeria - we speak your language'
  }
];

export default function Home() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const [featured, offers] = await Promise.all([
          productsAPI.getFeaturedProducts().catch(() => []),
          productsAPI.getBestOffers(8).catch(() => [])
        ]);

        const allProducts = [...(featured || []), ...(offers || [])];
        const uniqueProducts = allProducts.filter((product, index, self) =>
          index === self.findIndex(p => (p._id || p.id) === (product._id || product.id))
        ).slice(0, 8);

        setBestSellers(uniqueProducts.map(p => ({
          ...p,
          id: p._id || p.id
        })));
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    // Calculate final price with discount
    const basePrice = parseFloat(product.price) || 0;
    const discountPct = parseFloat(product.discount) || 0;
    const computedFinalPrice = discountPct > 0 ? basePrice * (1 - discountPct / 100) : basePrice;
    const finalPrice = parseFloat(product.finalPrice ?? computedFinalPrice) || basePrice;
    const hasDiscount = discountPct > 0 && finalPrice < basePrice;
    
    // Create cart product with discounted price
    const cartProduct = {
      ...product,
      price: finalPrice,
      originalPrice: hasDiscount ? basePrice : (product.originalPrice || null),
      discount: discountPct > 0 ? discountPct : undefined
    };
    
    addToCart(cartProduct);
  };

  return (
    <div className="bg-light min-h-screen font-sans">
      <HeroSlider />

      {/* Quick Features Strip */}
      <div className="bg-black text-secondary py-3 md:py-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {[
              { icon: LocalShipping, textKey: "home.fastShipping" },
              { icon: Security, textKey: "home.securePayment" },
              { icon: Support, textKey: "home.support24" },
              { icon: FitnessCenter, textKey: "home.premiumQuality" }
            ].map((f, i) => (
              <div key={i} className="flex items-center justify-center gap-1 sm:gap-2 opacity-80 hover:opacity-100 transition-opacity px-1">
                <f.icon className="text-base sm:text-lg md:text-xl flex-shrink-0" />
                <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-center leading-tight">{t(f.textKey)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <section className="py-12 sm:py-16 md:py-24 px-4 max-w-[1400px] mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 tracking-tight">{t('home.shopByCategory')}</h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-500 max-w-2xl mx-auto">{t('home.shopByCategoryDesc') || 'Find the perfect equipment tailored to your training needs.'}</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {featuredCategories.map((cat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              className="group cursor-pointer relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl"
              onClick={() => navigate(cat.path)}
            >
              <img src={cat.image} alt={cat.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              
              <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-10">
                <span className="inline-block bg-secondary text-black text-[10px] font-black px-4 py-1.5 rounded-full mb-4 uppercase tracking-[0.2em] w-fit">
                  {t(`home.${cat.count.toLowerCase().replace(/\s+/g, '')}`) || cat.count}
                </span>
                <h3 className="font-display font-black text-3xl sm:text-4xl text-white mb-6 leading-none uppercase tracking-tighter">
                  {cat.title}
                </h3>
                <div className="flex items-center gap-3 text-secondary font-black text-sm uppercase tracking-widest translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  {t('home.shopNow')} <ArrowForward fontSize="small" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 sm:mb-16 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 tracking-tight">{t('home.bestSellers')}</h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-500">{t('home.topRated')}</p>
            </motion.div>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              onClick={() => navigate('/shop')}
              className="group flex items-center gap-3 bg-black text-white font-black uppercase tracking-widest hover:bg-secondary hover:text-black transition-all duration-300 text-xs sm:text-sm py-4 px-8 rounded-full"
            >
              {t('home.viewAll')} <ArrowForward className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>

          {loading ? (
            <div className="flex justify-center py-32">
              <CircularProgress sx={{ color: '#FFD700' }} size={60} thickness={5} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
              {bestSellers.map((product, idx) => (
                <motion.div
                  key={product.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="group bg-white rounded-3xl cursor-pointer transition-all duration-500 hover:-translate-y-2"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-gray-100 mb-6 group/img shadow-lg">
                    <img
                      src={product.images?.main || product.image || product.images?.[0]?.url || PLACEHOLDER_IMAGE}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                    {product.originalPrice && product.price < product.originalPrice && (
                      <span className="absolute top-6 left-6 bg-red-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-xl tracking-[0.2em]">
                        -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                      </span>
                    )}
                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      className="absolute bottom-6 right-6 bg-black text-secondary p-5 rounded-2xl shadow-2xl lg:translate-y-12 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 transition-all duration-500 hover:bg-secondary hover:text-black active:scale-90 z-20"
                      aria-label="Add to cart"
                    >
                      <ShoppingCart className="text-2xl" />
                    </button>
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  <div className="px-2">
                    <h3 className="font-display font-black text-xl sm:text-2xl mb-2 group-hover:text-secondary transition-colors line-clamp-1 uppercase tracking-tight">{product.name}</h3>
                    <div className="flex items-center gap-3 mb-4">
                      <Rating value={product.rating?.average || 5} size="small" readOnly sx={{ color: '#FFD700' }} />
                      <span className="text-xs text-gray-400 font-bold tracking-widest">({product.rating?.count || 42})</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      {(() => {
                        const basePrice = parseFloat(product.price) || 0;
                        const discountPct = parseFloat(product.discount) || 0;
                        const computedFinalPrice = discountPct > 0 ? basePrice * (1 - discountPct / 100) : basePrice;
                        const finalPrice = parseFloat(product.finalPrice ?? computedFinalPrice) || basePrice;
                        const hasDiscount = discountPct > 0 && finalPrice < basePrice;
                        const originalPrice = parseFloat(product.originalPrice) || basePrice;
                        
                        return (
                          <>
                            <span className="font-display font-black text-2xl sm:text-3xl text-black">{finalPrice.toLocaleString()} DA</span>
                            {(hasDiscount || (originalPrice && originalPrice > finalPrice)) && (
                              <span className="text-sm sm:text-base text-gray-400 line-through font-bold">
                                {(hasDiscount ? basePrice : originalPrice).toLocaleString()} DA
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Value Props */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {whyChooseUs.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-gold/20 transition-all border border-gray-100 text-center"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-secondary">
                  <item.icon className="text-2xl sm:text-3xl" />
                </div>
                <h3 className="font-display font-bold text-lg sm:text-xl mb-2 sm:mb-3">{t(`home.${item.title.toLowerCase().replace(/\s+/g, '')}`) || item.title}</h3>
                <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{t(`home.${item.title.toLowerCase().replace(/\s+/g, '')}Desc`) || item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-dark-900 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1600')] bg-cover bg-center bg-fixed" />
        <div className="relative z-10 max-w-4xl mx-auto px-3 sm:px-4 md:px-6">
          <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl text-white mb-3 sm:mb-4 md:mb-6 uppercase leading-tight">
            {t('home.startJourney')} <span className="text-secondary">{t('home.journey')}</span>
          </h2>
          <p className="text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto px-2">
            {t('home.journeyDesc')}
          </p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-secondary text-black font-bold text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-12 py-3 sm:py-3.5 md:py-4 rounded-full hover:bg-white transition-all shadow-lg hover:shadow-gold duration-300 transform hover:-translate-y-1 min-h-[44px] touch-manipulation"
          >
            {t('home.shopNow')}
          </button>
        </div>
      </section>
    </div>
  );
}