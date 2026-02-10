import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/header/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Order from './pages/Order';
import AboutMe from './pages/AboutMe';
import Programs from './pages/Programs';
import CalorieCalculator from './pages/CalorieCalculator';
import Guides from './pages/Guides';
import GuideDetail from './pages/GuideDetail';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AboutUs from './pages/AboutUs';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Orders from './pages/admin/Orders';
import Products from './pages/admin/Products';
import Analytics from './pages/admin/Analytics';
import GeneratorStats from './pages/admin/GeneratorStats';
import SavedPrograms from './pages/admin/SavedPrograms';
import CalorieStats from './pages/admin/CalorieStats';
import Feedback from './pages/Feedback';
import ContactMessages from './pages/admin/ContactMessages';
import AdminFeedback from './pages/admin/AdminFeedback';
import Settings from './pages/admin/Settings';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { CartProvider } from './contexts/CartContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { trackVisitor, trackPageView } from './utils/analytics';
import BackToTop from './components/BackToTop';
import './App.css';

const PAGE_NAMES = {
  '/': 'Home',
  '/shop': 'Shop',
  '/cart': 'Cart',
  '/order': 'Order',
  '/about-me': 'About Me',
  '/programs': 'Programs',
  '/calorie-calculator': 'Calorie Calculator',
  '/guides': 'Guides',
  '/privacy-policy': 'Privacy Policy',
  '/about-us': 'About Us',
  '/feedback': 'Feedback',
};

function PageViewTracker() {
  const location = useLocation();
  React.useEffect(() => {
    const path = location.pathname || '/';
    const name = PAGE_NAMES[path] || (path.startsWith('/product/') ? 'Product Detail' : path.startsWith('/guides/') ? 'Guide' : path);
    trackPageView(path, name);
  }, [location.pathname]);
  return null;
}

function App() {
  // Track visitor on app load
  React.useEffect(() => {
    trackVisitor();
  }, []);

  return (
    <LanguageProvider>
      <AdminAuthProvider>
        <CartProvider>
          <Router>
          <PageViewTracker />
          <div className="App">
            {/* Skip to main content - accessibility */}
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <Routes>
              {/* Public Routes */}
              {/* Public Routes */}
              <Route path="/" element={
                <>
                  <Header />
                  <main id="main-content" tabIndex={-1}>
                    <Home />
                  </main>
                  <Footer />
                  <BackToTop />
                </>
              } />
              <Route path="/shop" element={
                <>
                  <Header />
                  <main id="main-content" tabIndex={-1}><Shop /></main>
                  <Footer />
                  <BackToTop />
                </>
              } />
              <Route path="/product/:id" element={
                <>
                  <Header />
                  <main id="main-content" tabIndex={-1}><ProductDetail /></main>
                  <Footer />
                  <BackToTop />
                </>
              } />
              <Route path="/cart" element={
                <>
                  <Header />
                  <main id="main-content" tabIndex={-1}><Cart /></main>
                  <Footer />
                  <BackToTop />
                </>
              } />
              <Route path="/order" element={
                <>
                  <Header />
                  <main id="main-content" tabIndex={-1}><Order /></main>
                  <Footer />
                  <BackToTop />
                </>
              } />
              <Route path="/contact" element={<Navigate to="/about-me" replace />} />
              <Route path="/feedback" element={
                <>
                  <Header />
                  <main id="main-content" tabIndex={-1}><Feedback /></main>
                  <Footer />
                  <BackToTop />
                </>
              } />
              <Route path="/about-me" element={
                <>
                  <Header />
                  <main id="main-content" tabIndex={-1}><AboutMe /></main>
                  <Footer />
                  <BackToTop />
                </>
              } />
              <Route path="/programs" element={
                <>
                  <Header />
                  <main id="main-content" tabIndex={-1}><Programs /></main>
                  <Footer />
                  <BackToTop />
                </>
              } />
              <Route path="/calorie-calculator" element={
                <>
                  <Header />
                  <main id="main-content" tabIndex={-1}><CalorieCalculator /></main>
                  <Footer />
                  <BackToTop />
                </>
              } />
              <Route path="/guides" element={
                <>
                  <Header />
                  <main id="main-content" tabIndex={-1}><Guides /></main>
                  <Footer />
                  <BackToTop />
                </>
              } />
              <Route path="/guides/:slug" element={
                <>
                  <Header />
                  <main id="main-content" tabIndex={-1}><GuideDetail /></main>
                  <Footer />
                  <BackToTop />
                </>
              } />
              <Route path="/privacy-policy" element={
                <>
                  <Header />
                  <main id="main-content" tabIndex={-1}><PrivacyPolicy /></main>
                  <Footer />
                  <BackToTop />
                </>
              } />
              <Route path="/about-us" element={
                <>
                  <Header />
                  <main id="main-content" tabIndex={-1}><AboutUs /></main>
                  <Footer />
                  <BackToTop />
                </>
              } />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedAdminRoute>
                  <AdminLayout />
                </ProtectedAdminRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="orders" element={<Orders />} />
                <Route path="products" element={<Products />} />
                <Route path="customers" element={<div>Customers Management (Coming Soon)</div>} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="contact-messages" element={<ContactMessages />} />
                <Route path="feedback" element={<AdminFeedback />} />
                <Route path="generator-stats" element={<GeneratorStats />} />
                <Route path="saved-programs" element={<SavedPrograms />} />
                <Route path="calorie-stats" element={<CalorieStats />} />
                <Route path="shipping" element={<div>Shipping Management (Coming Soon)</div>} />
                <Route path="support" element={<div>Support Management (Coming Soon)</div>} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<div>Admin Profile (Coming Soon)</div>} />
              </Route>
            </Routes>
          </div>
          </Router>
        </CartProvider>
      </AdminAuthProvider>
    </LanguageProvider>
  );
}

export default App;
