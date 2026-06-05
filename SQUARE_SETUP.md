# Blue Hour Coffee — Turn On Online Ordering (Square)

Your site already has the full ordering flow: click a drink → **Add to Order** →
cart drawer → **Checkout · Pickup**. The checkout button calls a small serverless
function (`api/checkout.js`) that creates a **Square hosted payment link** and sends
the customer to Square's secure checkout. Paid orders land in your Square POS /
Dashboard as **pickup** orders.

You don't touch any code. You gather **3 values** from Square and paste them into
Vercel as environment variables. ~30–45 min.

> How it's wired: card payment happens on a Square-hosted page (no card fields on
> your site → no PCI burden on you). Your menu prices are sent as line items, so you
> do **not** need to build a Square catalog.

---

## Step 1 — Make sure you have a Square account
If you already take payments on a Square reader/POS, you're set. Otherwise sign up
free at **squareup.com** and add your business + the 2410 N Murray location.

## Step 2 — Create a Square app (to get API keys)
1. Go to **developer.squareup.com/apps** and sign in with your Square account.
2. Click **+ (Create your first application)**, name it `Blue Hour Website`, **Create**.
3. You're now on the app's page with two tabs that matter: **Sandbox** (for testing)
   and **Production** (real money). Start in **Sandbox**.

## Step 3 — Grab the 3 values
On the app page (use the **Sandbox** column first, then repeat for **Production**):

1. **Access token** — under *Credentials*, copy the **Access token**
   (Sandbox token starts with `EAAA…`). → this is `SQUARE_ACCESS_TOKEN`
2. **Location ID** — open the **Locations** tab (or
   **squareup.com/dashboard → Account & Settings → Business → Locations**), click your
   location, copy its **Location ID** (looks like `L1A2B3C4D5E6F`).
   → this is `SQUARE_LOCATION_ID`
3. **Environment** — the word `sandbox` while testing, later `production`.
   → this is `SQUARE_ENV`

> ⚠️ The Access token is **secret**. Never put it in the website code or share it.
> It only ever lives in Vercel's environment variables (server-side).

## Step 4 — Add them to Vercel
1. Go to **vercel.com → your Blue Hour project → Settings → Environment Variables**.
2. Add three variables (Environment: **Production**, and also **Preview** if you want
   test deploys to work):

   | Name | Value |
   |---|---|
   | `SQUARE_ACCESS_TOKEN` | *(your Sandbox token to test, Production token to go live)* |
   | `SQUARE_LOCATION_ID`  | *(your location id)* |
   | `SQUARE_ENV`          | `sandbox` *(then `production` when ready)* |

3. Click **Save**, then **Deployments → ⋯ → Redeploy** the latest one so the new
   variables take effect.

## Step 5 — Test it (sandbox)
1. On the live site, add a drink → **Checkout · Pickup**.
2. You should land on a Square checkout page. With `SQUARE_ENV=sandbox`, pay using
   Square's test card: **4111 1111 1111 1111**, any future expiry, any CVV, any ZIP.
3. Confirm the order appears in your **Square Sandbox Dashboard → Orders**.

## Step 6 — Go live
1. In Vercel, change `SQUARE_ACCESS_TOKEN` to your **Production** token and
   `SQUARE_ENV` to `production` (use the production Location ID too). **Redeploy.**
2. Place one **real** order on the live site, then refund yourself in the Square
   Dashboard (instant) to confirm receipts read well.

---

### Day-to-day
- **Where orders show up:** Square Dashboard → **Orders** (and your POS). Each is a
  PICKUP order at 2410 N Murray.
- **Marking ready:** open the order → mark it prepared/ready; Square handles the
  customer receipt.
- **Pause ordering** (rush / machine down): in Vercel, temporarily delete the
  `SQUARE_ACCESS_TOKEN` variable and redeploy — checkout will show a friendly
  "not set up yet" message instead of charging. Or ask me to add a one-click banner.
- **Prices:** the amount charged comes from each drink's `data-price` in `index.html`.
  If you change a price in the HTML, that's what Square charges — they stay in sync
  automatically. Tell me and I'll update them.

### What I built
- `api/checkout.js` — Vercel serverless function; creates the Square payment link.
- `index.html` cart `checkout()` — POSTs the cart to `/api/checkout` and redirects
  to the returned Square URL.
- API version pinned to `Square-Version: 2026-01-22`; bump it in `api/checkout.js`
  if Square ever retires it.
