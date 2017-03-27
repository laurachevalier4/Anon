const express = require('express');
const bodyParser = require('body-parser');
const session = require('client-sessions');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, "public")));
app.set('views', path.join(__dirname, "views"));

app.listen(3000);