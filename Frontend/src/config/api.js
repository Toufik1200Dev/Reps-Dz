// API Configuration
// IMPORTANT: Update PRODUCTION_URL after deploying backend on Render
export const API_CONFIG = {
  // Production backend URL (Render) - Update this with your Render URL after deployment
  PRODUCTION_URL: 'https://YOUR-SERVICE-NAME.onrender.com/api',
  
  // Firebase frontend URL
  FRONTEND_URL: 'https://reps-dz.web.app',
  
  // Development backend URL (localhost)
  DEVELOPMENT_URL: 'http://localhost:5000/api',
  
  // Get the appropriate URL based on environment
  getBaseURL: () => {
    if (import.meta.env.PROD) {
      return API_CONFIG.PRODUCTION_URL;
    }
    return API_CONFIG.DEVELOPMENT_URL;
  }
};

export default API_CONFIG;
