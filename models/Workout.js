const mongoose = require('mongoose');

// One exercise entry stored inside a workout
const ExerciseSchema = new mongoose.Schema({
  exerciseId:       { type: String, required: true },
  name:             { type: String, required: true },
  gifUrl:           { type: String },
  targetMuscles:    { type: [String], default: [] },
  bodyParts:        { type: [String], default: [] },
  equipments:       { type: [String], default: [] },
  secondaryMuscles: { type: [String], default: [] },
  instructions:     { type: [String], default: [] },
  // sets and reps chosen by the user
  sets:             { type: Number, default: 3 },
  reps:             { type: Number, default: 10 }
}, { _id: false }); // no _id on exercise entries

// A saved workout with a name, optional description, and a list of exercises
const WorkoutSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  exercises:   { type: [ExerciseSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Workout', WorkoutSchema);
