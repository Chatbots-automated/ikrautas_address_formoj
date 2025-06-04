// returns up-to-5 suggestions:
// { label : "Statybininkų g 23, Kaunas", lat : "54.9331", lon : "23.9302" }
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');      // dev only

  const q = (req.query.q || '').trim();
  if (q.length < 3) return res.status(400).json({ error: 'too_short' });

  const url =
    'https://nominatim.openstreetmap.org/search?format=json' +
    '&addressdetails=1&limit=10&q=' + encodeURIComponent(q);

  try {
    const r = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'IkrautasAutocomplete/1.2 (+info@ikrautas.lt)'
      },
      timeout: 5_000
    });
    if (!r.ok) throw new Error('nominatim_fail_' + r.status);

    const raw = await r.json();

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

    return res.status(200).json(list);
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
