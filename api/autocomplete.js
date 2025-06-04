//  /api/autocomplete.js      (deploy to your Vercel project)
export default async function handler(req, res) {
  const t0 = Date.now();
  res.setHeader('Access-Control-Allow-Origin', '*');      // loosen later if you wish

  /* ------------------------------------------------------------------ 1. validate input */
  const q = (req.query.q || '').trim();
  console.log('[autocomplete] q =', q);
  if (q.length < 3) return res.status(400).json({ error: 'too_short' });

  /* ------------------------------------------------------------------ 2. call Nominatim */
  const url =
    'https://nominatim.openstreetmap.org/search?format=json' +
    '&addressdetails=1&limit=5&q=' + encodeURIComponent(q);

  try {
    const r = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'IkrautasAutocomplete/1.0 (+info@ikrautas.lt)'
      },
      timeout: 5_000
    });
    console.log('[autocomplete] status =', r.status);
    if (!r.ok) throw new Error('nominatim_fail');

    const raw = await r.json();

    /* ---------------------------------------------------------------- 3. shrink + format */
    const list = raw.map(item => {
      const a = item.address;

      /* 3a street part ­–––––––––––––––––––––––––––––––––––––––––––––– */
      const road  = a.road || a.pedestrian || a.cycleway || a.footway || '';
      const nr    = a.house_number ? ' ' + a.house_number : '';
      const street = road ? (road + nr) : '';

      /* 3b locality part (city -> town -> village -> municipality…) –– */
      const locality =
        a.city        ||
        a.town        ||
        a.village     ||
        a.municipality||
        a.county      || '';

      /* 3c build final line ­––––––––––––––––––––––––––––––––––––––––– */
      return street
        ? locality ? `${street}, ${locality}` : street
        : locality;                          // rural “Burveliai, …”
    });

    console.log('[autocomplete] →', list.length, 'rows',
                'in', Date.now() - t0, 'ms');
    return res.status(200).json(list);
  } catch (err) {
    console.error('[autocomplete] error:', err.message);
    return res.status(502).json({ error: err.message });
  }
}
