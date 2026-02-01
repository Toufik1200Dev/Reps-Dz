import React, { useState } from 'react';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingCart,
  People,
  Inventory,
  Assessment,
  Settings,
  Notifications,
  AccountCircle,
  LocalShipping,
  ContactSupport,
  Logout,
  Close,
  FitnessCenter,
  Calculate,
  Email,
  Description
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/logo/logo.png';

const menuItems = [
  { text: 'Products', icon: <Inventory />, path: '/admin/products' },
  { text: 'Orders', icon: <ShoppingCart />, path: '/admin/orders' },
  { text: 'Contact Messages', icon: <Email />, path: '/admin/contact-messages' },
  { text: 'Analytics', icon: <Assessment />, path: '/admin/analytics' },
  { text: 'Generator Stats', icon: <FitnessCenter />, path: '/admin/generator-stats' },
  { text: 'Saved Programs', icon: <Description />, path: '/admin/saved-programs' },
  { text: 'Calorie Stats', icon: <Calculate />, path: '/admin/calorie-stats' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-black text-white">
      <div className="p-6 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src={logo} alt="REPS-DZ" className="w-10 h-10 object-contain rounded-lg" />
          <div>
            <h1 className="font-display font-bold text-xl tracking-wider text-secondary">REPS-DZ</h1>
            <span className="text-xs text-gray-400 uppercase tracking-widest block">Admin Panel</span>
          </div>
        </div>
        <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
          <Close className="text-gray-400 hover:text-white" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.text}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-secondary text-black font-bold shadow-lg shadow-gold/20'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
            >
              <span className={isActive ? 'text-black' : 'text-gray-400 group-hover:text-white'}>
                {item.icon}
              </span>
              <span>{item.text}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <Logout />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 z-50 md:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0 fixed h-full z-30">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64 min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-6 py-4 flex items-center justify-between shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-gray-500 hover:text-black"
          >
            <MenuIcon />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <button className="relative p-2 text-gray-400 hover:text-black transition-colors">
              <Notifications />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-3 p-1 rounded-full hover:bg-gray-100 transition-colors border border-gray-100 pr-4"
              >
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-black font-bold">
                  RD
                </div>
                <span className="hidden sm:block text-sm font-bold text-gray-700">Admin</span>
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {profileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setProfileMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-2"
                    >
                      <button onClick={() => navigate('/admin/profile')} className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-black flex items-center gap-2">
                        <AccountCircle className="text-lg" /> Profile
                      </button>
                      <button onClick={() => navigate('/admin/settings')} className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-black flex items-center gap-2">
                        <Settings className="text-lg" /> Settings
                      </button>
                      <div className="h-px bg-gray-100 my-1" />
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
                        <Logout className="text-lg" /> Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
