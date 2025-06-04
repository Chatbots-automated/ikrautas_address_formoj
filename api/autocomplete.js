export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // WP page can call us
  const q = (req.query.q || '').trim();
  if (q.length < 3) return res.status(400).json({ error: 'too_short' });

  const url = `https://nominatim.openstreetmap.org/search?format=json` +
              `&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`;

  try {
    const r = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'IkrautasAutocomplete/1.0 (info@ikrautas.lt)'
      },
      timeout: 5000
    });
    if (!r.ok) throw new Error('nominatim_fail');
    const raw = await r.json();
    // Strip to “one line” suggestions – keep it ultra-simple
    const list = raw.map(item => item.display_name);
    res.status(200).json(list);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
};
