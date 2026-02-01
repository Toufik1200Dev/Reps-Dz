import React, { useState, useEffect } from 'react';
import {
  Slider,
  Pagination,
  Drawer,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Rating,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  FilterList,
  Search,
  ShoppingCart,
  Close,
  FitnessCenter,
  ArrowForward
} from '@mui/icons-material';
import { productsAPI } from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { PLACEHOLDER_IMAGE } from '../assets/placeholders';

// Mock data fallback if API fails
import { featuredProducts } from '../data/products';

export default function Shop() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart, isInCart } = useCart();
  const { t, language } = useLanguage();

  // State
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Sync category from URL
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat !== null) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  // Sync URL when category changes
  useEffect(() => {
    if (selectedCategory) {
      setSearchParams({ category: selectedCategory });
    } else {
      setSearchParams({});
    }
  }, [selectedCategory, setSearchParams]);

  // Data Loading
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {


        const res = await productsAPI.getAllProducts();
        const list = res?.products || res?.data?.products || res?.data || [];

        const normalized = list.map(p => {
          const basePrice = parseFloat(p.price) || 0;
          const discountPct = parseFloat(p.discount) || 0;
          const computedFinalPrice = discountPct > 0 ? basePrice * (1 - discountPct / 100) : basePrice;
          const finalPrice = parseFloat(p.finalPrice ?? computedFinalPrice) || basePrice;
          
          return {
            id: p._id || p.id,
            name: p.name || '',
            price: finalPrice, // Use discounted price
            originalPrice: discountPct > 0 ? basePrice : (p.originalPrice || null),
            discount: discountPct,
            basePrice: basePrice, // Keep original for reference
            image: p.images?.main || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0].url || p.images[0] : (p.image || PLACEHOLDER_IMAGE)),
            description: p.description || '',
            rating: p.rating || { average: 4.8, count: 0 },
            inStock: p.stockQuantity > 0,
            category: p.category || '',
            isFeatured: p.isFeatured
          };
        }).filter(Boolean);

        setProducts(normalized);
        const uniqueCats = [...new Set(normalized.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCats);
        setFilteredProducts(normalized);
      } catch (e) {
        setProducts(featuredProducts);
        setCategories([...new Set(featuredProducts.map(p => p.category))]);
        setFilteredProducts(featuredProducts);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Filtering Logic
  useEffect(() => {
    let result = [...products];

    if (searchTerm) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      result = result.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    result = result.filter(p => {
      const price = parseFloat(p.price); // Already using discounted price
      return price >= priceRange[0] && price <= priceRange[1];
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return parseFloat(a.price) - parseFloat(b.price);
        case 'price-high': return parseFloat(b.price) - parseFloat(a.price);
        case 'rating': return (b.rating.average || 0) - (a.rating.average || 0);
        default: return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [products, searchTerm, selectedCategory, priceRange, sortBy]);

  // Pagination Logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    // Ensure product has correct price structure when adding to cart
    const cartProduct = {
      ...product,
      price: product.price, // Already discounted
      originalPrice: product.originalPrice,
      discount: product.discount || 0
    };
    addToCart(cartProduct);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setPriceRange([0, 50000]);
    setSortBy('name');
  };

  // Shared Filter Content (Sidebar Style)
  const FilterContent = ({ mobile = false }) => (
    <div className="flex flex-col gap-8">
      {/* Search */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-lg uppercase tracking-wider border-b border-gray-100 pb-2">{t('common.search')}</h3>
        <TextField
          fullWidth
          placeholder={t('shop.search')}
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: '#f9fafb', // gray-50
              '& fieldset': { borderColor: '#e5e7eb' },
              '&:hover fieldset': { borderColor: '#d1d5db' },
              '&.Mui-focused fieldset': { borderColor: '#FFD700' }
            }
          }}
          InputProps={{
            startAdornment: <Search className="text-gray-400 mr-2" fontSize="small" />,
          }}
        />
      </div>

      {/* Sort By */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-lg uppercase tracking-wider border-b border-gray-100 pb-2">{t('shop.sort')}</h3>
        <FormControl fullWidth size="small">
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            displayEmpty
            sx={{
              borderRadius: '12px',
              backgroundColor: '#f9fafb',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#d1d5db' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#FFD700' }
            }}
          >
            <MenuItem value="name">{t('shop.sortName') || 'Name (A-Z)'}</MenuItem>
            <MenuItem value="price-low">{t('shop.sortPriceLow') || 'Price (Low to High)'}</MenuItem>
            <MenuItem value="price-high">{t('shop.sortPriceHigh') || 'Price (High to Low)'}</MenuItem>
            <MenuItem value="rating">{t('shop.sortRating') || 'Top Rated'}</MenuItem>
          </Select>
        </FormControl>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-lg uppercase tracking-wider border-b border-gray-100 pb-2">{t('product.category')}</h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`text-left px-4 py-3 rounded-xl transition-all font-medium text-sm flex items-center justify-between group ${selectedCategory === ''
              ? 'bg-black text-secondary shadow-lg shadow-black/20'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-black'
              }`}
          >
            {t('shop.allCategories')}
            {selectedCategory === '' && <span className="w-2 h-2 rounded-full bg-secondary" />}
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-left px-4 py-3 rounded-xl transition-all font-medium text-sm flex items-center justify-between group ${selectedCategory === cat
                ? 'bg-black text-secondary shadow-lg shadow-black/20'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-black'
                }`}
            >
              {cat}
              {selectedCategory === cat && <span className="w-2 h-2 rounded-full bg-secondary" />}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-lg uppercase tracking-wider border-b border-gray-100 pb-2">{t('shop.priceRange')}</h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            onChange={(e, v) => setPriceRange(v)}
            min={0}
            max={50000}
            step={100}
            sx={{
              color: '#FFD700',
              height: 4,
              '& .MuiSlider-thumb': {
                width: 20,
                height: 20,
                backgroundColor: '#000',
                border: '2px solid #FFD700',
                '&:hover': { boxShadow: '0 0 0 8px rgba(255, 215, 0, 0.16)' },
                '&.Mui-focusVisible': { boxShadow: '0 0 0 8px rgba(255, 215, 0, 0.16)' },
              },
              '& .MuiSlider-track': { border: 'none' },
              '& .MuiSlider-rail': { opacity: 0.3, backgroundColor: '#000' }
            }}
          />
        </div>
        <div className="flex items-center justify-between text-sm font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">
          <span>{priceRange[0].toLocaleString()} DA</span>
          <span className="text-gray-400">-</span>
          <span>{priceRange[1].toLocaleString()} DA</span>
        </div>
      </div>

      <button
        onClick={clearFilters}
        className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors py-2 border border-red-100 rounded-xl hover:bg-red-50"
      >
        {t('common.clear')}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pt-16 md:pt-20 pb-8 md:pb-12">
      {/* Header */}
      <div className="bg-gradient-dark text-white py-16 md:py-24 text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="font-display font-black text-4xl md:text-6xl mb-4 uppercase tracking-tight">
            Professional <span className="text-secondary">Equipment</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg md:text-xl font-light">
            Engineered for performance. Built to last.
          </p>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-6 flex items-center justify-between">
            <span className="font-display font-bold text-xl">{filteredProducts.length} {t('cart.itemsPlural')}</span>
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 bg-black text-secondary px-6 py-3 rounded-full font-bold shadow-lg shadow-black/10 active:scale-95 transition-transform"
            >
              <FilterList fontSize="small" /> {t('shop.filter')}
            </button>
          </div>

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0 space-y-8 sticky top-24 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
            <FilterContent />
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            {loading ? (
              <div className="flex justify-center py-40">
                <CircularProgress sx={{ color: '#FFD700' }} size={60} thickness={4} />
              </div>
            ) : (
              <>
                <div className="mb-6 hidden lg:flex items-center justify-between">
                  <h2 className="font-display font-bold text-2xl uppercase">{t('common.result') || 'Result'}: <span className="text-gray-500">{filteredProducts.length} {t('cart.itemsPlural')}</span></h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8">
                  <AnimatePresence mode='popLayout'>
                    {currentProducts.map((product) => (
                      <motion.div
                        layout
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="group flex flex-col bg-white rounded-3xl border border-gray-100 hover:border-secondary/30 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden"
                        onClick={() => navigate(`/product/${product.id}`)}
                      >
                        {/* Image Container */}
                        <div className="relative pt-[110%] bg-gray-50 overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

                          {/* Badges */}
                          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                            {product.originalPrice && product.price < product.originalPrice && (
                              <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-sm shadow-xl">
                                {product.discount > 0 ? `-${Math.round(product.discount)}%` : 'Sale'}
                              </span>
                            )}
                            {product.isFeatured && (
                              <span className="bg-secondary text-black text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-sm shadow-xl">
                                Featured
                              </span>
                            )}
                          </div>
                          
                          {/* Quick Add Mobile */}
                          <button
                            onClick={(e) => handleAddToCart(product, e)}
                            disabled={!product.inStock}
                            className={`absolute bottom-4 right-4 w-12 h-12 flex items-center justify-center rounded-2xl shadow-2xl transition-all duration-300 lg:translate-y-20 lg:group-hover:translate-y-0 active:scale-90 ${!product.inStock
                              ? 'bg-gray-200 text-gray-400'
                              : isInCart(product.id)
                                ? 'bg-green-500 text-white'
                                : 'bg-black text-secondary hover:bg-secondary hover:text-black'
                              }`}
                          >
                            <ShoppingCart fontSize="small" />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col flex-1">
                          <div className="mb-1">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{product.category}</p>
                            <h3 className="font-bold text-lg leading-tight group-hover:text-secondary transition-colors line-clamp-2 min-h-[1.5em]">{product.name}</h3>
                          </div>

                          <div className="flex items-center gap-1 mb-4">
                            <Rating value={product.rating.average || 5} size="small" readOnly sx={{ color: '#FFD700' }} />
                            <span className="text-xs font-medium text-gray-400">({product.rating.count})</span>
                          </div>

                          <div className="mt-auto flex items-center justify-between pt-5 border-t border-gray-50">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="font-display font-black text-2xl text-black">{Number(product.price).toLocaleString()} <span className="text-xs font-bold">DA</span></span>
                                {product.originalPrice && product.price < product.originalPrice && (
                                  <span className="text-sm text-gray-400 line-through font-bold">{Number(product.originalPrice).toLocaleString()}</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="hidden lg:flex items-center text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                               <ArrowForward fontSize="small" className="text-black" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Empty State */}
                {currentProducts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <FitnessCenter className="text-6xl text-gray-300 mb-4" />
                    <h3 className="font-display font-bold text-2xl text-gray-900 mb-2">{t('shop.noProducts')}</h3>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">{t('shop.noProductsDesc') || "We couldn't find any products matching your filters."}</p>
                    <button
                      onClick={clearFilters}
                      className="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-secondary hover:text-black transition-all shadow-lg hover:shadow-xl"
                    >
                      {t('common.clear')}
                    </button>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-16 flex justify-center">
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={(e, p) => setCurrentPage(p)}
                      size="large"
                      sx={{
                        '& .MuiPaginationItem-root': {
                          fontFamily: 'Inter',
                          fontWeight: '700',
                          fontSize: '1rem',
                          color: '#000',
                          '&.Mui-selected': {
                            backgroundColor: '#FFD700',
                            color: '#000',
                            '&:hover': { backgroundColor: '#FFED4E' }
                          },
                          '&:hover': { backgroundColor: '#f3f4f6' }
                        }
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        anchor={language === 'ar' ? 'right' : 'left'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ 
          sx: { 
            width: '100%', 
            maxWidth: 340,
            backgroundImage: 'linear-gradient(to bottom, #fff, #f9fafb)',
            boxShadow: '20px 0 50px rgba(0,0,0,0.1)'
          } 
        }}
      >
        <div className="p-8 h-full flex flex-col bg-transparent">
          <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
            <div>
              <h2 className="font-display font-black text-3xl uppercase tracking-tighter">{t('shop.filter')}</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{filteredProducts.length} {t('common.results')}</p>
            </div>
            <IconButton onClick={() => setDrawerOpen(false)} sx={{ bgcolor: 'rgba(0,0,0,0.05)', color: 'black' }}>
              <Close />
            </IconButton>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
            <FilterContent mobile />
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => setDrawerOpen(false)}
              className="w-full bg-black text-secondary font-black text-lg py-5 rounded-2xl shadow-2xl shadow-black/20 hover:scale-[1.02] transition-all active:scale-95"
            >
              {t('common.show')} {filteredProducts.length} {t('common.results')}
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
