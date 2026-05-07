// Citation for this file:
// Date: 05/06/2026
// Adapted from CS340 Node.js starter/exploration materials.
// Source: CS340 Web Application Technology Exploration and Node Part 2 walkthrough.
// Source URL: https://canvas.oregonstate.edu/

const express = require('express');
const { engine } = require('express-handlebars');

const app = express();
const PORT = process.env.PORT || 9116;

const db = require('./database/db-connector');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/patients', (req, res) => {
  res.render('patients');
});

app.get('/appointment-types', (req, res) => {
  res.render('appointment-types');
});

app.get('/providers', (req, res) => {
  res.render('providers');
});

app.get('/clinics', (req, res) => {
  res.render('clinics');
});

app.get('/appointments', (req, res) => {
  res.render('appointments');
});

app.get('/provider-locations', (req, res) => {
  res.render('provider-locations');
});

app.listen(PORT, () => {
  console.log(`Server running on http://classwork.engr.oregonstate.edu:${PORT}`);
});
