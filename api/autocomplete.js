//  /api/autocomplete.js  – returns up-to-5 strings in
//  “[street] [houseNo], [city|region]” format
export default async function handler(req, res) {
  const t0 = Date.now();
  res.setHeader('Access-Control-Allow-Origin', '*');

  const q = (req.query.q || '').trim();
  if (q.length < 3) return res.status(400).json({ error: 'too_short' });

  const url =
    'https://nominatim.openstreetmap.org/search?format=json' +
    '&addressdetails=1&limit=10&q=' + encodeURIComponent(q);

  try {
    const r = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'IkrautasAutocomplete/1.1 (+info@ikrautas.lt)'
      },
      timeout: 5_000
    });
    if (!r.ok) throw new Error('nominatim_fail_' + r.status);
    const raw = await r.json();

    // ---- build “[street] [nr], city|region” ---------------------------
    const pick = (o, keys) => keys.find(k => o[k]) && o[keys.find(k => o[k])];

    const nice = raw.map(it => {
      const a = it.address;

      // primary part
      const street = a.road ? a.road.replace(/,$/, '') : '';
      const nr     = a.house_number ? (' ' + a.house_number) : '';
      const place  =
        street ? (street + nr) :
        pick(a, ['village', 'town', 'city', 'hamlet', 'suburb']) || '';

      // locality / region part
      const loc = pick(a, ['city', 'town', 'village']) ||
                  pick(a, ['county', 'region', 'state'])    || '';

      return [place, loc].filter(Boolean).join(', ');
    })
    // drop empties and duplicates, keep first 5
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 5);

    return res.status(200).json(nice);
  } catch (e) {
    return res.status(502).json({ error: e.message });
  } finally {
    console.log('[autocomplete]', q, '->', Date.now() - t0, 'ms');
  }
}
