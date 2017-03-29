# Anon

## Overview
Anon is a website for anonymous polling and in-depth visualizations of results based on user demographics. Users can post questions to the site for other users to vote on, and they will be able to see the results of these polls visualized based on the demographics of voters. Each poll is only valid for a set amount of time, and a user can only post a poll if they have enough points to do so; they can accumulate points by voting on other polls. Not only does this permit open data transactions but it gives all users a glimpse into how certain 'types' of people respond to all sorts of questions. Perhaps we'll find that people fall perfectly into their stereotypes. More likely, we will be surprised to find that people aren't at all what you would expect.

## Data Model

The application will store users, questions, and answers.
Users can have many questions (they can ask and answer questions) -- to be included as references.
Questions can have many users (they can be answered by many users), but they can only have one asker -- to be included as references.
Each question can have many answers and each answer has one question -- each question has a reference to its answers and each answer has a reference to the question so they can be queried in either direction.

### Sample Documents
[link to the schema](../db.js)

An example User
```
{
  username: "luruchevie",
  password: // a hashed password
  email: "notmyrealemail@nyu.edu",
  city: "New York",
  country: "USA",
  gender: "F",
  birth_date: "1996-09-11",
  bio: "",
  income: "Would rather not say...",
  education_level: "Some college",
  industry: "student",
  marital_status: "single",
  num_points: 42,
  answers: [{/* list of references to answers given */}],
  questions: [{/* list of references to questions asked */}]
}
```
An example Question
```
{
  text: "How are you doing today?",
  category: "Friendly",
  asked_by: /* some user's id */,
  answered_by: [/* list of references to users */],
  answers: [/* list of references to answers */]
}
```
An example Answer
```
{
  question: /* some question's id */,
  text: "I'm doing fabulously today!",
  voters: [/* list of references to users */]
}
```

## Wireframes

## Site Map
* Login --> Registration, Index
* Registration --> Login
* Index --> Create Question Form

## User Stories
1. As a business owner, I can find out the preferences of my target demographic. 
2. As a user, I can inform myself about the interests of the world's widely varying populations.
3. As a user, I can read through any polls and use the questions as food for thought.
4. As a user, I can confirm or disprove theories about the opinions and inclinations of particular demographics.
5. As a user, I can pose questions to the site and use the resulting visualizations to inform or entertain myself and others.
7. As a user, I can ask or answer silly questions just because I find them entertaining.

## Research Topics
1. (5 points) Authentication - I will implement authentication by creating middleware that stores user information in cookies. This will coincide with session management. I will likely use Mozilla's client-sessions, which is "connect middleware that implements sessions in encrypted tamper-free cookies" [from their docs](https://github.com/mozilla/node-client-sessions#usage). User sign-up and registration will be enabled by this authentication and database storage.
2. (4 points) Visualizations - I will use D3 to create visualizations that depict how different demographics have responded to polls. While I have some experience using D3, I want to use this project to experiment and challenge myself with new types of graphs that access the data generated from each poll then show that data in interesting and purposeful ways.
For a total of 9 points.
