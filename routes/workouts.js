const express = require('express');
const router = express.Router();
const Workout = require('../models/Workout');

// POST /workouts — create and save a new workout
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

// GET /workouts — render the My Workouts page
router.get('/', async (req, res) => {
  try {
    const workouts = await Workout.find().sort({ createdAt: -1 });
    res.render('workouts', { workouts });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// PUT /workouts/:id — update a saved workout
router.put('/:id', async (req, res) => {
  try {
    const { name, description, exercises } = req.body;
    // Keep only known schema fields — unknown properties from the client cause Mongoose validation errors
    const cleanExercises = (exercises || []).map(ex => ({
      exerciseId:       ex.exerciseId,
      name:             ex.name,
      gifUrl:           ex.gifUrl           || '',
      targetMuscles:    ex.targetMuscles    || [],
      bodyParts:        ex.bodyParts        || [],
      equipments:       ex.equipments       || [],
      secondaryMuscles: ex.secondaryMuscles || [],
      instructions:     ex.instructions     || [],
      sets:             Math.max(1, parseInt(ex.sets)  || 3),
      reps:             Math.max(1, parseInt(ex.reps)  || 10)
    }));
    // $set updates only these fields without replacing the whole document
    const workout = await Workout.findByIdAndUpdate(
      req.params.id,
      { $set: { name, description, exercises: cleanExercises } },
      { returnDocument: 'after' }
    );
    if (!workout) return res.status(404).json({ error: 'Workout not found' });
    res.json({ success: true, workout });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /workouts/:id/delete — delete a saved workout (forms can't send DELETE)
router.post('/:id/delete', async (req, res) => {
  try {
    await Workout.findByIdAndDelete(req.params.id);
    res.redirect('/workouts');
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
