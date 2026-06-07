-- Project: Janeway's OBGYN Association — CS340 Final Project
-- File: group16_DML.sql
-- Authors: Shani Plunkett-de la Cruz, Lon Danna
--
-- Janeway's OBGYN Association
-- Step 3 Draft: Data Manipulation Queries (DML)
-- Variable convention: @variableName denotes a value supplied by the backend.
--
-- Citation for this file:
-- Date: 06/04/2026
-- Adapted from team project work and class SQL patterns for SELECT, INSERT, UPDATE, and DELETE statements.
-- NOTE: Specific external source attribution is pending verification with teammates.
--
-- File purpose:
-- Reference DML queries for browse, dropdown, create, update, and delete behavior.

/* =========================================================
READ (SELECT) QUERIES - one browse query per table
========================================================= */

-- Browse Patients page
SELECT
    patientID,
    firstName,
    lastName,
    dateOfBirth,
    address,
    language,
    insurancePayor
FROM Patients
ORDER BY lastName, firstName;

-- Browse AppointmentTypes page
SELECT
    typeID,
    description,
    durationInMinutes
FROM AppointmentTypes
ORDER BY typeID;

-- Browse Providers page
SELECT
    providerID,
    firstName,
    lastName,
    startDate,
    title
FROM Providers
ORDER BY lastName, firstName;

-- Browse Clinics page
SELECT clinicID, city FROM Clinics ORDER BY city;

-- Browse Appointments page (joined, user-friendly labels)
SELECT
    a.appointmentID,
    a.apptDateTime,
    a.apptStatus,
    a.typeID,
    at.description AS appointmentType,
    a.patientID,
    CONCAT(p.firstName, ' ', p.lastName) AS patientName,
    a.providerID,
    CONCAT(
        pr.firstName,
        ' ',
        pr.lastName
    ) AS providerName,
    a.clinicID,
    c.city AS clinicCity
FROM
    Appointments a
    LEFT JOIN AppointmentTypes at ON a.typeID = at.typeID
    LEFT JOIN Patients p ON a.patientID = p.patientID
    LEFT JOIN Providers pr ON a.providerID = pr.providerID
    LEFT JOIN Clinics c ON a.clinicID = c.clinicID
ORDER BY a.apptDateTime DESC;

-- Browse ProviderLocations page (M:N intersection table)
SELECT
    pl.providerID,
    CONCAT(
        pr.firstName,
        ' ',
        pr.lastName
    ) AS providerName,
    pl.clinicID,
    c.city AS clinicCity
FROM
    ProviderLocations pl
    INNER JOIN Providers pr ON pl.providerID = pr.providerID
    INNER JOIN Clinics c ON pl.clinicID = c.clinicID
ORDER BY providerName, clinicCity;

/* =========================================================
READ (SELECT) QUERIES - dropdown/list population
========================================================= */

-- Patients dropdown
SELECT patientID, CONCAT(firstName, ' ', lastName) AS patientLabel
FROM Patients
ORDER BY lastName, firstName;

-- AppointmentTypes dropdown
SELECT typeID, description
FROM AppointmentTypes
ORDER BY description;

-- Providers dropdown
SELECT providerID, CONCAT(
        firstName, ' ', lastName, '', title
    ) AS providerLabel
FROM Providers
ORDER BY lastName, firstName;

-- Clinics dropdown
SELECT clinicID, city FROM Clinics ORDER BY city;

-- ProviderLocations dropdown support
SELECT providerID, CONCAT(firstName, ' ', lastName) AS providerLabel
FROM Providers
ORDER BY lastName, firstName;

SELECT clinicID, city FROM Clinics ORDER BY city;

/* =========================================================
CREATE (INSERT) QUERIES
========================================================= */

-- Add Patient
INSERT INTO
    Patients (
        firstName,
        lastName,
        dateOfBirth,
        address,
        language,
        insurancePayor
    )
VALUES (
        @firstNameInput,
        @lastNameInput,
        @dateOfBirthInput,
        @addressInput,
        @languageInput,
        @insurancePayorInput
    );

-- Add Appointment Type
INSERT INTO
    AppointmentTypes (
        typeID,
        description,
        durationInMinutes
    )
VALUES (
        @typeIDInput,
        @descriptionInput,
        @durationInMinutesInput
    );

-- Add Provider
INSERT INTO
    Providers (
        providerID,
        firstName,
        lastName,
        startDate,
        title
    )
VALUES (
        @providerIDInput,
        @firstNameInput,
        @lastNameInput,
        @startDateInput,
        @titleInput
    );

-- Add Clinic
INSERT INTO Clinics (city) VALUES (@cityInput);

-- Add Appointment
INSERT INTO
    Appointments (
        apptDateTime,
        apptStatus,
        typeID,
        patientID,
        providerID,
        clinicID
    )
VALUES (
        @apptDateTimeInput,
        @apptStatusInput,
        @typeIDFromDropdownInput,
        @patientIDFromDropdownInput,
        @providerIDFromDropdownInput,
        @clinicIDFromDropdownInput
    );

-- Add Provider-to-Clinic assignment (M:N)
INSERT INTO
    ProviderLocations (providerID, clinicID)
VALUES (
        @providerIDFromDropdownInput,
        @clinicIDFromDropdownInput
    );

/* =========================================================
UPDATE QUERIES
========================================================= */

-- Update Patient
UPDATE Patients
SET
    firstName = @firstNameInput,
    lastName = @lastNameInput,
    dateOfBirth = @dateOfBirthInput,
    address = @addressInput,
    language = @languageInput,
    insurancePayor = @insurancePayorInput
WHERE
    patientID = @patientIDFromUpdateForm;

-- Update Appointment Type
UPDATE AppointmentTypes
SET
    description = @descriptionInput,
    durationInMinutes = @durationInMinutesInput
WHERE
    typeID = @typeIDFromUpdateForm;

-- Update Provider
UPDATE Providers
SET
    firstName = @firstNameInput,
    lastName = @lastNameInput,
    startDate = @startDateInput,
    title = @titleInput
WHERE
    providerID = @providerIDFromUpdateForm;

-- Update Clinic
UPDATE Clinics
SET
    city = @cityInput
WHERE
    clinicID = @clinicIDFromUpdateForm;

-- Update Appointment
UPDATE Appointments
SET
    apptDateTime = @apptDateTimeInput,
    apptStatus = @apptStatusInput,
    typeID = @typeIDFromDropdownInput,
    patientID = @patientIDFromDropdownInput,
    providerID = @providerIDFromDropdownInput,
    clinicID = @clinicIDFromDropdownInput
WHERE
    appointmentID = @appointmentIDFromUpdateForm;

-- Update M:N relationship in ProviderLocations
-- (change one provider-clinic link to a different provider and/or clinic)
UPDATE ProviderLocations
SET
    providerID = @newProviderIDFromDropdownInput,
    clinicID = @newClinicIDFromDropdownInput
WHERE
    providerID = @oldProviderIDFromDropdownInput
    AND clinicID = @oldClinicIDFromDropdownInput;

/* =========================================================
DELETE QUERIES
========================================================= */

-- Delete Patient
DELETE FROM Patients WHERE patientID = @patientIDFromBrowsePage;

-- Delete Appointment Type
DELETE FROM AppointmentTypes WHERE typeID = @typeIDFromBrowsePage;

-- Delete Provider
DELETE FROM Providers WHERE providerID = @providerIDFromBrowsePage;

-- Delete Clinic
DELETE FROM Clinics WHERE clinicID = @clinicIDFromBrowsePage;

-- Delete Appointment
DELETE FROM Appointments
WHERE
    appointmentID = @appointmentIDFromBrowsePage;

-- Delete M:N relationship row from ProviderLocations
DELETE FROM ProviderLocations
WHERE
    providerID = @providerIDFromBrowsePage
    AND clinicID = @clinicIDFromBrowsePage;

/* =========================================================
OPTIONAL FILTERED READ QUERIES (useful for update forms)
========================================================= */

-- Get one Patient by PK
SELECT
    patientID,
    firstName,
    lastName,
    dateOfBirth,
    address,
    language,
    insurancePayor
FROM Patients
WHERE
    patientID = @patientIDFromBrowsePage;

-- Get one Appointment by PK
SELECT
    appointmentID,
    apptDateTime,
    apptStatus,
    typeID,
    patientID,
    providerID,
    clinicID
FROM Appointments
WHERE
    appointmentID = @appointmentIDFromBrowsePage;