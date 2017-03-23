# Anon
----------

## Overview
-----------
Anon is a website for anonymous polling and in-depth visualizations of results based on user demographics. Users can post questions to the site for other users to vote on, and they will be able to see the results of these polls visualized based on the demographics of voters. Each poll is only valid for a set amount of time, and a user can only post a poll if they have enough points to do so; they can accumulate points by voting on other polls. Not only does this permit open data transactions but it gives all users a glimpse into how certain 'types' of people respond to all sorts of questions. Perhaps we'll find that people fall perfectly into their stereotypes. More likely, we will be surprised to find that people aren't at all what you would expect.

## Data Model
-------------

```
var Schema = mongoose.Schema;

var User = new Schema({
	// use plugin for authentication and password encryption, e.g. mongoose-encryption
	// user id is created by mongoose by default
	username: {type: String, required: true},
	password: {type: String, required: true},
	city: {type: String, required: true},
	country: {type: String, required: true},
	gender: {type: String, required: true},
	birth_date: {type: Date, required: true},
	bio: {type: String, required: false},
	income: {type: String, required: true},
	education_level: {type: String, required: true},
	industry: {type: String, required: true},
	marital_status: {type: String, required: true},
	num_points: {type: Number, required: true},
	questions_answered: [{type: Schema.Types.ObjectId, ref: 'Question'}],
	questions_asked: [{type: Schema.Types.ObjectId, ref: 'Question'}]
});

var Question = new Schema({
	text: {type: String, required: true},
	answers: [{type: Schema.Types.ObjectId, ref: 'Answer'}],
	category: {type: String, required: true},
	asked_by: {type: Number, ref: 'User'},
	answered_by: [{type: Schema.Types.ObjectId, ref: 'User'}]
});

var Answer = new Schema({
	text: {type: String, required: true},
	voters: [{type: Schema.Types.ObjectId, ref: 'User'}]
});

```

## Wireframes
-------------

## Site Map
-----------
Login --> Registration, Index
Registration --> Login
Index --> Create Question Form

## User Stories
---------------
1. As a business owner, I can find out the preferences of my target demographic. 
2. As a user, I can inform myself about the interests of the world's widely varying populations.
3. As a user, I can read through any polls and use the questions as food for thought.
4. As a user, I can confirm or disprove theories about the opinions and inclinations of particular demographics.
5. As a user, I can pose questions to the site and use the resulting visualizations to inform or entertain myself and others.
7. As a user, I can ask or answer silly questions just because I find them entertaining.


