const mongoose = require('mongoose');

// Sub-schema for a single exercise — stores every field returned by ExerciseDB
const ExerciseSchema = new mongoose.Schema({
  exerciseId:       { type: String, required: true },
  name:             { type: String, required: true },
  gifUrl:           { type: String },
  targetMuscles:    { type: [String], default: [] }, // primary target muscles (e.g. ["quads"])
  bodyParts:        { type: [String], default: [] },
  equipments:       { type: [String], default: [] },
  secondaryMuscles: { type: [String], default: [] },
  instructions:     { type: [String], default: [] }
}, { _id: false }); // no separate _id per exercise entry

// Main workout schema — a named, reusable workout the user builds
const WorkoutSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  exercises:   { type: [ExerciseSchema], default: [] }
}, { timestamps: true }); // adds createdAt and updatedAt automatically

module.exports = mongoose.model('Workout', WorkoutSchema);
