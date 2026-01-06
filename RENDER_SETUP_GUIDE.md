# 🚀 Render Setup Guide - Step by Step

## 📝 How to Fill Out Render Web Service Form

### **Name**
```
Reps-Dz-Backend
```
*Or any name you prefer for your backend service*

---

### **Project** (Optional)
Leave as default or create a new project later.

---

### **Environment**
Leave as default (will be created).

---

### **Language**
```
Node
```
✅ Already selected - This is correct!

---

### **Branch**
```
main
```
✅ Already selected - This is correct!

---

### **Region**
```
Oregon (US West)
```
✅ You can keep this or choose a region closer to your users.

---

### **Root Directory** ⚠️ IMPORTANT!
```
Backend
```
**This is CRITICAL!** Your backend code is in the `Backend` folder, so you must specify this.

---

### **Build Command** ⚠️ CHANGE THIS!
**Current (Wrong):**
```
yarn
```

**Change to:**
```
npm install
```

---

### **Start Command** ⚠️ CHANGE THIS!
**Current (Wrong):**
```
yarn start
```

**Change to:**
```
npm start
```

---

### **Instance Type**
```
Free
```
✅ Good for starting out. You can upgrade later if needed.

---

### **Environment Variables** ⚠️ VERY IMPORTANT!

Click **"Add Environment Variable"** and add these one by one:

#### 1. NODE_ENV
```
NAME: NODE_ENV
VALUE: production
```

#### 2. PORT
```
NAME: PORT
VALUE: 10000
```

#### 3. MONGODB_URI
```
NAME: MONGODB_URI
VALUE: mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/shoppy-barz?retryWrites=true&w=majority
```
⚠️ Replace `YOUR_USERNAME`, `YOUR_PASSWORD`, and `YOUR_CLUSTER` with your actual MongoDB Atlas credentials!

#### 4. CLOUDINARY_CLOUD_NAME
```
NAME: CLOUDINARY_CLOUD_NAME
VALUE: your_cloudinary_cloud_name
```
⚠️ Replace with your actual Cloudinary cloud name.

#### 5. CLOUDINARY_API_KEY
```
NAME: CLOUDINARY_API_KEY
VALUE: your_cloudinary_api_key
```
⚠️ Replace with your actual Cloudinary API key.

#### 6. CLOUDINARY_API_SECRET
```
NAME: CLOUDINARY_API_SECRET
VALUE: your_cloudinary_api_secret
```
⚠️ Replace with your actual Cloudinary API secret.

#### 7. FRONTEND_URL
```
NAME: FRONTEND_URL
VALUE: https://reps-dz.web.app
```
✅ This is correct - matches your Firebase URL.

#### 8. JWT_SECRET
```
NAME: JWT_SECRET
VALUE: generate-a-random-32-character-string-here
```
⚠️ Generate a random secret string (you can use an online generator or create one).

#### 9. ADMIN_PASSWORD
```
NAME: ADMIN_PASSWORD
VALUE: your-secure-admin-password
```
⚠️ Set a strong password for admin panel access.

---

## ✅ Final Checklist Before Clicking "Create Web Service"

- [ ] **Root Directory**: `Backend` ✅
- [ ] **Build Command**: `npm install` ✅
- [ ] **Start Command**: `npm start` ✅
- [ ] **NODE_ENV**: `production` ✅
- [ ] **PORT**: `10000` ✅
- [ ] **MONGODB_URI**: Your MongoDB connection string ✅
- [ ] **CLOUDINARY_CLOUD_NAME**: Your cloud name ✅
- [ ] **CLOUDINARY_API_KEY**: Your API key ✅
- [ ] **CLOUDINARY_API_SECRET**: Your API secret ✅
- [ ] **FRONTEND_URL**: `https://reps-dz.web.app` ✅
- [ ] **JWT_SECRET**: Random secret string ✅
- [ ] **ADMIN_PASSWORD**: Secure password ✅

---

## 🎯 After Creating the Service

1. **Wait for Deployment** (2-3 minutes)
2. **Check Logs** - Go to "Logs" tab to see if deployment succeeded
3. **Get Your Backend URL** - It will be: `https://reps-dz-backend.onrender.com` (or similar)
4. **Test Your API** - Visit: `https://YOUR-SERVICE-NAME.onrender.com/api/products`

---

## 🔗 Next Steps

After backend is deployed:

1. **Update Frontend API Config**
   - Edit `Frontend/src/config/api.js`
   - Set `PRODUCTION_URL` to your Render backend URL

2. **Deploy Frontend to Firebase**
   ```bash
   cd Frontend
   npm run build
   firebase deploy --only hosting
   ```

3. **Update Backend CORS** (if needed)
   - The backend is already configured for `reps-dz.web.app`
   - Should work automatically!

---

## 🆘 Troubleshooting

**Build Fails?**
- Check logs in Render dashboard
- Verify Root Directory is `Backend`
- Verify Build Command is `npm install`

**MongoDB Connection Fails?**
- Check MongoDB Atlas Network Access (add `0.0.0.0/0`)
- Verify connection string format
- Check username/password

**CORS Errors?**
- Verify `FRONTEND_URL` matches your Firebase URL exactly
- Check backend logs for CORS errors

---

**Ready? Click "Create Web Service" and wait for deployment!** 🚀
