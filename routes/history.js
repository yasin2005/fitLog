const express = require('express');
const router = express.Router();
const WorkoutLog = require('../models/WorkoutLog');
const Workout = require('../models/Workout');

// POST /history — log that a workout was done today
router.post('/', async (req, res) => {
  try {
    const { workoutId } = req.body;
    const workout = await Workout.findById(workoutId);
    if (!workout) return res.status(404).json({ error: 'Workout not found' });

    const log = new WorkoutLog({ workoutId, workoutName: workout.name });
    await log.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /history — return WorkoutLog entries from the past 7 days
router.get('/', async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    // Normalize to midnight so the window covers 7 full calendar days, not just the last 168 hours
    since.setHours(0, 0, 0, 0);

    // populate() fills in the full Workout document (including exercises) for each log
    const logs = await WorkoutLog.find({ date: { $gte: since } })
      .populate('workoutId')
      .sort({ date: -1 });

    res.render('history', { logs });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
