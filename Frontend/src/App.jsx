import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/header/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Order from './pages/Order';
import ContactUs from './pages/ContactUs';
import Programs from './pages/Programs';
import CalorieCalculator from './pages/CalorieCalculator';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Orders from './pages/admin/Orders';
import Products from './pages/admin/Products';
import Analytics from './pages/admin/Analytics';
import GeneratorStats from './pages/admin/GeneratorStats';
import CalorieStats from './pages/admin/CalorieStats';
import ContactMessages from './pages/admin/ContactMessages';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { CartProvider } from './contexts/CartContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { trackVisitor } from './utils/analytics';
import './App.css';

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
          <div className="App">
            <Routes>
              {/* Public Routes */}
              {/* Public Routes */}
              <Route path="/" element={
                <>
                  <Header />
                  <main>
                    <Home />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/shop" element={
                <>
                  <Header />
                  <main>
                    <Shop />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/product/:id" element={
                <>
                  <Header />
                  <main>
                    <ProductDetail />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/cart" element={
                <>
                  <Header />
                  <main>
                    <Cart />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/order" element={
                <>
                  <Header />
                  <main>
                    <Order />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/contact" element={
                <>
                  <Header />
                  <main>
                    <ContactUs />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/programs" element={
                <>
                  <Header />
                  <main>
                    <Programs />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/calorie-calculator" element={
                <>
                  <Header />
                  <main>
                    <CalorieCalculator />
                  </main>
                  <Footer />
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
                <Route path="generator-stats" element={<GeneratorStats />} />
                <Route path="calorie-stats" element={<CalorieStats />} />
                <Route path="shipping" element={<div>Shipping Management (Coming Soon)</div>} />
                <Route path="support" element={<div>Support Management (Coming Soon)</div>} />
                <Route path="settings" element={<div>Settings (Coming Soon)</div>} />
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
