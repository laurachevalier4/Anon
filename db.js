const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const config = require('./config.js');

const User = new Schema({
  // use plugin for authentication and password encryption, e.g. mongoose-encryption
  // user id is created by mongoose by default
  // Add maxlengths and minlengths!!
  username: {type: String, required: true},
  password: {type: String},
  email: {type: String, required: true},
  /*city: {type: String, required: true},
  country: {type: String, required: true},*/
  gender: {type: String, required: true},
  birth_date: {type: Date, required: true},
  /*bio: {type: String, required: false},
  income: {type: String, required: true},
  education_level: {type: String, required: true},
  industry: {type: String, required: true},
  marital_status: {type: String, required: true},*/
  num_points: {type: Number, required: true},
  answers: [{type: Schema.Types.ObjectId, ref: 'Answer'}],
  questions: [{type: Schema.Types.ObjectId, ref: 'Question'}],
  created: { type: Date, default: Date.now }
});

const Answer = new Schema({
  question: {type: Schema.Types.ObjectId, ref: 'Question'}, // so we can get the question given the answer (e.g. for users) and not just the other way around
  text: {type: String, required: true},
  voters: [{type: Schema.Types.ObjectId, ref: 'User'}],
  created: { type: Date, default: Date.now }
});

const Question = new Schema({
  _id: {type: Schema.Types.ObjectId},
  text: {type: String, required: true},
  category: {type: String, required: true},
  asked_by: {type: Schema.Types.ObjectId, ref: 'User'},
  answered_by: [{type: Schema.Types.ObjectId, ref: 'User'}],
  answers: [Answer],
  created: {type: Date, default: Date.now}
});

// for future completion (or if I have time): include Comments

User.plugin(passportLocalMongoose);

mongoose.model('User', User);
mongoose.model('Question', Question);
mongoose.model('Answer', Answer);

if (config.NODE_ENV === "production") {
  mongoose.connect(process.env.MONGOLAB_URI);
} else {
  mongoose.connect('mongodb://localhost/anon'); // get mongodb uri env variable
}
