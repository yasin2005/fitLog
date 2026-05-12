const express = require('express');

// express.Router() creates a mini router that gets mounted at /api in main.js
// so every route defined here is relative to /api
const router = express.Router();

const EDB_BASE = 'https://oss.exercisedb.dev/api/v1';

// GET /api/exercises
// Accepts query params: name, bodyParts, equipments, limit
// Proxies the request to ExerciseDB so the browser never calls the external API directly
router.get('/exercises', async (req, res) => {
  const { name, bodyParts, equipments, limit = 30 } = req.query;

  const params = new URLSearchParams({ limit });
  if (name)       params.set('name', name);
  if (bodyParts)  params.set('bodyParts', bodyParts);
  if (equipments) params.set('equipments', equipments);

  try {
    const response = await fetch(`${EDB_BASE}/exercises?${params}`);
    const json = await response.json();

    // ExerciseDB wraps results in { success: true, data: [...] }
    if (!json.success) return res.status(502).json({ error: 'Upstream API error' });

    res.json(json.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
