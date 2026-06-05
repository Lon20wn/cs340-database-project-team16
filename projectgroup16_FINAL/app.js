// Citation for this file:
// Date: 05/06/2026
// Adapted from CS340 Node.js starter/exploration materials.
// Source: CS340 Web Application Technology Exploration and Node Part 2 walkthrough.
// Source URL: https://canvas.oregonstate.edu/
// Additional citation:
// Date: 5/28/26
// Adapted from and based on: CS340 Exploration - Implementing CUD operations in your app
// Source URL: https://canvas.oregonstate.edu/courses/2042369/pages/exploration-implementing-cud-operations-in-your-app?module_item_id=26640205

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

// ============================ NOTE ============================
// Error UX strategy:
// 1) POST routes (create/update/delete) never send a blank error page.
// 2) On failure, we redirect back to the same entity route with ?error=...
// 3) GET route reads req.query.error and passes it to the template.
// 4) Layout renders the shared error banner above page content.
// ==================================================================
// Shared helpers for in-page error/success UX.
// getErrorMessage: reads ?error= from the query string so the GET route can
// pass it to the template, which renders the shared error banner in main.hbs.
const getErrorMessage = (req) => req.query.error ? String(req.query.error) : null;

// getSuccessMessage: same pattern as getErrorMessage but for ?success= so
// the layout can render a green confirmation banner instead of a red error one.
// Used by /reset right now; can be reused for any future success feedback.
const getSuccessMessage = (req) => req.query.success ? String(req.query.success) : null;

// NOTE:
// `error.sqlMessage` often contains the raw MariaDB/MySQL engine error text.
// That message is helpful for developers, but it is usually too technical for users
// because it includes schema names, constraint names, and internal table details.
// We keep the raw error in server logs, but convert it into plain-English guidance
// before sending it back to the browser.
const getFriendlyErrorMessage = (path, error, fallbackMessage) => {
  const dbMessage = error?.sqlMessage || error?.message || '';

  // Duplicate-key/unique constraint failures are common on CREATE and some UPDATE flows.
  if (error?.code === 'ER_DUP_ENTRY') {
    switch (path) {
      case '/providers':
        // Raw SQL example:
        // ER_DUP_ENTRY: Duplicate entry '123' for key 'Providers.PRIMARY'
        return 'Unable to save provider. That provider ID already exists. Please use a different Provider ID.';
      case '/appointment-types':
        // Raw SQL example:
        // ER_DUP_ENTRY: Duplicate entry 'NEWPAT' for key 'AppointmentTypes.PRIMARY'
        return 'Unable to save appointment type. That Type ID already exists. Please use a different Type ID.';
      case '/provider-locations':
        // Raw SQL example:
        // ER_DUP_ENTRY: Duplicate entry '101-2' for key 'ProviderLocations.unique_provider_clinic'
        return 'Unable to save provider location. That provider/location combination already exists.';
      default:
        // Raw SQL examples:
        // ER_DUP_ENTRY: Duplicate entry '...' for key '...'
        return 'Unable to save this record because one of the values must be unique. Please review the form and try again.';
    }
  }

  // Foreign-key errors happen when a record is still being referenced elsewhere.
  if (error?.code === 'ER_ROW_IS_REFERENCED_2' || error?.errno === 1451) {
    switch (path) {
      case '/patients':
        // Raw SQL example:
        // Cannot delete or update a parent row: a foreign key constraint fails
        // (`...`.`Appointments`, CONSTRAINT `Appointments_ibfk_patient` FOREIGN KEY (`patientID`) ...)
        return 'Unable to delete this patient because they are still linked to one or more appointments. Delete or update those appointments first, then try again.';
      case '/appointment-types':
        // Raw SQL example:
        // Cannot delete or update a parent row: a foreign key constraint fails
        // (`...`.`Appointments`, CONSTRAINT `Appointments_ibfk_type` FOREIGN KEY (`typeID`) ...)
        return 'Unable to delete this appointment type because it is still being used by one or more appointments. Update or delete those appointments first, then try again.';
      case '/providers':
        // Raw SQL example:
        // Cannot delete or update a parent row: a foreign key constraint fails
        // (`...`.`ProviderLocations`, CONSTRAINT `ProviderLocations_ibfk_1` FOREIGN KEY (`providerID`) ...)
        return 'Unable to delete this provider because they are still linked to appointments or provider locations. Remove those related records first, then try again.';
      case '/clinics':
        // Raw SQL example:
        // Cannot delete or update a parent row: a foreign key constraint fails
        // (`...`.`ProviderLocations`, CONSTRAINT `ProviderLocations_ibfk_2` FOREIGN KEY (`clinicID`) ...)
        return 'Unable to delete this clinic because it is still linked to appointments or provider locations. Remove those related records first, then try again.';
      case '/provider-locations':
        // Raw SQL example:
        // Cannot delete or update a parent row: a foreign key constraint fails (...)
        return 'Unable to update or delete this provider location because another record still depends on it. Remove the related dependency first, then try again.';
      default:
        // Raw SQL examples:
        // ER_ROW_IS_REFERENCED_2 / errno 1451
        return 'Unable to complete this action because the record is still linked to other data. Remove the related records first, then try again.';
    }
  }

  // Child-row FK errors happen when submitted IDs do not exist in related tables.
  if (error?.code === 'ER_NO_REFERENCED_ROW_2' || error?.errno === 1452) {
    switch (path) {
      case '/appointments':
        // Raw SQL example:
        // Cannot add or update a child row: a foreign key constraint fails
        // (`...`.`Appointments`, CONSTRAINT `Appointments_ibfk_provider` FOREIGN KEY (`providerID`) ...)
        return 'Unable to save appointment because one or more selected IDs are invalid (patient, provider, clinic, or appointment type). Please reselect values and try again.';
      case '/provider-locations':
        // Raw SQL example:
        // Cannot add or update a child row: a foreign key constraint fails
        // (`...`.`ProviderLocations`, CONSTRAINT `ProviderLocations_ibfk_1` FOREIGN KEY (`providerID`) ...)
        return 'Unable to save provider location because the selected provider or clinic no longer exists. Refresh the page, reselect values, and try again.';
      default:
        // Raw SQL examples:
        // ER_NO_REFERENCED_ROW_2 / errno 1452
        return 'Unable to save this record because one of the selected related values does not exist. Refresh the page and try again.';
    }
  }

  // Appointment deletes have a business-rule requirement, not just a DB constraint.
  if (path === '/appointments' && dbMessage.toLowerCase().includes('voided')) {
    // Raw SQL/stored procedure example:
    // "Unable to delete appointment. Appointment status must be \"Voided\" in order to delete."
    return 'Unable to delete this appointment until its status is set to Voided. Edit the appointment, change the status to Voided, save the change, and then try deleting it again.';
  }

  return fallbackMessage;
};

const redirectWithError = (res, path, error, fallbackMessage) => {
  const message = getFriendlyErrorMessage(path, error, fallbackMessage);
  return res.redirect(`${path}?error=${encodeURIComponent(message)}`);
};

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
  // NOTE: pass errorMessage and successMessage so the shared layout banners
  // (defined in main.hbs) work on the home page too.
  // Example: clicking Reset Database from the home page redirects here with
  // ?success=Database+reset+successfully. which triggers the green banner.
  const errorMessage = getErrorMessage(req);
  const successMessage = getSuccessMessage(req);
  res.render('home', { errorMessage, successMessage });
});

// READ patients
// Purpose:
// - Fetch all patient rows from the Patients table
// - Render the patients.hbs page with live DB data
// NOTES:
// - The view will receive an array named `patients`
// - Each object in the array has keys matching selected column names
app.get('/patients', async function (req, res) {
  try {
    // NOTE: pull error and success text from URL query so banners can render in-page.
    // Both are passed to the template; main.hbs decides which banner color to show.
    const errorMessage = getErrorMessage(req);
    const successMessage = getSuccessMessage(req);

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
    res.render('patients', { patients: patients, errorMessage: errorMessage, successMessage: successMessage });
  }
  catch (error) {
    // Server-side logging for debugging
    console.error('Error executing queries:', error);

    // Client-facing generic error message.
    res.status(500).send('An error occurred while executing the database queries.');
  }
});

// READ appointment-types
// Purpose:
// - Fetch all appointment type rows from the AppointmentTypes table
// - Render the appointment-types.hbs page with live DB data
// NOTES:
// - The view will receive an array named `appointment_types`
// - Each object in the array has keys matching selected column names
app.get('/appointment-types', async function (req, res) {
  try {
    const errorMessage = getErrorMessage(req);
    const successMessage = getSuccessMessage(req);

    // Create and execute our queries
    // In query1 we use a JOIn clause to display the names of the homeworlds
    const query1 = `SELECT AppointmentTypes.typeID, AppointmentTypes.description, AppointmentTypes.durationInMinutes FROM AppointmentTypes;`;
    const [appointment_types] = await db.query(query1);

    // Render the appointment-types.hbs file, and also send the renderer
    // an object that contains our AppointmentTypes information
    res.render('appointment-types', { appointment_types: appointment_types, errorMessage: errorMessage, successMessage: successMessage });
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
// NOTES:
// - The view will receive an array named `providers`
// - Each object in the array has keys matching selected column names
app.get('/providers', async function (req, res) {
  try {
    const errorMessage = getErrorMessage(req);
    const successMessage = getSuccessMessage(req);

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
    res.render('providers', { providers: providers, errorMessage: errorMessage, successMessage: successMessage });
  }
  catch (error) {
    // Server-side logging for debugging
    console.error('Error executing queries:', error);

    // Client-facing generic error message.
    res.status(500).send('An error occurred while executing the database queries.');
  }
});

// READ clinics
// Purpose:
// - Fetch all clinic rows from the Clinics table
// - Render the clinics.hbs page with live DB data
// NOTES:
// - The view will receive an array named `clinic`
// - Each object in the array has keys matching selected column names
app.get('/clinics', async function (req, res) {
  try {
    const errorMessage = getErrorMessage(req);
    const successMessage = getSuccessMessage(req);

    // Create and execute our queries
    const query1 = `SELECT Clinics.clinicID, Clinics.city FROM Clinics;`;
    const [clinic] = await db.query(query1);

    // Render the clinics.hbs file and also send the renderer 
    // an object that contains our Clinics information.
    res.render('clinics', { clinic: clinic, errorMessage: errorMessage, successMessage: successMessage });
  }
  catch (error) {
    console.error('Error executing queries:', error);
    // Send a generic error message to the browser.
    res.status(500).send('An error occurred while executing the database queries.');
  }
});

// READ appointments
// Purpose:
// - Fetch all appointment rows from the Appointments table
// - Render the appointments.hbs page with live DB data
// NOTES:
// - The view will receive an array named `appointments`
// - Each object in the array has keys matching selected column names
app.get('/appointments', async function (req, res) {
  try {
    const errorMessage = getErrorMessage(req);
    const successMessage = getSuccessMessage(req);

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
      provider_IDs: provider_IDs, clinic_IDs: clinic_IDs, errorMessage: errorMessage, successMessage: successMessage
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
// NOTES:
// - The view receives an array named `providerLocations`
// - Includes provider name, clinic city, and location ID for edit/delete
app.get('/provider-locations', async function (req, res) {
  try {
    const errorMessage = getErrorMessage(req);
    const successMessage = getSuccessMessage(req);

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
      clinics: clinics,
      errorMessage: errorMessage,
      successMessage: successMessage
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

// NOTE (UX error): every CREATE catch block now calls redirectWithError(...)
// so the user stays on the same page and sees an in-page banner.

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
    return redirectWithError(
      res,
      '/patients',
      error,
      'Unable to create patient. Please verify all required fields and try again.'
    );
  }
});

// CREATE appointment-type
// Purpose:
// - Insert one new appointment type row via stored procedure
// Form dependency:
// - Expects request body fields: create_typeID, create_description, create_durationInMinutes
// DB dependency:
// - Requires stored procedure: sp_CreateAppointmentType(IN..., OUT p_typeID)
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
    return redirectWithError(
      res,
      '/appointment-types',
      error,
      'Unable to create appointment type. Please check the values and try again.'
    );
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
    return redirectWithError(
      res,
      '/providers',
      error,
      'Unable to create provider. Please verify required fields and try again.'
    );
  }
});

//Create clinic
// Purpose:
// - Insert one new clinic row via stored procedure
// Form dependency:
// - Expects request body field: create_city
// DB dependency:
// - Requires stored procedure: sp_CreateClinic(IN p_city, OUT p_clinicID)
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
    return redirectWithError(
      res,
      '/clinics',
      error,
      'Unable to create clinic. Please verify the city value and try again.'
    );
  }
});

// CREATE appointments
// Purpose:
// - Insert one new appointment row via stored procedure
// Form dependency:
// - Expects request body fields:
//   create_apptDateTime, create_apptStatus, create_typeID,
//   create_patientID, create_providerID, create_clinicID
// DB dependency:
// - Requires stored procedure: sp_CreateAppointment(IN..., OUT p_appointmentID)
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
    return redirectWithError(
      res,
      '/appointments',
      error,
      'Unable to create appointment. Please verify related IDs and date/time values.'
    );
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
    return redirectWithError(
      res,
      '/provider-locations',
      error,
      'Unable to create provider location. Please verify provider and clinic selections.'
    );
  }
});

/*
-------------------------------------------------------------
----------------------- UPDATE ROUTES -----------------------
-------------------------------------------------------------
*/

// NOTE UX error: every UPDATE catch block now calls redirectWithError(...)
// instead of res.status(...).send(...), which avoids blank error pages.

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
    return redirectWithError(
      res,
      '/patients',
      error,
      'Unable to update patient. Please review values and try again.'
    );
  }
});

// UPDATE appointment-type
// Purpose:
// - Update an existing appointment type row by typeID using stored procedure
// Form dependency:
// - Expects request body fields: update_typeID, update_description, update_durationInMinutes
// DB dependency:
// - Requires stored procedure: sp_UpdateAppointmentType(IN..., OUT p_typeID)
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
    return redirectWithError(
      res,
      '/appointment-types',
      error,
      'Unable to update appointment type. Please review values and try again.'
    );
  }
});

// UPDATE providers
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
    return redirectWithError(
      res,
      '/providers',
      error,
      'Unable to update provider. Please review values and try again.'
    );
  }
});

// UPDATE clinics
// Purpose:
// - Update an existing clinic row by clinicID using stored procedure
// Form dependency:
// - Expects request body fields: update_clinicID, update_city
// DB dependency:
// - Requires stored procedure: sp_UpdateClinic(IN..., OUT p_clinicID)
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
    return redirectWithError(
      res,
      '/clinics',
      error,
      'Unable to update clinic. Please review values and try again.'
    );
  }
});

// UPDATE appointments
// Purpose:
// - Update an existing appointment row by appointmentID using stored procedure
// Form dependency:
// - Expects request body fields:
//   update_appointmentID, update_apptDateTime, update_apptStatus,
//   update_typeID, update_patientID, update_providerID, update_clinicID
// DB dependency:
// - Requires stored procedure: sp_UpdateAppointment(IN..., OUT p_appointmentID)
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
    return redirectWithError(
      res,
      '/appointments',
      error,
      'Unable to update appointment. Please verify related IDs and date/time values.'
    );
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
    return redirectWithError(
      res,
      '/provider-locations',
      error,
      'Unable to update provider location. Please verify selections and try again.'
    );
  }
});

/*
-------------------------------------------------------------
----------------------- DELETE ROUTES -----------------------
-------------------------------------------------------------
*/

// NOTE (UX error): every DELETE catch block now calls redirectWithError(...)
// so FK/constraint failures are shown directly on the entity page.

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
    return redirectWithError(
      res,
      '/patients',
      error,
      'Unable to delete patient. It may be referenced by an appointment record.'
    );
  }
});

// DELETE appointment-type
// Purpose:
// - Delete one appointment type row by typeID via stored procedure
// Form dependency:
// - Expects request body field: delete_typeID
// DB dependency:
// - Requires stored procedure: sp_DeleteAppointmentType(IN p_typeID INT)
// - May fail if FK constraints exist (e.g., typeID referenced in Appointments)
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
    return redirectWithError(
      res,
      '/appointment-types',
      error,
      'Unable to delete appointment type. It may be referenced in an appointment record.'
    );
  }
});

// DELETE provider
// Purpose:
// - Delete one provider row by providerID via stored procedure
// DB dependency:
// - Requires stored procedure: sp_DeleteProvider(IN p_providerID INT)
// - May fail if FK constraints exist (e.g., provider referenced in Appointments or ProviderLocations)
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
    return redirectWithError(
      res,
      '/providers',
      error,
      'Unable to delete provider. It may be referenced by appointments or provider locations.'
    );
  }
});

// DELETE clinic
// Purpose:
// - Delete one clinic row by clinicID via stored procedure
// Form dependency:
// - Expects request body field: delete_clinicID
// DB dependency:
// - Requires stored procedure: sp_DeleteClinic(IN p_clinicID INT)
// - May fail if FK constraints exist (e.g., clinic referenced in Appointments or ProviderLocations)
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
    return redirectWithError(
      res,
      '/clinics',
      error,
      'Unable to delete clinic. It may be referenced by an appointment or provider location record.'
    );
  }
});

// DELETE appointment
// Purpose:
// - Delete one appointment row by appointmentID via stored procedure
// Form dependency:
// - Expects request body field: delete_appointmentID
// DB dependency:
// - Requires stored procedure: sp_DeleteAppointment(IN p_appointmentID INT)
// - May fail if FK constraints exist (e.g., appointment referenced in other tables)
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
    return redirectWithError(
      res,
      '/appointments',
      error,
      'Unable to delete appointment. Appointment status must be "Voided" in order to delete.'
    );
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
    return redirectWithError(
      res,
      '/provider-locations',
      error,
      'Unable to delete provider location. Please try again.'
    );
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

    // Redirect user back to where reset was clicked from.
    // Safety check: only allow internal app paths (must start with '/').
    const returnTo = typeof req.body.returnTo === 'string' ? req.body.returnTo : '/';
    const safeReturnTo = returnTo.startsWith('/') ? returnTo : '/';

    // Append ?success= so the GET route on the destination page can pass
    // successMessage to the template, which renders the green confirmation banner.
    // The JS in main.hbs will strip this param after one render (same pattern as ?error=).
    res.redirect(`${safeReturnTo}${safeReturnTo.includes('?') ? '&' : '?'}success=${encodeURIComponent('Database reset successfully.')}`);
  }
  catch (error) {
    console.error('Error executing queries:', error);
    res.status(500).send('Unable to reset database');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://classwork.engr.oregonstate.edu:${PORT}`);
});
