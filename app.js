/*
TODO:
  // display data visualization when a user has already voted for a question
    // add option 'See Results' so that data will be loaded on click rather than for every one on the page
    // default to showing results for the one just voted on and displaying 'Show Results' option for all others voted on beforehand (in another session?)
    // only be able to vote once per question
  // label a user's questions "your question" or some identifier
  // upvoting questions
  // ability to bookmark questions; AND/OR...
  // dashboard 
    // one page for questions asked
    // one for questions answered
  // scroll to the poll a user just voted on after rerendering index
  // sort questions so that most recent appears at top
*/

/*
Authentication
- passport
- everyauth

*/

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const expressSession = require('express-session');
const RedisStore = require('connect-redis')(expressSession);
const cookieParser = require('cookie-parser');
const db = require('./db');
const config = require('./config.js')
const hbs = require('hbs');
const url = require('url');

const mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
const User = mongoose.model('User');
const Question = mongoose.model('Question');
const Answer = mongoose.model('Answer');
const ObjectId = mongoose.Types.ObjectId;

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, "public")));
app.set('views', path.join(__dirname, "views"));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

function sessions(url, secret) {
  const store = new RedisStore({ url: url });
  const session = expressSession({
    secret: secret,
    store: store,
    resave: true,
    saveUninitialized: true
  });

  return session;
};

if (config.NODE_ENV === "production") {
  const redisURL = url.parse(process.env.REDISCLOUD_URL);
  const client = require('redis').createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
  client.auth(redisURL.auth.split(":")[1]);
}

app
  .use(cookieParser(process.env.COOKIE_SECRET))
  .use(sessions(process.env.REDISCLOUD_URL, process.env.COOKIE_SECRET));

hbs.registerPartials(__dirname + '/views/partials');
hbs.registerPartial('detail', '{{detail}}');
hbs.registerHelper('dateFormat', require('handlebars-dateformat'));
hbs.registerHelper('userVoted', function(question) {
  let voted = false;
  question.answered_by.forEach(function(userId) {
    if (userId.toString() === app.locals.user._id.toString()) {
      voted = true;
    }
  });
  return voted;
});

hbs.registerHelper('pluralize', function(number, single, plural) {
  if (number === 1) { return single; }
  else { return plural; }
});

app.get('/', function(req, res) {
  console.log(req);
  if (req.session.passport && req.session.passport.user) { // Check if session exists
    console.log(req.session);
    // lookup the user in the DB by pulling their email from the session
    User.findOne({ username: req.session.passport.user }, function (err, user) {
      if (!user) {
        // if the user isn't found in the DB, reset the session info and
        // redirect the user to the login page
        req.session.destroy(function(err) {
          if (err) {
            res.send(err);
          }
          else {
            res.redirect(302, '/login');
          }
        });
      } else {
        // expose the user to the template by using res.locals (?)
        res.locals.user = user;
        app.locals.user = user;
        req.session.user = user;
        Question.find({}, (err, polls) => {
        	if (err) {
        		console.log(err);
        	} else {
        		res.render('index', {polls: polls, err: res.locals.err});
        	}
        });
      }
    });
  } else {
    // can't destroy session here. req.session undefined
    res.redirect('/login');
  }
});

app.get('/ask', function(req, res) {
	res.render('ask');
});

app.post('/ask', function(req, res) {
	let id = new ObjectId;
	const choices = [];
	for (let key in req.body) {
		if (key.substring(0, 6) === "choice") {
			let answer = new Answer({
				question: id, 
				text: req.body[key],
				voters: []
			});
			choices.push(answer);
			answer.save();
		}
	}
	let question = new Question({
		_id: id, // use ObjectId to generate new id
		text: req.body.question,
		category: req.body.category, 
		asked_by: req.session.user._id,
		answered_by: [],
		answers: choices
	});
	question.save(function(err) {
    if (err) {
      console.log(err);
      res.redirect(302, '/');
    }
    else {
      res.redirect(302, '/');
    }
  });
});

app.post('/vote', function(req, res) {
  if (!req.session || !req.session.user.username) {
    res.locals.err = "You must be logged in to vote.";
    res.redirect("/login");
  }
  // also get user id from session
  Question.findOne({answers: {$elemMatch: {_id: req.body.choice}}}, function(err, question) {
    if (err) {
      console.log(err);
      res.redirect(302, '/');
    } else {
      const answer = question.answers.id(req.body.choice);
      answer.voters.push(req.session.user);
      answer.save(function(err) {
        if (err) {
          console.log(err);
          res.redirect(302, '/');
        } else {
          question.answered_by.push(req.session.user._id);
          question.save(function(err) {
            if (err) {
              console.log(err);
              res.redirect(302, '/');
            } else {
              res.redirect(302, '/');
            } 
          });
        }
      });
    }
  });
});

app.get('/login', function(req, res) {
	res.render('login');
});

app.get('/register', function(req, res) {
  if (req.session.passport && req.session.passport.user) {
    res.redirect('/');
  } else {
    res.render('register');
  }
});

app.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' }),function(req, res) {
  // look into how to make this work with username OR email :)
  res.redirect('/');
});

app.post('/register', function(req, res) {
  const password = req.body.password;
  const username = req.body.username;
  const email = req.body.email;
  const gender = req.body.gender;
  let birthday = req.body.birthday;
  birthday = birthday.split('/');
  let day = birthday[0];
  let month = birthday[1];
  let year = birthday[2];
  const bd = new Date(year, month, day);
  let taken = false;
  User.findOne({ username: username }, function(err, doc) {
    if (err) {
      res.send('an error occurred, please see the server logs for more information');
    }
    if (doc) { 
      taken = true;
    }
  });
  if (password.length < 8) {
    // add other validation here or with mongo validation
    res.render('register', {error: 'Password must have at least 8 characters.'});
  } else if (taken) {
    res.render('register', {error: 'Username taken.'});
  } else {
    User.register(new User({
      username: username,
      email: email,
      gender: gender,
      birth_date: bd,
      num_points: 0
    }), password, function(err, user) {
      if (err) {
        return res.render('register', { error : err.message });
      }
      passport.authenticate('local')(req, res, function () {
        console.log("user line 268", user);
        req.session.user = user;
        req.session.save(function(err) {
          if (err) {
            return next(err);
          }
          res.redirect('/');
        });
      });
    });
  }
});

app.get('/logout', function(req, res) {
  res.locals.user = null;
  req.session.destroy(function(err) {
    if (err) {
      res.send(err);
    }
    else {
      res.redirect(302, '/login');
    }
  });
});
// app.get('/activation', function(req, res) {
// 	res.render('activation');
// });

app.get('/favicon.ico', function(req, res) {
  res.sendFile(path.join(__dirname, "public") + '/images/favicon.ico', function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log('sent favicon.ico');
    }
  });
});

app.listen(process.env.PORT || 5000); // heroku dynamically assigns a port

// you can use express Router to have the routes in a separate file
// also consider having all of the routes related to forms in a separate file or folder
  // where you will implement the logic and validation for each form,
  // then based on the correct/incorrect input decide what the context will be to rerender the form
  // or redirect if all of the input was perfect