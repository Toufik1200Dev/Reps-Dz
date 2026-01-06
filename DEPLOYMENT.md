# 🚀 Deployment Guide - Shoppy Barz

Complete guide to deploy your application on Render (Backend) and Firebase (Frontend).

---

## 📋 Prerequisites

Before deploying, make sure you have:
- ✅ GitHub account with your code pushed
- ✅ MongoDB Atlas account (free tier)
- ✅ Cloudinary account (free tier)
- ✅ Render account (free tier)
- ✅ Firebase account (free tier)

---

## 🔧 Backend Deployment on Render

### Step 1: Prepare MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user (remember username & password)
4. Get your connection string:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/shoppy-barz?retryWrites=true&w=majority
   ```
5. Add `0.0.0.0/0` to Network Access (allow all IPs for Render)

### Step 2: Prepare Cloudinary

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for free account
3. Go to Dashboard → Copy these values:
   - Cloud Name
   - API Key
   - API Secret

### Step 3: Deploy on Render

1. **Push code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Go to Render Dashboard**
   - Visit [render.com](https://render.com)
   - Sign up/Login with GitHub

3. **Create New Web Service**
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will auto-detect `Backend/render.yaml`
   - Click "Apply"

4. **Set Environment Variables** in Render Dashboard:
   
   Go to your service → Environment tab → Add these variables:
   
   ```env
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/shoppy-barz?retryWrites=true&w=majority
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   FRONTEND_URL=https://YOUR_FIREBASE_URL.web.app
   JWT_SECRET=your-super-secret-random-string-here
   ADMIN_PASSWORD=your-secure-admin-password
   ```
   
   **Important:**
   - Replace all placeholder values with your actual credentials
   - Use a strong random string for `JWT_SECRET` (you can generate one online)
   - Use a strong password for `ADMIN_PASSWORD`
   - `FRONTEND_URL` will be your Firebase URL (you'll get this after deploying frontend)

5. **Deploy**
   - Render will automatically deploy
   - Wait 2-3 minutes for first deployment
   - Your backend URL will be: `https://YOUR-SERVICE-NAME.onrender.com`

6. **Verify Backend**
   - Check logs in Render dashboard
   - Test your API: `https://YOUR-SERVICE-NAME.onrender.com/api/products`
   - Should return JSON response

### Step 4: Update Frontend API Config

After backend is deployed, update `Frontend/src/config/api.js`:

```javascript
PRODUCTION_URL: 'https://YOUR-SERVICE-NAME.onrender.com/api',
```

---

## 🔥 Frontend Deployment on Firebase

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Initialize Firebase (if not already done)

```bash
cd Frontend
firebase init
```

**Select:**
- ✅ Hosting
- ✅ Use existing project (or create new)
- ✅ Public directory: `dist`
- ✅ Single-page app: `Yes`
- ✅ Don't overwrite `firebase.json`: `No`

### Step 4: Update API Configuration

Edit `Frontend/src/config/api.js` with your Render backend URL:

```javascript
PRODUCTION_URL: 'https://YOUR-SERVICE-NAME.onrender.com/api',
```

### Step 5: Build Frontend

```bash
cd Frontend
npm install
npm run build
```

This creates the `dist` folder with production files.

### Step 6: Deploy to Firebase

```bash
firebase deploy --only hosting
```

### Step 7: Get Your Firebase URL

After deployment, Firebase will give you a URL like:
- `https://YOUR-PROJECT-ID.web.app`
- `https://YOUR-PROJECT-ID.firebaseapp.com`

### Step 8: Update Backend CORS

Go back to Render → Environment Variables:
- Update `FRONTEND_URL` with your Firebase URL

Render will automatically redeploy.

---

## ✅ Post-Deployment Checklist

- [ ] Backend is running on Render
- [ ] Frontend is deployed on Firebase
- [ ] Backend `FRONTEND_URL` is updated with Firebase URL
- [ ] Frontend `PRODUCTION_URL` is updated with Render URL
- [ ] Test API endpoints work
- [ ] Test frontend can communicate with backend
- [ ] Admin panel is accessible
- [ ] Products can be added/edited
- [ ] Orders can be placed

---

## 🔒 Security Checklist

- [ ] Strong `JWT_SECRET` is set (random 32+ characters)
- [ ] Strong `ADMIN_PASSWORD` is set
- [ ] MongoDB password is strong
- [ ] Environment variables are NOT in code
- [ ] `.env` files are in `.gitignore`

---

## 🐛 Troubleshooting

### Backend Issues

**Problem: Build fails**
- Check logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

**Problem: MongoDB connection fails**
- Check MongoDB Atlas Network Access (allow all IPs)
- Verify connection string format
- Check username/password are correct

**Problem: CORS errors**
- Verify `FRONTEND_URL` matches your Firebase URL exactly
- Check backend CORS configuration

### Frontend Issues

**Problem: Build fails**
- Check for errors in terminal
- Ensure all dependencies are installed
- Check for TypeScript/ESLint errors

**Problem: API calls fail**
- Verify `PRODUCTION_URL` in `api.js` matches Render URL
- Check browser console for errors
- Verify backend is running

**Problem: Images not loading**
- Check Cloudinary configuration
- Verify `CLOUDINARY_CLOUD_NAME` is correct
- Check image URLs in database

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **Firebase Docs**: https://firebase.google.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Cloudinary Docs**: https://cloudinary.com/documentation

---

## 🎯 Quick Commands Reference

```bash
# Backend (Local Development)
cd Backend
npm install
npm run dev

# Frontend (Local Development)
cd Frontend
npm install
npm run dev

# Frontend (Build for Production)
cd Frontend
npm run build

# Frontend (Deploy to Firebase)
cd Frontend
firebase deploy --only hosting

# Check Render Logs
# Go to Render Dashboard → Your Service → Logs

# Check Firebase Logs
firebase hosting:channel:list
```

---

**🎉 Your app is now live!** Visit your Firebase URL to see it in action.
