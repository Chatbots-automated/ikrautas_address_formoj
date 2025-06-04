// /api/autocomplete.js
export default async function handler(req, res) {
  const t0 = Date.now();
  res.setHeader('Access-Control-Allow-Origin', '*');

  const q = (req.query.q || '').trim();
  if (q.length < 3) return res.status(400).json({ error: 'too_short' });

  const url =
    'https://nominatim.openstreetmap.org/search?format=json' +
    '&addressdetails=1&limit=5&q=' + encodeURIComponent(q);

  try {
    const r = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'IkrautasAutocomplete/2.0 (+info@ikrautas.lt)'
      },
      timeout: 5_000
    });
    if (!r.ok) throw new Error('nominatim_fail ' + r.status);

    const raw  = await r.json();
    const list = raw.map(i => ({
      label: i.display_name,
      lat  : i.lat,
      lon  : i.lon
    }));
    return res.status(200).json(list);
  } catch (e) {
    console.error('[autocomplete] err', e.message, '–', Date.now() - t0, 'ms');
    return res.status(502).json({ error: e.message });
  }
}
