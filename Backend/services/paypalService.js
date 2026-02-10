/**
 * PayPal Orders API - create and capture orders.
 * Uses REST API directly. Requires PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.
 * Set PAYPAL_MODE=sandbox for testing, or production for live.
 */

const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error_description || err.error || `PayPal auth failed: ${response.status}`;
    if (msg.toLowerCase().includes('authentication') || msg.toLowerCase().includes('client')) {
      throw new Error('PayPal Client Authentication failed. In Backend .env, PAYPAL_CLIENT_SECRET must be the app Secret (not the Client ID). Get it from: https://developer.paypal.com/dashboard/applications/sandbox → your app → Show Secret.');
    }
    throw new Error(msg);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a PayPal order. Returns { id } (orderId).
 */
async function createOrder(amount, currency = 'USD', customId = '6week') {
  const accessToken = await getAccessToken();

  const body = {
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: currency,
        value: String((amount / 100).toFixed(2)) // amount in dollars, e.g. 2998 cents -> 29.98
      },
      custom_id: customId
    }],
    application_context: {
      brand_name: 'Toufik Calisthenics',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW'
    }
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || err.details?.[0]?.description || `PayPal create order failed: ${response.status}`);
  }

  const data = await response.json();
  return { id: data.id, status: data.status };
}

/**
 * Capture a PayPal order. Returns capture details.
 */
async function captureOrder(orderId) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error('PayPal capture API error:', JSON.stringify(err));
    const msg = err.message || err.details?.[0]?.description || err.details?.[0]?.issue || `PayPal capture failed: ${response.status}`;
    const name = err.name || err.details?.[0]?.issue || '';
    if (name === 'INVALID_REQUEST' || (typeof msg === 'string' && (msg.includes('semantically incorrect') || msg.includes('business validation')))) {
      throw new Error('Payment could not be completed. The order may already be captured, expired, or invalid. Please try again with a new payment.');
    }
    throw new Error(msg);
  }

  const data = await response.json();
  return data;
}

module.exports = { createOrder, captureOrder, getAccessToken };
