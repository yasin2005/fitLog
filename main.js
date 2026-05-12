require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const exercisesRouter = require('./routes/exercises');
const workoutsRouter  = require('./routes/workouts');
const historyRouter   = require('./routes/history');
const Workout         = require('./models/Workout');

const app = express();
const port = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitlog';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', exercisesRouter);    // exercise search, proxied to ExerciseDB
app.use('/workouts', workoutsRouter); // My Workouts page + create/edit/delete API
app.use('/history', historyRouter);   // History page + log a session

// Home page; loads a workout into the sidebar for editing when ?edit=id is in the URL
app.get('/', async (req, res) => {
  let editWorkout = null;
  if (req.query.edit) {
    try {
      const found = await Workout.findById(req.query.edit);
      if (found) editWorkout = found.toJSON();
    } catch (e) { /* ignore bad id or DB errors */ }
  }
  res.render('index', { editWorkout });
});

app.listen(port, () => {
  console.log(`FitLog running at http://localhost:${port}`);
});
