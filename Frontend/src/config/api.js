// API Configuration
// IMPORTANT: Update PRODUCTION_URL after deploying backend on Render
// For PayPal: add VITE_PAYPAL_CLIENT_ID to .env (same as backend PAYPAL_CLIENT_ID for sandbox/live)
export const API_CONFIG = {
  PAYPAL_CLIENT_ID: import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
  // Production backend URL (Render)
  PRODUCTION_URL: 'https://reps-dz.onrender.com/api',
  
  // Firebase frontend URL
  FRONTEND_URL: 'https://reps-dz.web.app',
  
  // Development backend URL (localhost)
  DEVELOPMENT_URL: 'http://localhost:5000/api',
  
  // Get the appropriate URL based on environment
  // In dev: use relative /api so Vite proxy forwards to the deployed backend (no need to run backend locally)
  // In prod: use full production URL
  getBaseURL: () => {
    if (import.meta.env.PROD) {
      return API_CONFIG.PRODUCTION_URL;
    }
    return '/api';
  }
};

export default API_CONFIG;
