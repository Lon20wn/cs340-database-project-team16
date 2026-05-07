// Citation for this file:
// Date: 05/06/2026
// Adapted from CS340 Node.js starter/exploration materials.
// Source: CS340 Web Application Technology Exploration and Node Part 2 walkthrough.
// Source URL: https://canvas.oregonstate.edu/

const express = require('express');
const { engine } = require('express-handlebars');

const app = express();
const PORT = process.env.PORT || 9116;

// db-connector is imported now so later steps can wire real SQL behavior.
// For Step 3 Draft, most routes still only render browsable UI pages.
const db = require('./database/db-connector');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Shared Handlebars setup for all entity pages.
app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');

// Step 3 Draft routes:
// These routes are intentionally lightweight and primarily serve browsable UI pages.
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

// Step 3 draft placeholder endpoint:
// Used by UI buttons to show that edit/delete backend logic is intentionally
// deferred to a later project step.
app.get('/not-implemented', (req, res) => {
  const feature = req.query.feature || 'This action';
  res.status(501).send(`${feature} is not implemented yet in Step 3 Draft.`);
});

app.listen(PORT, () => {
  console.log(`Server running on http://classwork.engr.oregonstate.edu:${PORT}`);
});
