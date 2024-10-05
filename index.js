const express = require('express')
const app = express()
const cors = require('cors')
const BodyParser =
require('dotenv').config()
const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors())
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

let Exercise, User, Log;

const ExerciseSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  description: String,
  duration: Number,
  date: Date,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
});

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
});

const LogSchema = new mongoose.Schema({

  username: {
      type: String,
      required: true
  },

  count: Number,

  _id: {
      type: ObjectId,
      auto: false,
      unique: false
    },

  log: {
      type: Array,
      default: {}
    }
});


Log = mongoose.model('Log', LogSchema);
User = mongoose.model('User', UserSchema);
Exercise = mongoose.model('Exercise', ExerciseSchema);

// const createAndSaveUser = (data, done) => {
//   let person = new User(data);
//   console.log(person);
//   person.save( function (err, result) {
//         if (err) return console.error(err);
//         done(null, result);
//       }
//   );
// }

app.post('/api/users', async function (req, res) {
    try {
        const user = await User.create(req.body);
        console.log(user);

        let data = {
            username: user.username,
            count: 0,
            _id: user._id,
            log: []
        };
        const log = await Log.create(data);
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});


app.post('/api/users/:_id/exercises', async function (req, res) {
    try {
        let {_id} = req.params;
        let user = await User.findById(_id);
        let date = req.body.date;
        if(date===undefined || date == "")
            date = new Date().toDateString();
        else
            date = new Date(date).toDateString();
        let data = {
            username: user.username,
            user: user,
            description: req.body.description,
            duration: req.body.duration,
            date: date
        };
        // const formattedDate = formatDate(date);
        let data2 = {
            username: user.username,
            _id: _id,
            description: req.body.description,
            duration: parseInt(req.body.duration),
            date: date
        };
        const log = await Log.findById(_id);
        const exercise = await Exercise.create(data);
        console.log(log);

        let new_log = {
            description: exercise.description,
            duration: exercise.duration,
            date: date,
        };
        log.log.push(new_log);
        log.count += 1;
        console.log("LOG : " + log);
        log.save();
        res.status(200).json(data2);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

app.get('/api/users/:_id/logs', async (req, res) => {
    const { _id } = req.params;
    const { from, to, limit } = req.query;  // Get from, to, limit from query parameters

    try {
        // Find the user by ID
        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get the user's log data
        let log = await Log.findById(_id);
        if (!log) {
            return res.status(404).json({ message: 'Log not found for user' });
        }

        // Filter logs based on the 'from' and 'to' date range
        let filteredLogs = log.log;

        if (from) {
            const fromDate = new Date(from);
            if (!isNaN(fromDate.getTime())) {
                filteredLogs = filteredLogs.filter(logEntry => new Date(logEntry.date) >= fromDate);
            }
        }

        if (to) {
            const toDate = new Date(to);
            if (!isNaN(toDate.getTime())) {
                filteredLogs = filteredLogs.filter(logEntry => new Date(logEntry.date) <= toDate);
            }
        }

        // Apply the limit if provided
        if (limit) {
            filteredLogs = filteredLogs.slice(0, parseInt(limit));
        }

        // Format the logs to ensure dates are strings
        const formattedLogs = filteredLogs.map(logEntry => ({
            description: logEntry.description,
            duration: logEntry.duration,
            date: logEntry.date  // Dates are already formatted as strings (YYYY-MM-DD)
        }));

        // Return the response
        res.json({
            _id: user._id,
            username: user.username,
            count: formattedLogs.length,  // Total number of logs returned
            log: formattedLogs  // The filtered and limited log entries
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});


app.get('/api/users', async function (req, res) {
    try {
        const users = await User.find({}, {__v:0});
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

app.get('/api/users/:_id/logs', async function (req, res) {
    try {
        const logs = await Log.findById(req.params._id);
        console.log(logs.log);

        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});


const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');  // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
