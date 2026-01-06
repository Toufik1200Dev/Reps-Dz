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
import { productsAPI } from '../services/api';
import HeroSlider from '../components/HeroSlider';

// Featured Categories
import wallMountedImg from '../assets/imgs/wallmountedbarresIMG.png';
import paralellesImg from '../assets/imgs/paralellesIMG.webp';
import accessoiresImg from '../assets/imgs/accessoiresIMG.webp';

const featuredCategories = [
  {
    title: 'Wall Mounted Barres',
    image: wallMountedImg,
    path: '/shop?category=Equipment',
    count: 'Best Seller'
  },
  {
    title: 'Paralelles',
    image: paralellesImg,
    path: '/shop?category=Equipment',
    count: 'Top Rated'
  },
  {
    title: 'Accessoires',
    image: accessoiresImg,
    path: '/shop?category=Accessories',
    count: 'Essential'
  }
];

// Why Choose Us
const whyChooseUs = [
  {
    icon: <FitnessCenter className="text-4xl text-black" />,
    title: 'Built for Athletes',
    description: 'Professional-grade equipment designed by calisthenics experts'
  },
  {
    icon: <LocalShipping className="text-4xl text-black" />,
    title: 'Fast Delivery',
    description: 'Quick shipping across Algeria - get your gear in 24-48 hours'
  },
  {
    icon: <Star className="text-4xl text-black" />,
    title: 'Premium Quality',
    description: 'Durable, battle-tested materials that last for years'
  },
  {
    icon: <Support className="text-4xl text-black" />,
    title: 'Local Support',
    description: 'Expert customer service in Algeria - we speak your language'
  }
];

export default function Home() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
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
    addToCart(product);
  };

  return (
    <div className="bg-light min-h-screen font-sans">
      <HeroSlider />

      {/* Quick Features Strip */}
      <div className="bg-black text-secondary py-3 md:py-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            {[
              { icon: LocalShipping, text: "Fast Shipping" },
              { icon: Security, text: "Secure Payment" },
              { icon: Support, text: "24/7 Support" },
              { icon: FitnessCenter, text: "Premium Quality" }
            ].map((f, i) => (
              <div key={i} className="flex items-center justify-center gap-1 md:gap-2 opacity-80 hover:opacity-100 transition-opacity">
                <f.icon className="text-lg md:text-xl" />
                <span className="text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <section className="py-12 md:py-16 lg:py-24 px-4 max-w-[1400px] mx-auto">
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl mb-3 md:mb-4">SHOP BY <span className="text-stroke">CATEGORY</span></h2>
          <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto px-4">Find the perfect equipment tailored to your training needs.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {featuredCategories.map((cat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="group cursor-pointer relative h-[300px] sm:h-[350px] md:h-[400px] rounded-xl md:rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
              onClick={() => navigate(cat.path)}
            >
              <div className="absolute inset-0 bg-gray-200">
                <img src={cat.image} alt={cat.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              <div className="absolute bottom-0 left-0 w-full p-8 text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <span className="text-secondary text-xs font-bold uppercase tracking-wider mb-2 block">{cat.count}</span>
                <h3 className="font-display font-bold text-3xl mb-4">{cat.title}</h3>
                <div className="flex items-center text-sm font-bold uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity delay-100 text-secondary">
                  Shop Now <ArrowForward className="ml-2 text-xs" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 md:mb-12 gap-4">
            <div>
              <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl mb-2">BEST SELLERS</h2>
              <p className="text-sm md:text-base text-gray-500">Top-rated gear chosen by champions.</p>
            </div>
            <button
              onClick={() => navigate('/shop')}
              className="flex items-center gap-2 text-black font-bold uppercase tracking-wider hover:text-secondary transition-colors text-sm md:text-base"
            >
              View All <ArrowForward className="text-sm" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <CircularProgress sx={{ color: '#FFD700' }} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
              {bestSellers.map((product, idx) => (
                <div
                  key={product.id || idx}
                  className="group bg-white rounded-xl cursor-pointer"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 mb-4">
                    <img
                      src={product.images?.main || product.image || product.images?.[0]?.url || 'https://via.placeholder.com/400'}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {product.originalPrice && product.price < product.originalPrice && (
                      <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                        SALE
                      </span>
                    )}
                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      className="absolute bottom-4 right-4 bg-white text-black p-3 rounded-full shadow-lg translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black hover:text-secondary"
                    >
                      <ShoppingCart />
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-1 group-hover:text-secondary transition-colors line-clamp-1">{product.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Rating value={product.rating?.average || 5} size="small" readOnly />
                      <span className="text-xs text-gray-500 font-medium">({product.rating?.count || 42})</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="font-display font-bold text-xl">{parseFloat(product.price).toLocaleString()} DA</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">{parseFloat(product.originalPrice).toLocaleString()} DA</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center md:hidden">
            <button
              onClick={() => navigate('/shop')}
              className="btn-primary"
            >
              View All Products
            </button>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {whyChooseUs.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-gold/20 transition-all border border-gray-100 text-center"
              >
                <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-secondary">
                  {item.icon}
                </div>
                <h3 className="font-display font-bold text-xl mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 lg:py-24 bg-dark-900 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1600')] bg-cover bg-center bg-fixed" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6">
          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-white mb-4 md:mb-6 uppercase">
            Start Your <span className="text-secondary">Journey</span>
          </h2>
          <p className="text-gray-300 text-base md:text-lg lg:text-xl mb-8 md:mb-10 max-w-2xl mx-auto">
            Equip yourself with the best tools in the game. Join the movement today.
          </p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-secondary text-black font-bold text-base md:text-lg px-8 md:px-12 py-3 md:py-4 rounded-full hover:bg-white transition-all shadow-lg hover:shadow-gold duration-300 transform hover:-translate-y-1"
          >
            Shop Now
          </button>
        </div>
      </section>
    </div>
  );
}