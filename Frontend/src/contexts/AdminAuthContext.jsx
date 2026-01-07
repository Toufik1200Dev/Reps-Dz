import React, { createContext, useContext, useState } from 'react';
import { adminAPI } from '../services/api';

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

  const login = async (password) => {
    const result = await adminAPI.login(password);
    if (result.success) {
      setIsAdminAuthenticated(true);
      setAdminPassword(password);
      return true;
    }
    return false;
  };

  const logout = () => {
    adminAPI.logout();
    setIsAdminAuthenticated(false);
    setAdminPassword('');
    localStorage.removeItem('adminPassword');
  };

  const checkAuth = async () => {
    const storedPassword = localStorage.getItem('adminPassword');
    if (storedPassword) {
      // Verify with backend that the stored password is still valid
      try {
        const result = await adminAPI.login(storedPassword);
        if (result.success) {
          setIsAdminAuthenticated(true);
          setAdminPassword(storedPassword);
          return true;
        } else {
          // Password is invalid, clear it
          localStorage.removeItem('adminPassword');
          setIsAdminAuthenticated(false);
          setAdminPassword('');
          return false;
        }
      } catch (error) {
        // On error, clear stored password for security
        localStorage.removeItem('adminPassword');
        setIsAdminAuthenticated(false);
        setAdminPassword('');
        return false;
      }
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
