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

// READ ROUTES
// Step 3 Draft routes:
// These routes are intentionally lightweight and primarily serve browsable UI pages.
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/patients', (req, res) => {
  res.render('patients');
});

app.get('/appointment-types', async function (req, res) {
  try {
    // Create and execute our queries
    // In query1 we use a JOIn clause to display the names of the homeworlds
    const query1 = `SELECT AppointmentTypes.typeID, AppointmentTypes.description, AppointmentTypes.durationInMinutes FROM AppointmentTypes;`;
    const [appointment_types] = await db.query(query1);

    // Render the appointment-types.hbs file, and also send the renderer
    // an object that contains our AppointmentTypes information
    res.render('appointment-types', { appointment_types: appointment_types });
  }
  catch (error) {
    console.error('Error executing queries:', error);
    // Send a generic error message to the browser
    res.status(500).send('An error occured while executing the database queries.');
  }
});

app.get('/providers', (req, res) => {
  res.render('providers');
});

app.get('/clinics', (req, res) => {
  res.render('clinics');
});

app.get('/appointments', async function (req, res) {
  try {
    // Create and execute our queries
    const query1 = `SELECT Appointments.appointmentID, Appointments.apptDateTime, Appointments.apptStatus, Appointments.typeID,
                  Appointments.patientID, Appointments.providerID, Appointments.clinicID FROM Appointments;`;
    const [appointments] = await db.query(query1);

    // Render the appointments.hbs file, and also send the renderer
    // an object that contains our Appointments information
    res.render('appointments', { appointments: appointments });
  }
  catch (error) {
    console.error('Error executing queries:', error);
    res.status(500).send('An error occurred while executing the database queries.');
  }
});


// CREATE ROUTES
app.post('/appointment-types/create', async function (req, res) {
  try {
    // Parse frontend form information
    let data = req.body;

    // Create and execute our queries
    // Using parameterized queries (Prevents SQL injection attacks)
    const query1 = `CALL sp_CreateAppointmentType(?, ?, ?);`;

    await db.query(query1, [
      data.create_typeID,
      data.create_description,
      data.create_durationInMinutes,
    ]);

    console.log(`CREATE appointment_type. typeID: ${data.create_typeID} ` +
      ` Description: ${data.create_description}`);
    // Redirect the user to the updated webpage
    res.redirect('/appointment-types');
  }
  catch (error) {
    console.error('Error executing queries:', error);
    // Send a generic error message to the browser
    res.status(500).send('An error occurred while executing the database queries.');
  }
});



// UPDATE ROUTES
app.post('/appointment-types/update', async function (req, res) {
  try {
    // Parse frontend form information
    const data = req.body;

    // Create and execute our queries
    // Using parameterized queries (Prevents SQL injection attacks)
    const query1 = `CALL sp_UpdateAppointmentType(?, ?, ?);`;

    await db.query(query1, [
      data.update_typeID,
      data.update_description,
      data.update_durationInMinutes,
    ]);

    console.log(`UPDATE appointment_type. typeID: ${data.update_typeID} ` +
      ` Description: ${data.update_description}`);

    // Redirect the user to the updated webpage
    res.redirect('/appointment-types');
  }
  catch (error) {
    console.error('Error executing queries:', error);
    // Send a generic error message to the browser
    res.status(500).send('An error occurred while executing the database queries.');
  }
});


// DELETE ROUTES
app.post('/appointment-types/delete', async function (req, res) {
  try {
    // Parse frontend form information
    let data = req.body;

    // Create and execute our query
    // Using parameterized queries (Prevents SQL injection attacks)
    const query1 = `CALL sp_DeleteAppointmentType(?);`;
    await db.query(query1, [data.delete_typeID]);

    console.log(`DELETE appointment_type. typeID: ${data.delete_typeID}`);

    // Redirect the user to the updated webpage
    res.redirect('/appointment-types');
  }
  catch (error) {
    console.error('Error executing queries:', error);
    // Send a generic error message to the browser
    res.status(500).send('Unable to delete appointment type. It may be referenced in an appointment record.');
  }
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
