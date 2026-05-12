const mongoose = require('mongoose');

// One logged workout session
const WorkoutLogSchema = new mongoose.Schema({
  workoutId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Workout', required: true },
  // Stored separately so history keeps the name even if the workout is renamed or deleted later
  workoutName: { type: String, required: true },
  date:        { type: Date, default: Date.now }
});

module.exports = mongoose.model('WorkoutLog', WorkoutLogSchema);
