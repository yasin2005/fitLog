const mongoose = require('mongoose');

// Records a single instance of a user doing a workout
const WorkoutLogSchema = new mongoose.Schema({
  // Reference to the Workout that was done
  workoutId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Workout', required: true },
  // Snapshot of the name at the time of logging (in case the workout is later renamed/deleted)
  workoutName: { type: String, required: true },
  // When the workout was done
  date:        { type: Date, default: Date.now }
});

module.exports = mongoose.model('WorkoutLog', WorkoutLogSchema);
