# Blue Hour Coffee — Turning On Online Ordering

Your website already has the full ordering flow built in:

**Click a drink → "Add to Order" → cart drawer → "Checkout · Pickup".**

Right now "Checkout" shows *"Online ordering is being set up."* To make it take
real orders, you connect a free/low-cost Shopify account. You won't touch any
code — you just gather **3 things** and send them back, and they get pasted into
the config block at the top of the cart script in `index.html`:

```js
const BLUE_HOUR_SHOP = {
  domain: 'YOUR-SHOP.myshopify.com',
  storefrontToken: 'YOUR_STOREFRONT_ACCESS_TOKEN',
  apiVersion: '2025-10',
  variants: { 'Banana Foster Latte': 'YOUR_VARIANT_ID', ... },
};
```

Plan on ~60–90 minutes. Have your phone for two-factor codes.

---

## Step 1 — Sign up for Shopify
1. Go to **shopify.com → Start free trial**.
2. Store name: `Blue Hour Coffee`. Shopify gives you a URL like
   `blue-hour-coffee.myshopify.com` — **write it down** (that's value #1).
3. Pick the **Basic** plan. (The $5 Starter plan charges a 5% fee per drink and
   blocks the pickup-scheduling apps you may want later. Basic is the sweet spot.)

## Step 2 — Add the 9 drinks (Products → Add product)
For **each** drink: Title + Description + Price, then:
- **Uncheck "Track quantity"** (made to order)
- **UNCHECK "This is a physical product"** ← critical: this forces pickup, no shipping
- Status: **Active** → **Save**

| Title | Price |
|---|---|
| Banana Foster Latte | 6.50 |
| Vanilla Latte | 5.75 |
| Mont Blanc | 6.50 |
| Ube Matcha | 6.75 |
| Black Sesame Matcha | 6.75 |
| Vanilla Matcha | 6.25 |
| Espresso Tonic | 5.75 |
| Lemon Green Tea | 5.50 |
| Hibiscus Lime | 5.50 |

> Prices above match what's on the site now — change any you like; just tell me
> so the displayed price stays in sync with what Shopify charges.

## Step 3 — Turn on Local Pickup
1. **Settings → Locations** — make sure a location exists with address
   **2410 N Murray Ave, Milwaukee, WI 53211** and "Fulfill online orders" ON.
2. **Settings → Shipping and delivery → Pickup in store** → click that location →
   toggle **"This location offers pickup"** → set "Usually ready in 30 minutes" → Save.

## Step 4 — Disable shipping
**Settings → Shipping and delivery → General profile → Manage rates** → delete every
shipping zone → Save. (Combined with Step 2, this makes checkout pickup-only.)

## Step 5 — Enable the storefront connection
**Settings → Apps and sales channels → Develop apps → Create an app**
(name it `Blue Hour Website`).
- Tab **Configuration → Storefront API integration → Configure** → check:
  `unauthenticated_read_product_listings`,
  `unauthenticated_read_checkouts`, `unauthenticated_write_checkouts` → Save.
- Tab **API credentials → Install app** → copy the **Storefront API access token**
  (long string). **That's value #2.**

## Step 6 — Get each drink's Variant ID (value #3 — one per drink)
**Products →** open a drink. Look at the page's **Variants** section and click
**"Default Title"** — the URL becomes:
`.../products/123.../variants/45678901234567`
The number after `/variants/` is the Variant ID.
(Shortcut: add `.json` to a product's URL, press Enter, search for `"variants"`,
the first `"id"` is it.)

---

## Step 7 — Send these back
```
1. Store domain:        __________________.myshopify.com
2. Storefront token:    __________________________________________
3. Variant IDs:
   Banana Foster Latte: _______________
   Vanilla Latte:       _______________
   Mont Blanc:          _______________
   Ube Matcha:          _______________
   Black Sesame Matcha: _______________
   Vanilla Matcha:      _______________
   Espresso Tonic:      _______________
   Lemon Green Tea:     _______________
   Hibiscus Lime:       _______________
```

Once I paste those in, the "Checkout" button sends customers to Shopify's secure
checkout, orders appear under **Orders** in your Shopify admin, and you'll get an
email. When a drink's made, open the order → **Mark as ready for pickup** to notify
the customer.

**Test first:** place a real order on the live site, then refund yourself in Shopify
(instant) to confirm the receipt + pickup emails read well before you announce it.

---

### Notes
- The token is **public/read-only by design** — safe to live in the website.
- To pause online ordering (rush, machine down): flip any drink to **Draft**, or ask
  me to add a one-line "ordering paused" banner you can toggle.
- `apiVersion` is set to `2025-10`; if Shopify ever retires it, bump it to a current
  version in the same config block.
