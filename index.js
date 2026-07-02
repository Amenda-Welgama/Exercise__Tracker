const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// In-memory storage
const users = {}; // { id: { username, _id } }
const exercises = {}; // { id: [ { description, duration, date } ] }
let idCounter = 1;

function generateId() {
  // Generate a 24-character hex string similar to a MongoDB ObjectId
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = (idCounter++).toString(16).padStart(16, '0');
  return timestamp + random;
}

// Create a new user
app.post('/api/users', (req, res) => {
  const username = req.body.username;

  if (!username) {
    return res.json({ error: 'username is required' });
  }

  const _id = generateId();
  const newUser = { username, _id };

  users[_id] = newUser;
  exercises[_id] = [];

  res.json(newUser);
});

// Get list of all users
app.get('/api/users', (req, res) => {
  const userList = Object.values(users);
  res.json(userList);
});

// Add an exercise for a user
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const user = users[userId];

  if (!user) {
    return res.json({ error: 'user not found' });
  }

  const { description, duration } = req.body;

  if (!description || !duration) {
    return res.json({ error: 'description and duration are required' });
  }

  let date = req.body.date ? new Date(req.body.date) : new Date();

  // Guard against invalid date strings
  if (date.toString() === 'Invalid Date') {
    date = new Date();
  }

  const exercise = {
    description: description,
    duration: parseInt(duration),
    date: date.toDateString()
  };

  exercises[userId].push(exercise);

  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
    _id: user._id
  });
});

// Get a user's exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const user = users[userId];

  if (!user) {
    return res.json({ error: 'user not found' });
  }

  let log = exercises[userId] || [];

  const { from, to, limit } = req.query;

  if (from) {
    const fromDate = new Date(from);
    log = log.filter(ex => new Date(ex.date) >= fromDate);
  }

  if (to) {
    const toDate = new Date(to);
    log = log.filter(ex => new Date(ex.date) <= toDate);
  }

  if (limit) {
    log = log.slice(0, parseInt(limit));
  }

  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log: log
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})