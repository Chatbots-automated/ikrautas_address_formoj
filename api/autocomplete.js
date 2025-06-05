// /api/autocomplete.js
// returns up-to-5 suggestions :
// { label : "Statybininkų g 23, Kaunas", lat : "54.9331", lon : "23.9302" }

export default async function handler(req, res) {
  const start = Date.now();                                         // ── trace
  console.log('[AUTOCOMPLETE] ⏱  start', new Date().toISOString());

  res.setHeader('Access-Control-Allow-Origin', '*');                // dev only

  /* ───────────────────────────────── 1. read & check query */
  const q = (req.query.q || '').trim();
  console.log('[AUTOCOMPLETE] query =', `"${q}"`);

  if (q.length < 3) {
    console.warn('[AUTOCOMPLETE] rejected → too short');
    return res.status(400).json({ error: 'too_short' });
  }

  /* ───────────────────────────────── 2. build URL */
  const url = 'https://nominatim.openstreetmap.org/search?format=json' +
              '&addressdetails=1&limit=10&q=' + encodeURIComponent(q);

  console.log('[AUTOCOMPLETE] requesting →', url);

  try {
    /* ─────────────────────────────── 3. call Nominatim */
    const r = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'IkrautasAutocomplete/1.3 (+info@ikrautas.lt)'
      },
      timeout: 5000
    });

    console.log('[AUTOCOMPLETE] nominatim status =', r.status);

    if (!r.ok) throw new Error('nominatim_fail_' + r.status);

    const raw = await r.json();
    console.log('[AUTOCOMPLETE] raw rows =', raw.length);

    /* ─────────────────────────────── 4. massage -> list[] */
    const pick = (o, keys) => keys.find(k => o[k]) && o[keys.find(k => o[k])];

    const list = raw.map(it => {
      const a   = it.address;
      const nr  = a.house_number ? ' ' + a.house_number : '';
      const st  = a.road ? a.road.replace(/,$/, '') + nr : '';
      const loc = pick(a, ['city', 'town', 'village']) ||
                  pick(a, ['county', 'region', 'state']) || '';

      const label = [st || pick(a, ['village', 'town', 'city', 'hamlet']), loc]
                    .filter(Boolean).join(', ');
      return label ? { label, lat: it.lat, lon: it.lon } : null;
    })
    .filter(Boolean)
    .filter((v, i, arr) => arr.findIndex(x => x.label === v.label) === i)
    .slice(0, 5);

    console.log('[AUTOCOMPLETE] final list =', list.length, 'rows',
                '– elapsed', Date.now() - start, 'ms');

    return res.status(200).json(list);
  } catch (e) {
    console.error('[AUTOCOMPLETE] ERROR →', e.message,
                  '– elapsed', Date.now() - start, 'ms');
    return res.status(502).json({ error: e.message });
  }
}
