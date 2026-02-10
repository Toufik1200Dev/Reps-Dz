# PayPal fulfill-paid Flow & Error Location

## Request Flow

```
Browser (localhost:5173)
  │
  │  POST /api/programs/fulfill-paid  { order_id: "..." }
  ▼
Vite proxy (vite.config.js)
  │  proxy: /api → http://localhost:10000
  ▼
Backend (localhost:10000)
  │  app.use('/api/programs', programRoutes)   ← index.js:185
  │  router.post('/fulfill-paid', fulfillPaidProgram)   ← programRoutes.js:14
  ▼
fulfillPaidProgram (programController.js:1788)
  │  1. Validate order_id
  │  2. PendingPayPalOrder.findOne({ orderId })   ← line 1807
  │  3. capturePayPalOrder(orderId)   ← line 1816  ← ERROR THROWS HERE
  │  4. fulfillProgramFromPayPalData(pending)
  │  5. Return 200 + program
  ▼
capturePayPalOrder (paypalService.js:84)
  │  POST https://api-m.sandbox.paypal.com/v2/checkout/orders/{orderId}/capture
  │  PayPal returns 422 COMPLIANCE_VIOLATION
  │  → throws Error (paypalService.js:101)
  ▼
fulfillPaidProgram catch block (programController.js:1836)
  │  res.status(500).json({ message: error.message })
  ▼
Frontend Programs.jsx:141
  │  fetch().then() receives 500
  │  setError(data.message) → "Payment could not be completed..."
```

## Where the 500 Comes From

| File | Line | What happens |
|------|------|--------------|
| **Frontend** `Programs.jsx` | 141 | `fetch(API_CONFIG.getBaseURL() + '/programs/fulfill-paid', ...)` |
| **Frontend** `api.js` | 18-22 | `getBaseURL()` returns `/api` in dev → full URL: `/api/programs/fulfill-paid` |
| **Frontend** `vite.config.js` | 11-13 | Proxy `/api` → `http://localhost:10000` |
| **Backend** `index.js` | 185, 218 | `app.use('/api/programs', programRoutes)`, listens on port 10000 |
| **Backend** `programRoutes.js` | 14 | `router.post('/fulfill-paid', fulfillPaidProgram)` |
| **Backend** `programController.js` | 1816 | `capturePayPalOrder(orderId)` → **PayPal API fails** |
| **Backend** `paypalService.js` | 86-101 | PayPal returns 422 → throws Error |
| **Backend** `programController.js` | 1836-1841 | catch → `res.status(500).json({ message })` |

## Root Cause

The 500 is triggered because **PayPal's capture API** returns `422 COMPLIANCE_VIOLATION`. Your backend catches that, maps it to a user-friendly message, and returns 500.

**PayPal COMPLIANCE_VIOLATION** is usually caused by:
- Sandbox business account in a restricted country (e.g. Albania)
- Sandbox account requires "auto sweep" (contact PayPal support)
- Create new sandbox accounts with country = **United States**

## File Structure

```
Frontend/
  src/
    config/api.js          ← getBaseURL() = '/api' or production URL
    pages/Programs.jsx     ← handlePayPalApprove() fetches fulfill-paid (line 141)
  vite.config.js           ← proxy /api → localhost:10000

Backend/
  index.js                 ← app.use('/api/programs', programRoutes), PORT 10000
  routes/programRoutes.js  ← POST /fulfill-paid
  controllers/programController.js  ← fulfillPaidProgram, capturePayPalOrder call
  services/paypalService.js        ← captureOrder() calls PayPal API
  models/PendingPayPalOrder.js     ← stores orderId + form data
```
