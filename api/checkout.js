// Blue Hour Coffee — Square checkout (Vercel serverless function)
//
// Turns the site cart into a Square-hosted payment link for pickup.
// The browser POSTs { items: [{ name, price, qty }] }; we build a Square
// order with PICKUP fulfillment, create a payment link, and return its URL.
// The browser then redirects the customer to Square's secure checkout page.
//
// Required Vercel environment variables (Project → Settings → Environment Variables):
//   SQUARE_ACCESS_TOKEN  — your Square access token (KEEP SECRET; server-only)
//   SQUARE_LOCATION_ID   — the Square location id orders should post to
//   SQUARE_ENV           — "sandbox" while testing, "production" when live (default: production)
//
// No npm install needed: uses Node's built-in fetch + crypto on Vercel.

const { randomUUID } = require('node:crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const isSandbox = (process.env.SQUARE_ENV || '').toLowerCase() === 'sandbox';

  if (!token || !locationId) {
    return res.status(500).json({ error: 'Online ordering isn’t set up yet.' });
  }

  // Parse the cart (Vercel usually pre-parses JSON; handle string too)
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const items = (body && Array.isArray(body.items)) ? body.items : [];
  if (items.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  // Build Square line items. When the browser supplies a Square catalog id
  // (variationId), we charge by that — so the PRICE COMES FROM SQUARE, not the
  // client (authoritative + tamper-proof). If there's no catalog id (Square
  // catalog not set up yet), we fall back to an ad-hoc line priced from the site.
  let lineItems;
  try {
    lineItems = items.map((it) => {
      const qty = Math.max(1, parseInt(it.qty, 10) || 1);
      if (it.variationId && /^[A-Za-z0-9]/.test(String(it.variationId))) {
        return { catalog_object_id: String(it.variationId), quantity: String(qty) };
      }
      const cents = Math.round(Number(it.price) * 100);
      if (!it.name || !Number.isFinite(cents) || cents <= 0) throw new Error('bad item');
      return {
        name: String(it.name).slice(0, 500),
        quantity: String(qty),
        base_price_money: { amount: cents, currency: 'USD' },
      };
    });
  } catch (e) {
    return res.status(400).json({ error: 'There was a problem with an item in your cart.' });
  }

  const pickupAt = new Date(Date.now() + 20 * 60 * 1000).toISOString(); // ~20 min out

  const payload = {
    idempotency_key: randomUUID(),
    order: {
      location_id: locationId,
      line_items: lineItems,
      fulfillments: [
        {
          type: 'PICKUP',
          state: 'PROPOSED',
          pickup_details: {
            recipient: { display_name: 'Online Pickup Order' },
            schedule_type: 'ASAP',
            pickup_at: pickupAt,
          },
        },
      ],
    },
    checkout_options: {
      ask_for_shipping_address: false,
      redirect_url: 'https://www.bluehourcoffee.com/?order=success',
    },
    payment_note: 'Blue Hour online pickup order',
  };

  const base = isSandbox
    ? 'https://connect.squareupsandbox.com'
    : 'https://connect.squareup.com';

  try {
    const r = await fetch(base + '/v2/online-checkout/payment-links', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Square-Version': '2026-01-22',
      },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    const url = data && data.payment_link && data.payment_link.url;
    if (!r.ok || !url) {
      const msg = data && data.errors && data.errors[0] && data.errors[0].detail;
      console.error('Square error:', JSON.stringify(data));
      return res.status(502).json({ error: msg || 'Could not start checkout.' });
    }
    return res.status(200).json({ url });
  } catch (e) {
    console.error('Checkout exception:', e);
    return res.status(500).json({ error: 'Network problem starting checkout.' });
  }
};
