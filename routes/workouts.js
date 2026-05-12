const express = require('express');
const router = express.Router();
const Workout = require('../models/Workout');

// POST /workouts — save a new workout created in the sidebar
router.post('/', async (req, res) => {
  try {
    const { name, description, exercises } = req.body;
    const workout = new Workout({ name, description, exercises });
    await workout.save();
    res.json({ success: true, workout });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /workouts — return all saved workouts for the My Workouts page
router.get('/', async (req, res) => {
  try {
    const workouts = await Workout.find().sort({ createdAt: -1 });
    res.render('workouts', { workouts });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// DELETE /workouts/:id — delete a saved workout
router.delete('/:id', async (req, res) => {
  try {
    await Workout.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
