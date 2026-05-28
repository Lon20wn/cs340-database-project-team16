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

/*
-------------------------------------------------------------
----------------------- READ ROUTES -------------------------
-------------------------------------------------------------
*/

// Step 3 Draft routes:
// These routes are intentionally lightweight and primarily serve browsable UI pages.
app.get('/', (req, res) => {
  res.render('home');
});

// READ patients
// Purpose:
// - Fetch all patient rows from the Patients table
// - Render the patients.hbs page with live DB data
// Notes:
// - The view will receive an array named `patients`
// - Each object in the array has keys matching selected column names
app.get('/patients', async function (req, res) {
  try {
    // Query all patient fields needed for the browse table
    const query1 = `
      SELECT
        patientID,
        firstName,
        lastName,
        dateOfBirth,
        address,
        language,
        insurancePayor
      FROM Patients;
    `;

    const [patients] = await db.query(query1);

    // Render template and pass DB results to Handlebars
    res.render('patients', { patients: patients });
  }
  catch (error) {
    // Server-side logging for debugging
    console.error('Error executing queries:', error);

    // Client-facing generic error message.
    res.status(500).send('An error occurred while executing the database queries.');
  }
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

// READ providers
// Purpose:
// - Fetch all provider rows from the Providers table
// - Render the providers.hbs page with live DB data
// Notes:
// - The view will receive an array named `providers`
// - Each object in the array has keys matching selected column names
app.get('/providers', async function (req, res) {
  try {
    // Query all provider fields needed for the browse table
    const query1 = `
    SELECT
      providerID,
      firstName,
      lastName,
      startDate,
      title
    FROM Providers;
     `;

    const [providers] = await db.query(query1);

    // Render template and pass DB results to Handlebars
    res.render('providers', { providers: providers });
  }
  catch (error) {
    // Server-side logging for debugging
    console.error('Error executing queries:', error);

    // Client-facing generic error message.
    res.status(500).send('An error occurred while executing the database queries.');
  }
});

app.get('/clinics', async function (req, res) {
  try {
    // Create and execute our queries
    const query1 = `SELECT Clinics.clinicID, Clinics.city FROM Clinics;`;
    const [clinic] = await db.query(query1);

    // Render the clinics.hbs file and also send the renderer 
    // an object that contains our Clinics information.
    res.render('clinics', { clinic: clinic });
  }
  catch (error) {
    console.error('Error executing queries:', error);
    // Send a generic error message to the browser.
    res.status(500).send('An error occurred while executing the database queries.');
  }
});

app.get('/appointments', async function (req, res) {
  try {
    // Create and execute our queries
    const query1 = `SELECT Appointments.appointmentID, Appointments.apptDateTime, Appointments.apptStatus, Appointments.typeID,
                  Appointments.patientID, Appointments.providerID, Appointments.clinicID FROM Appointments;`;
    const query2 = 'SELECT typeID FROM AppointmentTypes;';
    const query3 = 'SELECT patientID, firstName, lastName FROM Patients;';
    const query4 = 'SELECT providerID, lastName, title FROM Providers;';
    const query5 = 'SELECT clinicID, city FROM Clinics;';
    const [appointments] = await db.query(query1);
    const [appointment_types] = await db.query(query2);
    const [patient_IDs] = await db.query(query3);
    const [provider_IDs] = await db.query(query4);
    const [clinic_IDs] = await db.query(query5);

    // Render the appointments.hbs file, and also send the renderer
    // an object that contains our Appointments information
    res.render('appointments', {
      appointments: appointments, appointment_types: appointment_types, patient_IDs: patient_IDs,
      provider_IDs: provider_IDs, clinic_IDs: clinic_IDs
    });
  }
  catch (error) {
    console.error('Error executing queries:', error);
    res.status(500).send('An error occurred while executing the database queries.');
  }
});

// READ provider-locations
// Purpose:
// - Fetch all provider-location mappings with provider and clinic details
// - Render the provider-locations.hbs page with live DB data
// Notes:
// - The view receives an array named `providerLocations`
// - Includes provider name, clinic city, and location ID for edit/delete
app.get('/provider-locations', async function (req, res) {
  try {
    // Query provider locations with provider and clinic details for display
    const query1 = `
      SELECT
        pl.locationID,
        pl.providerID,
        pl.clinicID,
        p.firstName,
        p.lastName,
        c.city
      FROM ProviderLocations pl
      JOIN Providers p ON pl.providerID = p.providerID
      JOIN Clinics c ON pl.clinicID = c.clinicID;
    `;

   // Fetch providers for CREATE dropdown
    const query2 = `SELECT providerID, firstName, lastName FROM Providers ORDER BY lastName, firstName;`;

    // Fetch clinics for CREATE/UPDATE dropdown
    const query3 = `SELECT clinicID, city FROM Clinics ORDER BY clinicID;`;

    const [providerLocations] = await db.query(query1);
    const [providers]         = await db.query(query2);
    const [clinics]           = await db.query(query3);

    // Render template and pass DB results to Handlebars
    res.render('provider-locations', {
      providerLocations: providerLocations,
      providers: providers,
      clinics: clinics
    });
  }
  catch (error) {
    // Server-side logging for debugging
    console.error('Error executing queries:', error);

    // Client-facing generic error message
    res.status(500).send('An error occurred while executing the database queries.');
  }
});

/*
-------------------------------------------------------------
----------------------- CREATE ROUTES -----------------------
-------------------------------------------------------------
*/

// CREATE patient
// Purpose:
// - Insert one new patient row via stored procedure
// Form dependency:
// - Expects request body fields:
//   create_firstName, create_lastName, create_dateOfBirth,
//   create_address, create_language, create_insurancePayor
// DB dependency:
// - Requires stored procedure: sp_CreatePatient(IN..., OUT p_patientID)
app.post('/patients/create', async function (req, res) {
  try {
    // Parse submitted form data
    let data = req.body;

    // Use stored procedure for insertion
    // @new_id captures output from the procedure call pattern used elsewhere in this app
    const query1 = `CALL sp_CreatePatient(?, ?, ?, ?, ?, ?, @new_id);`;

    // Execute with parameterized values (safe against SQL injection)
    const [[[rows]]] = await db.query(query1, [
      data.create_firstName,
      data.create_lastName,
      data.create_dateOfBirth,
      data.create_address,
      data.create_language,
      data.create_insurancePayor
    ]);

    console.log(
      `CREATE patient. ID: ${rows.new_id} Name: ${data.create_firstName} ${data.create_lastName}`
    );

    // PRG pattern: redirect user after successful POST
    res.redirect('/patients');
  }
  catch (error) {
    console.error('Error executing queries:', error);
    res.status(500).send('An error occurred while executing the database queries.');
  }
});

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

// CREATE provider
// Purpose:
// - Insert one new provider row via stored procedure
// DB dependency:
// - Requires stored procedure: sp_CreateProvider
app.post('/providers/create', async function (req, res) {
  try {
    const data = req.body;

    // Accept either prefixed or non-prefixed form names
    const providerID = data.create_providerID ?? data.providerID;
    const firstName = data.create_firstName ?? data.firstName;
    const lastName = data.create_lastName ?? data.lastName;
    const startDate = data.create_startDate ?? data.startDate;
    const title = data.create_title ?? data.title;

    const query1 = `CALL sp_CreateProvider(?, ?, ?, ?, ?);`;
    await db.query(query1, [providerID, firstName, lastName, startDate, title]);

    res.redirect('/providers');
  }
  catch (error) {
    console.error('Error creating provider:', error);
    res.status(500).send('An error occurred while creating the provider.');
  }
});

app.post('/appointments/create', async function (req, res) {
  try {
    // Parse frontend form information
    let data = req.body;

    // Create and execute our queries
    // Using parameterized queries (Prevents SQL injection attacks)
    const query1 = `CALL sp_CreateAppointment(?, ?, ?, ?, ?, ?, @new_id);`;

    // Store Id of last inserted row
    const [[[rows]]] = await db.query(query1, [
      data.create_apptDateTime,
      data.create_apptStatus,
      data.create_typeID,
      data.create_patientID,
      data.create_providerID,
      data.create_clinicID,
    ]);

    console.log(`Create Appointment. ID: ${rows.new_id}` +
      `Date/Time: ${data.create_apptDatetime}`
    );

    // Redirect the user to the updated webpage
    res.redirect('/appointments');
  }
  catch (error) {
    console.error('Error executing querires:', error);
    // Send a generic error message to the browser
    res.status(500).send('An error occurred while excuting the database queries.');
  }
});


app.post('/clinics/create', async function (req, res) {
  try {
    //Parse frontend form information
    let data = req.body;

    // Create and execute our queries
    // Using parameterized queries (Prevents SQL injection attacks)
    const query1 = `CALL sp_CreateClinic(?, @new_id);`;

    // Store ID of last inserted row
    const [[[rows]]] = await db.query(query1, [
      data.create_city
    ]);

    console.log(`CREATE Clinic. ID: ${rows.new_id} ` + `City: ${data.create_city}`);

    // Redirect the user to the updated webpage
    res.redirect('/clinics');
  }
  catch (error) {
    console.error('Error executing queries:', error);
    res.status(500).send('An error occurred while executing the database queries.');
  }
});

// CREATE provider-location
// Purpose:
// - Insert one new row into ProviderLocations (intersection table)
// DB dependency:
// - Requires stored procedure: sp_CreateProviderLocation
app.post('/provider-locations/create', async function (req, res) {
  try {
    const data = req.body;
    const query1 = `CALL sp_CreateProviderLocation(?, ?);`;
    await db.query(query1, [
      data.create_providerID,
      data.create_clinicID
    ]);

    console.log(`CREATE provider-location. providerID: ${data.create_providerID} clinicID: ${data.create_clinicID}`);
    res.redirect('/provider-locations');
  }
  catch (error) {
    console.error('Error creating provider-location:', error);
    res.status(500).send('An error occurred while creating the provider location.');
  }
});

/*
-------------------------------------------------------------
----------------------- UPDATE ROUTES -----------------------
-------------------------------------------------------------
*/

// UPDATE patient
// Purpose:
// - Update an existing patient row by patientID using stored procedure
// Form dependency:
// - Expects request body fields:
//   update_patientID, update_firstName, update_lastName, update_dateOfBirth,
//   update_address, update_language, update_insurancePayor
// DB dependency:
// - Requires stored procedure: sp_UpdatePatient(...)
app.post('/patients/update', async function (req, res) {
  try {
    // Parse frontend form information
    const data = req.body;

    // Create and execute our query
    // Using parameterized queries (Prevents SQL injection attacks)
    const query1 = `CALL sp_UpdatePatient(?, ?, ?, ?, ?, ?, ?);`;

    await db.query(query1, [
      data.update_patientID,
      data.update_firstName,
      data.update_lastName,
      data.update_dateOfBirth,
      data.update_address,
      data.update_language,
      data.update_insurancePayor
    ]);

    console.log(`UPDATE patient. ID: ${data.update_patientID}`);

    // Redirect back to browse page so user sees updated values
    res.redirect('/patients');
  }
  catch (error) {
    console.error('Error executing queries:', error);
    // Send a generic error message to the browser
    res.status(500).send('An error occurred while executing the database queries.');
  }
});

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

// UPDATE provider
// Purpose:
// - Update an existing provider row via stored procedure
// DB dependency:
// - Requires stored procedure: sp_UpdateProvider
app.post('/providers/update', async function (req, res) {
  try {
    const data = req.body;

    // Accept either prefixed or non-prefixed form names
    const providerID = data.update_providerID ?? data.providerIDLookup ?? data.providerID;
    const firstName = data.update_firstName ?? data.firstName;
    const lastName = data.update_lastName ?? data.lastName;
    const startDate = data.update_startDate ?? data.startDate;
    const title = data.update_title ?? data.title;

    const query1 = `CALL sp_UpdateProvider(?, ?, ?, ?, ?);`;
    await db.query(query1, [providerID, firstName, lastName, startDate, title]);

    res.redirect('/providers');
  }
  catch (error) {
    console.error('Error updating provider:', error);
    res.status(500).send('An error occurred while updating the provider.');
  }
});

app.post('/appointments/update', async function (req, res) {
  try {
    // Parse frontend form information
    const data = req.body;

    // Create and execute our queries
    // Using parameterized queries (Prevents SQL injection attacks)
    const query1 = `CALL sp_UpdateAppointment(?, ?, ?, ?, ?, ?, ?);`;

    await db.query(query1, [
      data.update_appointmentID,
      data.update_apptDateTime,
      data.update_apptStatus,
      data.update_typeID,
      data.update_patientID,
      data.update_providerID,
      data.update_clinicID
    ]);

    console.log(`UPDATE appointment. ID: ${data.update_appointmentID} ` + `Date/Time: ${data.update_apptDateTime}`);

    // Redirect the user to the updated webpage data
    res.redirect('/appointments');
  }
  catch (error) {
    console.error('Error executing queries:', error);
    // Send a generic error message to the browser
    res.status(500).send('An error occurred while executing the database queries.');
  }
});


app.post('/clinics/update', async function (req, res) {
  try {
    // Parse frontend form information
    const data = req.body;

    // Create and execute our query
    // Using parameterized queries (Prevents SQL injection attacks)
    const query1 = `CALL sp_UpdateClinic(?, ?);`;
    await db.query(query1, [
      data.update_clinicID,
      data.update_city,
    ]);

    console.log(`UPDATE clinics. ID ${data.update_clinicID} ` + `City: ${data.update_city}`);

    // Redirect the user to the updated webpage data
    res.redirect('/clinics');
  }
  catch (error) {
    console.error('Error executing queries:', error);
    // Send a generic error message to the browser
    res.status(500).send('An error occurred while executing the database queries.');
  }
});

// UPDATE provider-location
// Purpose:
// - Update clinicID for an existing ProviderLocations row
// DB dependency:
// - Requires stored procedure: sp_UpdateProviderLocation
app.post('/provider-locations/update', async function (req, res) {
  try {
    const data = req.body;
    const query1 = `CALL sp_UpdateProviderLocation(?, ?);`;
    await db.query(query1, [
      data.update_locationID,
      data.update_clinicID
    ]);

    console.log(`UPDATE provider-location. locationID: ${data.update_locationID} new clinicID: ${data.update_clinicID}`);
    res.redirect('/provider-locations');
  }
  catch (error) {
    console.error('Error updating provider-location:', error);
    res.status(500).send('An error occurred while updating the provider location.');
  }
});

/*
-------------------------------------------------------------
----------------------- DELETE ROUTES -----------------------
-------------------------------------------------------------
*/

// DELETE patient
// Purpose:
// - Delete one patient row by patientID via stored procedure
// Form dependency:
// - Expects request body field: delete_patientID
// DB dependency:
// - Requires stored procedure: sp_DeletePatient(IN p_patientID INT)
// - May fail if FK constraints exist (e.g., patient referenced in Appointments)
app.post('/patients/delete', async function (req, res) {
  try {
    let data = req.body;

    // Create and execute our query
    // Using parameterized queries (Prevents SQL injection attacks)
    const query1 = `CALL sp_DeletePatient(?);`;
    await db.query(query1, [data.delete_patientID]);

    console.log(`DELETE patient. ID: ${data.delete_patientID}`);

    // Redirect the user to the updated webpage data
    res.redirect('/patients');
  }
  catch (error) {
    console.error('Error executing queries:', error);
        // Send error message to the browser
    res.status(500).send('Unable to delete patient. It may be referenced by an appointment record.');
  }
});

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

// DELETE provider
// Purpose:
// - Delete one provider row via stored procedure
// DB dependency:
// - Requires stored procedure: sp_DeleteProvider
app.post('/providers/delete', async function (req, res) {
  try {
    const data = req.body;

    // Accept either prefixed or non-prefixed form names
    const providerID = data.delete_providerID ?? data.providerID;

    const query1 = `CALL sp_DeleteProvider(?);`;
    await db.query(query1, [providerID]);

    res.redirect('/providers');
  }
  catch (error) {
    console.error('Error deleting provider:', error);
    res.status(500).send('An error occurred while deleting the provider.');
  }
});

app.post('/appointments/delete', async function (req, res) {
  try {
    // Parse frontend form information
    let data = req.body;

    // Create and execute our query
    // Using parameterized queries (Prevents SQL injection attacks)
    const query1 = 'CALL sp_DeleteAppointment(?);';
    await db.query(query1, [data.delete_appointmentID]);

    console.log(`DELETE appointment. ID: ${data.delete_appointmentID}`);

    // Redirect the user to the updated webpage data
    res.redirect('/appointments');
  }
  catch (error) {
    console.error('Error executing queries:', error);
    // Send a generic error message to the browser
    res.status(500).send('Unable to delete appointment. Appointment status must be "Voided" in order to delete.');
  }
});


app.post('/clinics/delete', async function (req, res) {
  try {
    // Parse frontend form information
    let data = req.body;

    // Create and execute our query
    // Using parameterized queries (Prevents SQL injection attacks)
    const query1 = `CALL sp_DeleteClinic(?);`;
    await db.query(query1, [data.delete_clinicID]);

    console.log(`DELETE clinic. ID: ${data.delete_clinicID} ` + `City: ${data.delete_clinicID}`);

    // Redirect the user to the updated webpage data
    res.redirect('/clinics');
  }
  catch (error) {
    console.error('Error executing queries:', error);
    // Send a generic error message to the browser
    res.status(500).send('Unable to delete clinic. It may be referenced to an appointment record');
  }
});

// DELETE provider-location
// Purpose:
// - Delete one ProviderLocations row by locationID
// DB dependency:
// - Requires stored procedure: sp_DeleteProviderLocation
app.post('/provider-locations/delete', async function (req, res) {
  try {
    const data = req.body;
    const query1 = `CALL sp_DeleteProviderLocation(?);`;
    await db.query(query1, [data.delete_locationID]);

    console.log(`DELETE provider-location. locationID: ${data.delete_locationID}`);
    res.redirect('/provider-locations');
  }
  catch (error) {
    console.error('Error deleting provider-location:', error);
    res.status(500).send('An error occurred while deleting the provider location.');
  }
});

// Step 3 draft placeholder endpoint:
// Used by UI buttons to show that edit/delete backend logic is intentionally
// deferred to a later project step.
app.get('/not-implemented', (req, res) => {
  const feature = req.query.feature || 'This action';
  res.status(501).send(`${feature} is not implemented yet in Step 3 Draft.`);
});

/*
-------------------------------------------------------------
----------------------- RESET -----------------------
-------------------------------------------------------------
*/
app.post('/reset', async function (req, res) {
  try {
    const query1 = `CALL sp_Reset();`;
    await db.query(query1);

    console.log(`Database has been reset`);

    // Redirect the user back to the home page
    res.redirect('/');
  }
  catch (error) {
    console.error('Error executing queries:', error);
    res.status(500).send('Unable to reset database');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://classwork.engr.oregonstate.edu:${PORT}`);
});
