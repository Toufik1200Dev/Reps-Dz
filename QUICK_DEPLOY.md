# ⚡ Quick Deployment Checklist

## 🚀 Backend on Render (5 steps)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Go to Render.com**
   - New → Blueprint
   - Connect GitHub repo
   - Auto-detects `render.yaml`

3. **Set Environment Variables** (in Render Dashboard):
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/shoppy-barz?...
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   FRONTEND_URL=https://YOUR-FIREBASE-URL.web.app
   JWT_SECRET=random-32-char-string
   ADMIN_PASSWORD=secure-password
   ```

4. **Deploy** - Render does it automatically

5. **Copy your Render URL**: `https://your-service.onrender.com`

---

## 🔥 Frontend on Firebase (4 steps)

1. **Update API Config**
   - Edit `Frontend/src/config/api.js`
   - Set `PRODUCTION_URL` to your Render URL

2. **Build**
   ```bash
   cd Frontend
   npm run build
   ```

3. **Deploy**
   ```bash
   firebase deploy --only hosting
   ```

4. **Update Backend CORS**
   - Go to Render → Environment
   - Update `FRONTEND_URL` with Firebase URL

---

## ✅ Done!
Visit your Firebase URL 🎉
