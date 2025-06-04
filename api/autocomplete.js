// /api/autocomplete.js
export default async function handler(req, res) {
  const started = Date.now();

  // allow calls from anywhere (dev only – tighten later if you want)
  res.setHeader('Access-Control-Allow-Origin', '*');

  // --- 1)  sanity-check the query -----------------------------------------
  const q = (req.query.q || '').trim();
  console.log('[autocomplete] incoming query =', q);

  if (q.length < 3) {
    console.warn('[autocomplete] rejected – too short');
    return res.status(400).json({ error: 'too_short' });
  }

  // --- 2)  build Nominatim request ----------------------------------------
  const url =
    'https://nominatim.openstreetmap.org/search?format=json' +
    '&addressdetails=1&limit=5&q=' + encodeURIComponent(q);

  console.log('[autocomplete] requesting →', url);

  try {
    const r = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'IkrautasAutocomplete/1.0 (+info@ikrautas.lt)'
      },
      timeout: 5_000
    });

    console.log('[autocomplete] nominatim status =', r.status);

    if (!r.ok) throw new Error('nominatim_fail');

    const raw = await r.json();

    console.log('[autocomplete] results =', raw.length,
                'rows – elapsed', Date.now() - started, 'ms');

    const list = raw.map(i => i.display_name); // keep only one-liners

    return res.status(200).json(list);
  } catch (err) {
    console.error('[autocomplete] error →', err.message,
                  '– elapsed', Date.now() - started, 'ms');
    return res.status(502).json({ error: err.message });
  }
}
