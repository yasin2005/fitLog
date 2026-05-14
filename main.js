require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');

const exercisesRouter = require('./routes/exercises');
const workoutsRouter  = require('./routes/workouts');
const historyRouter   = require('./routes/history');
const authRouter      = require('./routes/auth');
const Workout         = require('./models/Workout');

function requireAuth(req, res, next) {
  if (req.session.userId) return next();
  res.redirect('/auth/login');
}

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

app.use(session({
  secret: process.env.SESSION_SECRET || 'fitlog-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 7 days
}));

// Make session user and shared helpers available in all EJS templates
app.use((req, res, next) => {
  res.locals.userId = req.session.userId;
  res.locals.toTitleCase = str => str.replace(/\b\w/g, c => c.toUpperCase());
  next();
});

app.use('/auth', authRouter);
app.use('/api', exercisesRouter);
app.use('/workouts', requireAuth, workoutsRouter);
app.use('/history', requireAuth, historyRouter);

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
