require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

// Router that proxies exercise searches to the ExerciseDB API
const exercisesRouter = require('./routes/exercises');
const workoutsRouter  = require('./routes/workouts');
const historyRouter   = require('./routes/history');

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

app.use('/api', exercisesRouter);    // /api/exercises — ExerciseDB proxy
app.use('/workouts', workoutsRouter); // GET /workouts page + POST/DELETE API
app.use('/history', historyRouter);   // GET /history page + POST to log a session

// Home Page
app.get('/', (req, res) => {
  res.render('index');
});

app.listen(port, () => {
  console.log(`FitLog running at http://localhost:${port}`);
});
