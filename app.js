/*
TODO:
  // add ability to add another answer (more than 2...) but set limit (e.g. max 5 options)
  // rewrite api functions to get directly from database rather than making an http request to another endpoint
  // display data visualization when a user has already voted for a question
    // add option 'See Results' so that data will be loaded on click rather than for every one on the page?
    // default to showing results for the one just voted on and displaying 'Show Results' option for all others voted on beforehand (in another session?)
  // label a user's questions "your question" or some identifier
  // upvoting questions
  // ability to bookmark questions; AND/OR...
  // dashboard 
    // one page for questions asked
    // one for questions answered
  // sort questions so that most recent appears at top
  // IDEA: instead of using pie charts, use a tree/bubble chart or interactive pie chart where once you click on the answer you want to investigate, it gives you further breakdown of how the demographics are divided among people who chose that answer; do something else if you want to highlight how demographics are split across different answers rather than within the same... but similar idea
    // a tree where roots are answers -- each answer stems into categories: gender, education, etc. which you can click on to see the percentage of that demo who voted for that answer (but then you would have to click on multiple roots to compare across answers) https://bl.ocks.org/mbostock/4339083
*/

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const expressSession = require('express-session');
const RedisStore = require('connect-redis')(expressSession);
const cookieParser = require('cookie-parser');
const db = require('./db');
const config = require('./config.js');
const hbs = require('hbs');
const url = require('url');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
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
  if (req.session.passport && req.session.passport.user) { // Check if session exists
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
        		res.render('index', {polls: polls, err: res.locals.err, prod: config.NODE_ENV === "production"});
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
  console.log("req.session.user", req.session.user);
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
      User.findOne({username: req.session.passport.user}, function(err, user) {
        if (err) {
          console.log(err);
        }
        user.questions.push(question._id);
        user.save(function(err) {
          if (err) {
            console.log(err);
          } 
          res.redirect(302, '/');
        });
      });
    }
  });
});

app.post('/vote', function(req, res) {
  if (!req.session.passport || !req.session.passport.user) {
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

app.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' }),function(req, res) {
  // look into how to make this work with username OR email :)
  res.redirect('/');
});

app.get('/register', function(req, res) {
  if (req.session.passport && req.session.passport.user) {
    res.redirect('/');
  } else {
    res.render('register');
  }
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
  req.session.destroy(function (err) {
    res.redirect('/login');
  });
});

app.get('/favicon.ico', function(req, res) {
  res.sendFile(path.join(__dirname, "public") + '/images/favicon.ico', function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log('sent favicon.ico');
    }
  });
});

app.get('/api/voters/:question_id', function(req, res) {
  // get list of voters' user_ids for each answer associated with a question
  Question.findOne({_id: req.params.question_id}, function(err, question) {
    if (err || !question) {
      res.json("Cannot display this question.");
    } else {
      res.json(question.answers.map(function(ans) {
        return {
          'id': ans._id,
          'text': ans.text,
          'voters': ans.voters
        }
      }));
    }
  });
});

app.get('/api/users/:user_id', function(req, res) {
  // get user demo info for a single user
  // excluding any identifying info
  User.findOne({_id: req.params.user_id}, function(err, user) {
    if (err || !user) {
      res.json("Cannot display this user.");
    } else {
      res.json({
          'gender': user.gender,
          'age': Math.floor((Date.now() - user.birth_date.getTime()) / 31536000000)
      });
    }
  });
});

// helper function for getting full url to make AJAX calls
/*function fullUrl(req) {
  return url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl
  });
}*/

// example question id: 58f0c163e5546f54c109a3f2
// local example question id: 58f26ef04328dd79a7b04c5b

app.get('/api/:question_id/voters.json', function(req, res) {
  // get json object containing voter data for a question
  let url = req.protocol + '://' + req.get('host') + '/api/voters/' + req.params.question_id;
  const request = new XMLHttpRequest();
  request.open('GET', url, true);
  const obj = {}; // object of objects to be returned
  getInfo()
    .then(doStuff, function() {
      console.log("Something went wrong, not executing doStuff()");
    });
  /* 
  The jsonified data will look like this:
  {
    ans1: {
      {voter1},
      {voter2},
    },
    answ: {
      {voter1},
      {voter2},
      {voter3}
    }
  }
  */ 
  // What's going on???
  // 1) Get all answers (getInfo)
  // 2) For each answer, get its user id's (doStuff)
  // 3) For each user_id, get that user's info (getUserInfo)
  //    And push that user into an array of users in an object of answer: [voters] pairs
  // 4) When done getting all users, set res.json(obj)

  function getInfo() {
    return new Promise(function(fulfill, reject) {
      request.addEventListener('load', function() {
        if (request.status >= 200 && request.status < 400) {
          const answers = JSON.parse(request.responseText);
          fulfill(answers);
        } else {
          console.log("ERROR", request.status);
        }
      });
      request.send();
    });
  }

  function doStuff(answers) {
    console.log(answers);
    let userInfo = answers.map(function(ans) {
      return new Promise(function (fulfill, reject) {
        let text = ans.text;
        obj[text] = [];

        let voters = ans.voters.map(function(user) {
          return new Promise(function (resolve, deny) {
            getUserInfo(user).then(
              function(request1) {
                let user = JSON.parse(request1.responseText);
                resolve(user);
                deny(user)
              }, function() {
                console.log("Something went wrong, not executing function(request1)");
            });
          });
        });  

        Promise.all(voters).then(users => {
          users.forEach(user => {
            obj[text].push(user);
          });
          fulfill(obj);
          reject(obj);
        }, () => { console.log("no go."); });
      });
    });

    return Promise.all(userInfo).then(info => {
      res.json(info[0]); 
      // not sure why info is multiple of the same objects but should figure that out... in the meantime, it works!
    }, () => {
      console.log("failure");
    });
  }

  function getUserInfo(user) {
    return new Promise(function(fulfill, reject) {
      url = req.protocol + '://' + req.get('host') + '/api/users/' + user;
      let request1 = new XMLHttpRequest();
      request1.open('GET', url, true);
      request1.addEventListener('load', function() {
        if (request1.status >= 200 && request1.status < 400) {
          fulfill(request1);
        } else {
          reject();
        }
      });
      request1.send(); 
    });
  }

});


app.listen(process.env.PORT || 5000); // heroku dynamically assigns a port
