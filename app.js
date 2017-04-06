const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const db = require('./db');
const hbs = require('hbs');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const mongoose = require('mongoose');
const User = mongoose.model('User');
const Question = mongoose.model('Question');
const Answer = mongoose.model('Answer');
const ObjectId = mongoose.Types.ObjectId;

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, "public")));
app.set('views', path.join(__dirname, "views"));

const sessionOptions = {
  secret: 'd28ef806c691f4ed9752e03808423ed5c269d62964e9793cbc26239063a6db22498ad782ea97ab8c141d0670fc297961be52dad808e5581a96345582d016115a',
  resave: true,
  saveUninitialized: true,
  cookie: { path: '/', httpOnly: true, secure: false, maxAge: null } // default
};
app.use(session(sessionOptions));

app.use(function(req, res, next) {
  const hour = 3600000;
  req.session.cookie.expires = new Date(Date.now() + hour);
  req.session.cookie.maxAge = hour;
  next();
});

hbs.registerPartials(__dirname + '/views/partials');
hbs.registerPartial('detail', '{{detail}}');
hbs.registerHelper('dateFormat', require('handlebars-dateformat'));
hbs.registerHelper("userVoted", function(question) {
  Question.findOne({_id: question}, function(err, q) {
    if (err) {
      console.log(err);
      return false;
    } else {
      q.answered_by.forEach(function(userid) {
        if (userid.toString() === app.locals.user._id.toString()) {
          // working fine, returns true where it should
          return true;
        }
      });
      // WHY ISN'T THIS WORKING
      // need to get this working so I can remove vote form and show visualizations based on whether or not a user has voted for a question
      return false;
    }
  })
});
hbs.registerHelper('pluralize', function(number, single, plural) {
  if (number === 1) { return single; }
  else { return plural; }
});

app.get('/', function(req, res) {
  if (req.session && req.session.user) { // Check if session exists
    // lookup the user in the DB by pulling their email from the session
    User.findOne({ username: req.session.user.username }, function (err, user) {
      if (!user) {
        // if the user isn't found in the DB, reset the session info and
        // redirect the user to the login page
        req.session.reset();
        res.redirect('/login');
      } else {
        // expose the user to the template by using res.locals (?)
        res.locals.user = user;
        app.locals.user = user;
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
    req.session.destroy();
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
		asked_by: new ObjectId,
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
  if (!req.session.user) {
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
  res.render('register');
});

app.post('/login', function(req, res) {
  const password = req.body.password;
  const username = req.body.username;
  User.findOne({ $or: [
    { username: username }, // user can login using username or email
    { email: username }
    ]}, function(err, user) {
    if (!user) {
      res.render('login', { error: 'Invalid username or password.' });
    } else {
      bcrypt.compare(password, user.password, function(err, result) {
        if (result) {
          req.session.regenerate((err) => {
            if (!err) {
              console.log('success!');
              app.locals.user = user;
              req.session.user = user;
              res.redirect('/'); 
            } else {
              console.log('error'); 
              res.send('an error occurred, please see the server logs for more information');
            }
          });
        } else {
          res.render('login', { error: 'Invalid email or password.' });
        }
      });
    }
  });
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
    bcrypt.hash(password, saltRounds, function(err, hash) {
      if (err) {
        res.render('register', {error: 'Something happened.'});
      } else {
        const user = new User({
          username: username,
          password: hash,
          email: email,
          gender: gender,
          birth_date: bd,
          num_points: 0
        });
        user.save(function(err) {
          if (err) {
            console.log(err);
            res.send('an error occurred, please see the server logs for more information');
          } else {
            req.session.regenerate((err) => {
              if (!err) {
                req.session.user = user;
                res.redirect('/'); 
              } else {
                console.log('error'); 
                res.send('an error occurred, please see the server logs for more information');
              }
            });
          }
        });
      }
    });
  }
});

app.get('/logout', function(req, res) {
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

app.listen(3000);

// you can use express Router to have the routes in a separate file
// also consider having all of the routes related to forms in a separate file or folder
  // where you will implement the logic and validation for each form,
  // then based on the correct/incorrect input decide what the context will be to rerender the form
  // or redirect if all of the input was perfect