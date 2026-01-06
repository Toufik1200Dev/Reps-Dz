import React, { createContext, useContext, useState } from 'react';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const login = (password) => {
    if (password === 'admin123') {
      setIsAdminAuthenticated(true);
      setAdminPassword(password);
      localStorage.setItem('adminPassword', password);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdminAuthenticated(false);
    setAdminPassword('');
    localStorage.removeItem('adminPassword');
  };

  const checkAuth = () => {
    const storedPassword = localStorage.getItem('adminPassword');
    if (storedPassword === 'admin123') {
      setIsAdminAuthenticated(true);
      setAdminPassword(storedPassword);
      return true;
    }
    return false;
  };

  const getAuthHeaders = () => {
    return {
      'adminPassword': adminPassword
    };
  };

  const value = {
    isAdminAuthenticated,
    adminPassword,
    login,
    logout,
    checkAuth,
    getAuthHeaders
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
