// Blue Hour Coffee — live menu from Square (Vercel serverless function)
//
// Returns your Square catalog items so the website shows the SAME prices Square
// charges. The browser fetches this on load and updates each drink's price +
// Square catalog id. If Square has no catalog (or isn't reachable), it returns an
// empty list and the site quietly falls back to its built-in prices.
//
// Uses the same env vars as checkout: SQUARE_ACCESS_TOKEN, SQUARE_ENV.

const SQUARE_VERSION = '2026-01-22';

module.exports = async function handler(req, res) {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const isSandbox = (process.env.SQUARE_ENV || '').toLowerCase() === 'sandbox';
  if (!token) return res.status(200).json({ items: [] });

  const base = isSandbox
    ? 'https://connect.squareupsandbox.com'
    : 'https://connect.squareup.com';

  try {
    const r = await fetch(base + '/v2/catalog/list?types=ITEM', {
      headers: { 'Authorization': 'Bearer ' + token, 'Square-Version': SQUARE_VERSION },
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('Square catalog error:', JSON.stringify(data));
      return res.status(200).json({ items: [] });
    }

    const items = [];
    for (const obj of (data.objects || [])) {
      if (obj.type !== 'ITEM' || !obj.item_data) continue;
      const name = obj.item_data.name;
      const v = (obj.item_data.variations || [])[0];           // first/default variation
      const pm = v && v.item_variation_data && v.item_variation_data.price_money;
      if (!name || !v || !pm || typeof pm.amount !== 'number') continue;
      items.push({ name, variationId: v.id, priceCents: pm.amount });
    }

    // cache at the edge so we aren't hitting Square on every page view
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ items });
  } catch (e) {
    console.error('menu exception:', e);
    return res.status(200).json({ items: [] });
  }
};
