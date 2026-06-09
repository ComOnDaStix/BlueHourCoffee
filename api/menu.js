// Blue Hour Coffee — live menu from Square (Vercel serverless function)
//
// Returns your Square catalog items — name, price, Square variation id, plus
// description, image URL and category when present — so the website renders its
// drinks menu straight from Square (the single source of truth). The browser
// builds the drink cards from this list. If Square has no catalog or isn't
// reachable, it returns an empty list and the site falls back to a built-in menu.
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
    // Pull items + their images + categories in one shot so we can resolve names/urls.
    const r = await fetch(base + '/v2/catalog/list?types=ITEM,IMAGE,CATEGORY', {
      headers: { 'Authorization': 'Bearer ' + token, 'Square-Version': SQUARE_VERSION },
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('Square catalog error:', JSON.stringify(data));
      return res.status(200).json({ items: [] });
    }

    const objs = data.objects || [];
    const imageUrl = {}, catName = {};
    for (const o of objs) {
      if (o.type === 'IMAGE' && o.image_data) imageUrl[o.id] = o.image_data.url || '';
      if (o.type === 'CATEGORY' && o.category_data) catName[o.id] = o.category_data.name || '';
    }

    const items = [];
    for (const o of objs) {
      if (o.type !== 'ITEM' || !o.item_data) continue;
      const it = o.item_data;
      const v = (it.variations || [])[0];                       // first/default variation
      const pm = v && v.item_variation_data && v.item_variation_data.price_money;
      if (!it.name || !v || !pm || typeof pm.amount !== 'number') continue;
      const imgId = (it.image_ids || [])[0];
      const catId = (it.categories && it.categories[0] && it.categories[0].id) || it.category_id;
      items.push({
        name: it.name,
        variationId: v.id,
        priceCents: pm.amount,
        description: (it.description_plaintext || it.description || '').trim(),
        imageUrl: (imgId && imageUrl[imgId]) || '',
        category: (catId && catName[catId]) || '',
      });
    }

    // Lead with photographed items (nicer rail while the rest get photos added),
    // then a stable alphabetical order.
    items.sort((a, b) => (b.imageUrl ? 1 : 0) - (a.imageUrl ? 1 : 0) || a.name.localeCompare(b.name));

    // Cache at the edge so we aren't hitting Square on every page view.
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ items });
  } catch (e) {
    console.error('menu exception:', e);
    return res.status(200).json({ items: [] });
  }
};
