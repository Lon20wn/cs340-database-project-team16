/*
Project: Janeway's OBGYN Association — CS340 Final Project
File: group16_DDL.sql
Authors: Shani Plunkett-de la Cruz, Lon Danna

Citation for this file:
Date: 05/27/2026
Adapted from our project DDL and the CS340 reset stored procedure pattern.
Source: CS340 Exploration: PL/SQL part 1, SP, View and Function.
Source URL: https://canvas.oregonstate.edu/
File purpose:
Defines base schema objects and relationships for the final project database.
*/

/*
    Create tables for the following entities: Patients, AppointmentTypes, Providers, Clinics, and Appointments. 
    Create table for ProviderLocations intersection table to represent the many-to-many relationship between Providers and Clinics.
*/

SET FOREIGN_KEY_CHECKS = 0;
SET AUTOCOMMIT = 0;

-- Patients: Records the details of the patients we serve.
CREATE OR REPLACE TABLE Patients (
    patientID INT AUTO_INCREMENT NOT NULL UNIQUE,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    dateOfBirth DATE NOT NULL,
    address VARCHAR(255) NOT NULL,
    language VARCHAR(50) NOT NULL, 
    insurancePayor VARCHAR(50) NOT NULL,
    PRIMARY KEY (patientID)
);

-- AppointmentTypes: Tracks the different kinds of appointments a patient can schedule (e.g., New Patient, Procedure, etc.).
CREATE OR REPLACE TABLE AppointmentTypes (
    typeID VARCHAR(10) NOT NULL UNIQUE,
    description VARCHAR (255) NOT NULL,
    durationInMinutes INT NOT NULL,
    PRIMARY KEY (typeID)
);

-- Providers: Records the details of the employed providers.
CREATE OR REPLACE TABLE Providers (
    providerID INT NOT NULL UNIQUE,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    startDate DATE NOT NULL,
    title VARCHAR(50) NOT NULL,
    PRIMARY KEY (providerID)
);

-- Clinics: Lists the clinic location information.
CREATE OR REPLACE TABLE Clinics (
    clinicID INT AUTO_INCREMENT NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL,
    PRIMARY KEY (clinicID)
);

/* Appointments: Records the details of the appointments scheduled for patients.

   ON DELETE RESTRICT is used for all foreign keys in the Appointments table. This means that if there are any appointments
   associated with a foreign key (typeID, patientID, providerID, clinicID), the referenced record cannot be deleted. This ensures
   that appointment data is not deleted which will be crucial for a clinic database and allows for accurate reporting and historical data analysis. 
*/
CREATE OR REPLACE TABLE Appointments (
    appointmentID INT AUTO_INCREMENT NOT NULL UNIQUE,
    apptDateTime DATETIME NOT NULL,
    apptStatus VARCHAR(50) NOT NULL,
    typeID VARCHAR(10) NOT NULL,
    patientID INT NOT NULL,
    providerID INT NOT NULL,
    clinicID INT NOT NULL,
    CONSTRAINT fk_typeID FOREIGN KEY (typeID) REFERENCES AppointmentTypes(typeID)
    ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_patientID FOREIGN KEY (patientID) REFERENCES Patients(patientID)
    ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_providerID FOREIGN KEY (providerID) REFERENCES Providers(providerID)
    ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_clinicID FOREIGN KEY (clinicID) REFERENCES Clinics(clinicID)
    ON DELETE RESTRICT ON UPDATE CASCADE,
    PRIMARY KEY (appointmentID)
);

/* ProviderLocations: Represents the M:N relationship between Providers and Clinics, indicating which providers work at which clinics.
   ON DELETE RESTRICT is used for all foreign keys so that if there are any appointments associated with a provider or clinic,
   the provider or clinic cannot be deleted.
*/
CREATE OR REPLACE TABLE ProviderLocations (
    locationID INT AUTO_INCREMENT NOT NULL UNIQUE,
    providerID INT NOT NULL,
    clinicID INT NOT NULL,
    FOREIGN KEY (providerID) REFERENCES Providers(providerID)
    ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (clinicID) REFERENCES Clinics(clinicID)
    ON DELETE RESTRICT ON UPDATE CASCADE,
    PRIMARY KEY (locationID)
);

-- Insert sample data into the tables (Date format is YYYY-MM-DD)

INSERT INTO Patients (firstName, lastName, dateOfBirth, address, language, insurancePayor)
VALUES ('Nyota', 'Uhura', '1972-03-26','1701 Enterprise Drive Corvallis, OR 97330', 'Swahili', 'United Healthcare'),
       ('Jadzia', 'Dax', '1988-01-01', '10 Forward Avenue Corvallis, OR 97330', 'English', 'Self-pay'),
       ("B'Elanna", 'Torres', '1986-06-06', 'P.O. Box 709 Salem, OR 97301', 'Spanish', 'Blue Cross Blue Shield'),
       ('Kira', 'Nerys', '1991-09-15', '74205 Promenade Lane Salem, OR 97301', 'English', 'Blue Cross Blue Shield'),
       ('Beckett', 'Mariner', '2000-04-19', '24593 Federation Drive Eugene, OR 97401', 'English', 'Aetna');

INSERT INTO AppointmentTypes (typeID, description, durationInMinutes)
VALUES ('NP', 'New Patient', 30),
       ('OVR', 'Office Visit Regular', 15),
       ('PROC', 'Procedure', 45),
       ('NOB', 'New OB', 30),
       ('OBR', 'OB Regular', 15);

INSERT INTO Providers (providerID, firstName, lastName, startDate, title)
VALUES (113, 'Beverly', 'Crusher', '2020-10-16', 'Doctor'),
       (249, 'Christine', 'Chapel', '2017-03-06', 'Nurse Practitioner'),
       (368, 'Julienne', 'Bashir', '2021-02-12', 'Midwife'),
       (102, 'Katherine', 'Pulaski', '2015-11-11', 'Doctor');

INSERT INTO Clinics (city)
VALUES ('Corvallis'),
       ('Salem'),
       ('Eugene');

INSERT INTO Appointments (apptDateTime, apptStatus, typeID, patientID, providerID, clinicID)
VALUES ('2026-07-15 14:30:00', 'Scheduled', (SELECT typeID FROM AppointmentTypes WHERE description = 'New Patient'), (SELECT patientID FROM Patients WHERE firstName = 'Jadzia' AND lastName = 'Dax'),
             (SELECT providerID FROM Providers WHERE firstName = 'Beverly' AND lastName = 'Crusher'), (SELECT clinicID FROM Clinics WHERE city = 'Corvallis')),
       ('2026-03-31 13:00:00', 'Completed', (SELECT typeID FROM AppointmentTypes WHERE description = 'Office Visit Regular'), (SELECT patientID FROM Patients WHERE firstName = 'Kira' AND lastName = 'Nerys'), 
            (SELECT providerID FROM Providers WHERE firstName = 'Katherine' AND lastName = 'Pulaski'), (SELECT clinicID FROM Clinics WHERE city = 'Salem')),
       ('2026-04-28 09:30:00', 'Cancelled', (SELECT typeID FROM AppointmentTypes WHERE description = 'Office Visit Regular'), (SELECT patientID FROM Patients WHERE firstName = 'Nyota' AND lastName = 'Uhura'), 
            (SELECT providerID FROM Providers WHERE firstName = 'Christine' AND lastName = 'Chapel'), (SELECT clinicID FROM Clinics WHERE city = 'Corvallis')),
       ('2025-12-10 10:00:00', 'Completed', (SELECT typeID FROM AppointmentTypes WHERE description = 'New OB'), (SELECT patientID FROM Patients WHERE firstName = 'Beckett' AND lastName = 'Mariner'), 
            (SELECT providerID FROM Providers WHERE firstName = 'Julienne' AND lastName = 'Bashir'), (SELECT clinicID FROM Clinics WHERE city = 'Eugene')),
       ('2026-08-09 15:00:00', 'Scheduled', (SELECT typeID FROM AppointmentTypes WHERE description = 'Procedure'), (SELECT patientID FROM Patients WHERE firstName = "B'Elanna" AND lastName = 'Torres'),
            (SELECT providerID FROM Providers WHERE firstName = 'Beverly' AND lastName = 'Crusher'), (SELECT clinicID FROM Clinics WHERE city = 'Salem'));
    

INSERT INTO ProviderLocations (providerID, clinicID)
VALUES ((SELECT providerID FROM Providers WHERE firstName = 'Beverly' AND lastName = 'Crusher'), (SELECT clinicID FROM Clinics WHERE city = 'Corvallis')),
       ((SELECT providerID FROM Providers WHERE firstName = 'Beverly' AND lastName = 'Crusher'), (SELECT clinicID FROM Clinics WHERE city = 'Salem')),
       ((SELECT providerID FROM Providers WHERE firstName = 'Christine' AND lastName = 'Chapel'), (SELECT clinicID FROM Clinics WHERE city = 'Corvallis')),
       ((SELECT providerID FROM Providers WHERE firstName = 'Julienne' AND lastName = 'Bashir'), (SELECT clinicID FROM Clinics WHERE city = 'Eugene')),
       ((SELECT providerID FROM Providers WHERE firstName = 'Katherine' AND lastName = 'Pulaski'), (SELECT clinicID FROM Clinics WHERE city = 'Salem'));

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;