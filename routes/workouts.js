const express = require('express');
const router = express.Router();
const Workout = require('../models/Workout');

// POST /workouts — create and save a new workout
router.post('/', async (req, res) => {
  try {
    const { name, description, exercises } = req.body;
    const workout = await Workout.create({ userId: req.session.userId, name, description, exercises });
    res.json({ success: true, workout });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /workouts — render the My Workouts page
router.get('/', async (req, res) => {
  try {
    const workouts = await Workout.find({ userId: req.session.userId }).sort({ createdAt: -1 });
    res.render('workouts', { workouts });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// PUT /workouts/:id — update a saved workout
router.put('/:id', async (req, res) => {
  try {
    const { name, description, exercises } = req.body;
    const cleanExercises = (exercises || []).map(exercise => ({
      exerciseId:       exercise.exerciseId,
      name:             exercise.name,
      gifUrl:           exercise.gifUrl           || '',
      targetMuscles:    exercise.targetMuscles    || [],
      bodyParts:        exercise.bodyParts        || [],
      equipments:       exercise.equipments       || [],
      secondaryMuscles: exercise.secondaryMuscles || [],
      instructions:     exercise.instructions     || [],
      sets:             Math.max(1, parseInt(exercise.sets)  || 3),
      reps:             Math.max(1, parseInt(exercise.reps)  || 10)
    }));
    const workout = await Workout.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.userId },
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
    await Workout.findOneAndDelete({ _id: req.params.id, userId: req.session.userId });
    res.redirect('/workouts');
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;