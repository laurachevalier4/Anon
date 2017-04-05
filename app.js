const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('client-sessions');
const db = require('./db');
const hbs = require('hbs');

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

app.use(session({
  cookieName: 'session',
  secret: 'random_string_goes_here', // generate a random string with plugin like uuid
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000, // extend life for 5 minutes
}));

hbs.registerPartials(__dirname + '/views/partials');
hbs.registerPartial('detail', '{{detail}}');

app.get('/', function(req, res) {
  /*if (req.session && req.session.user) { // Check if session exists
    // lookup the user in the DB by pulling their email from the session
    User.findOne({ username: req.session.user.username }, function (err, user) {
      if (!user) {
        // if the user isn't found in the DB, reset the session info and
        // redirect the user to the login page
        req.session.reset();
        res.redirect('/login');
      } else {
        // expose the user to the template by using res.locals
        res.locals.user = user;*/
 
        // render the dashboard page
        Question.find({}, (err, polls) => {
        	if (err) {
        		console.log(err);
        	} else {/*
            console.log("\npolls: \n", polls);
            polls.forEach(function(poll) {
              console.log(poll);
              poll.answers.forEach(function(answer) {
                console.log(answer);
                Answer.find({'_id': answer}, (err, ans) => {
                  console.log(ans);
                });
              })
            });*/
        		res.render('index', {polls: polls});
        	}
        });
      /*}
    });
  } else {
    res.redirect('/login');
  }*/
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
		asked_by: new ObjectId, // placeholder until I have session management
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
  console.log(req.body);
  // also get user id from session
  Answer.find({'_id': req.body.choice}, function(err, answer) {
    if (err) {
      console.log(err);
      res.redirect(302, '/');
    } else {
      console.log(answer);
      //answer.voters.push(req.session.user);
      /*answer.save(function(err) {
        if (err) {
          console.log(err);
          res.redirect(302, '/');
        } else {
          res.redirect(302, '/');
        }
      });
      */
      res.redirect(302, '/');
    }
  });
});

/*app.get('/login', function(req, res) {
	res.render('login');
});

app.post('/login', function(req, res) {
  User.findOne({ username: req.body.username }, function(err, user) {
    if (!user) {
      res.render('login', { error: 'Invalid email or password.' });
    } else {
      if (req.body.password === user.password) {
        // sets a cookie with the user's info
        // client-sessions takes care of encrypting user info
        req.session.user = user;
        res.redirect('/');
      } else {
        res.render('login', { error: 'Invalid email or password.' });
      }
    }
  });
});

app.get('/register', function(req, res) {
	res.render('register');
});

app.post('/register', function(req, res) {
	res.redirect('activation', 300);
});

app.get('/activation', function(req, res) {
	res.render('activation');
});*/

app.listen(3000);

// you can use express Router to have the routes in a separate file
// also consider having all of the routes related to forms in a separate file or folder
  // where you will implement the logic and validation for each form,
  // then based on the correct/incorrect input decide what the context will be to rerender the form
  // or redirect if all of the input was perfect