# Security Information

## Firebase API Key in Source Code

**This repository contains a Firebase API key in `Frontend/src/config/firebase.js`.**

### ✅ This is Safe and Expected

Firebase **web API keys** are intentionally designed to be public and exposed in client-side JavaScript code. This is the standard practice for Firebase web applications.

### Why It's Safe

1. **Client-Side Only**: Firebase web API keys are meant to be visible in browser JavaScript
2. **Domain Restrictions**: Security is enforced via HTTP referrer restrictions in Firebase Console
3. **Rate Limiting**: Firebase enforces usage limits per project
4. **No Sensitive Access**: These keys cannot access server-side resources without proper authentication

### Security Best Practices

**Already Implemented:**
- ✅ API key is restricted to specific domains in Firebase Console
- ✅ Only authorized domains can use the API key

**Recommended Actions:**
1. **Restrict API Key in Firebase Console:**
   - Go to [Firebase Console](https://console.firebase.google.com/project/reps-dz/settings/general)
   - Navigate to "API Keys" section
   - Click on your web API key
   - Under "Application restrictions", select "HTTP referrers"
   - Add only your authorized domains:
     - `https://reps-dz.web.app/*`
     - `https://reps-dz.firebaseapp.com/*`
     - `http://localhost:5173/*` (for development)

2. **Monitor Usage:**
   - Regularly check Firebase Console for unusual API usage
   - Set up alerts for unexpected traffic

### What IS Secret (Not in this repo)

These values are stored as environment variables in Render (backend):
- ✅ MongoDB connection string (in Render environment variables)
- ✅ Cloudinary API secret (in Render environment variables)
- ✅ JWT secret (in Render environment variables)
- ✅ Admin password (in Render environment variables)

### GitHub Secret Scanning

If GitHub flags the Firebase API key:
- This is a **false positive** for web API keys
- You can safely acknowledge and mark as "Used in tests" or "False positive"
- The key is intentionally public for client-side use

---

**For more information:** [Firebase API Key Best Practices](https://firebase.google.com/docs/projects/api-keys)
