const express = require('express');

const router = express.Router();

const EDB_BASE = 'https://oss.exercisedb.dev/api/v1';

// GET /api/exercises — proxies to ExerciseDB
router.get('/exercises', async (req, res) => {
  const { name, bodyParts, equipments, limit = 30 } = req.query;

  const params = new URLSearchParams({ limit });
  if (name)       params.set('name', name);
  if (bodyParts)  params.set('bodyParts', bodyParts);
  if (equipments) params.set('equipments', equipments);

  try {
    const response = await fetch(`${EDB_BASE}/exercises?${params}`);
    const json = await response.json();

    // API returns { success, data } — forward only the data array
    if (!json.success) return res.status(502).json({ error: 'Upstream API error' });

    res.json(json.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
