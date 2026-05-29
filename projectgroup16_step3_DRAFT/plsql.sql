-------------------------------------------------------------
--Citation for this file:
--Date: 05/24/2026
--Adapted from: 
--Source: CS340 Exploration - Implementing CUD operations in your app
--Source URL: https://canvas.oregonstate.edu/courses/2042369/pages/exploration-implementing-cud-operations-in-your-app?module_item_id=26640205

--Additional Citation for the DELETE Appointment stored procedure:
--Date: 05/25/2026
--Adapted from and based on: Microsoft Copilot suggestions.
--Source URL: copilot.microsoft.com
--Prompt used: "Update stored procedure to only delete appointment if appointment status is "Voided".

-- Additional Citation for the RESET stored procedure:
-- Date: 5/27/2026
-- Adapted from: Microsoft Copilot suggestions.
-- Source URL: copilot.microsoft.com
-- Prompt used: "Write a stored procedure called reset that executes an original DDL file and removes any added data."
----------------------------------------------------------------------------------------


-- ###############################################
-- RESET webpage and database to original schema
-- ###############################################
DROP PROCEDURE IF EXISTS sp_Reset;

DELIMITER //

CREATE PROCEDURE sp_Reset()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SET FOREIGN_KEY_CHECKS = 0;

    -- Drop all tables
    DROP TABLE IF EXISTS ProviderLocations;
    DROP TABLE IF EXISTS Appointments;
    DROP TABLE IF EXISTS Patients;
    DROP TABLE IF EXISTS AppointmentTypes;
    DROP TABLE IF EXISTS Providers;
    DROP TABLE IF EXISTS Clinics;

    -- Reset original schema

    -- Patients: Records the details of the patients we serve.
    CREATE TABLE Patients (
        patientID INT AUTO_INCREMENT NOT NULL UNIQUE,
        firstName VARCHAR(50) NOT NULL,
        lastName VARCHAR(50) NOT NULL,
        dateOfBirth DATE NOT NULL,
        address VARCHAR(255) NOT NULL,
        language VARCHAR(50) NOT NULL,
        insurancePayor VARCHAR(50) NOT NULL,
        PRIMARY KEY (patientID)
    );

    -- AppointmentTypes: Tracks the different kinds of appointments a patient can schedule.
    CREATE TABLE AppointmentTypes (
        typeID VARCHAR(10) NOT NULL UNIQUE,
        description VARCHAR(255) NOT NULL,
        durationInMinutes INT NOT NULL,
        PRIMARY KEY (typeID)
    );

    -- Providers: Records the details of the employed providers.
    CREATE TABLE Providers (
        providerID INT NOT NULL UNIQUE,
        firstName VARCHAR(50) NOT NULL,
        lastName VARCHAR(50) NOT NULL,
        startDate DATE NOT NULL,
        title VARCHAR(50) NOT NULL,
        PRIMARY KEY (providerID)
    );

    -- Clinics: Lists the clinic location information.
    CREATE TABLE Clinics (
        clinicID INT AUTO_INCREMENT NOT NULL UNIQUE,
        city VARCHAR(100) NOT NULL,
        PRIMARY KEY (clinicID)
    );

    -- Appointments: Records the details of the appointments scheduled for patients.
    CREATE TABLE Appointments (
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

    -- ProviderLocations: Represents the M:N relationship between Providers and Clinics.
    CREATE TABLE ProviderLocations (
        locationID INT AUTO_INCREMENT NOT NULL UNIQUE,
        providerID INT NOT NULL,
        clinicID INT NOT NULL,
        FOREIGN KEY (providerID) REFERENCES Providers(providerID)
            ON DELETE RESTRICT ON UPDATE CASCADE,
        FOREIGN KEY (clinicID) REFERENCES Clinics(clinicID)
            ON DELETE RESTRICT ON UPDATE CASCADE,
        PRIMARY KEY (locationID)
    );

    -- Insert sample data (Date format is YYYY-MM-DD)

    INSERT INTO Patients (firstName, lastName, dateOfBirth, address, language, insurancePayor)
    VALUES ('Nyota', 'Uhura', '1972-03-26', '1701 Enterprise Drive Corvallis, OR 97330', 'Swahili', 'United Healthcare'),
           ('Jadzia', 'Dax', '1988-01-01', '10 Forward Avenue Corvallis, OR 97330', 'English', 'Self-pay'),
           ('B''Elanna', 'Torres', '1986-06-06', 'P.O. Box 709 Salem, OR 97301', 'Spanish', 'Blue Cross Blue Shield'),
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
    VALUES ('2026-07-15 14:30:00', 'Scheduled',
                (SELECT typeID FROM AppointmentTypes WHERE description = 'New Patient'),
                (SELECT patientID FROM Patients WHERE firstName = 'Jadzia' AND lastName = 'Dax'),
                (SELECT providerID FROM Providers WHERE firstName = 'Beverly' AND lastName = 'Crusher'),
                (SELECT clinicID FROM Clinics WHERE city = 'Corvallis')),
           ('2026-03-31 13:00:00', 'Completed',
                (SELECT typeID FROM AppointmentTypes WHERE description = 'Office Visit Regular'),
                (SELECT patientID FROM Patients WHERE firstName = 'Kira' AND lastName = 'Nerys'),
                (SELECT providerID FROM Providers WHERE firstName = 'Katherine' AND lastName = 'Pulaski'),
                (SELECT clinicID FROM Clinics WHERE city = 'Salem')),
           ('2026-04-28 09:30:00', 'Cancelled',
                (SELECT typeID FROM AppointmentTypes WHERE description = 'Office Visit Regular'),
                (SELECT patientID FROM Patients WHERE firstName = 'Nyota' AND lastName = 'Uhura'),
                (SELECT providerID FROM Providers WHERE firstName = 'Christine' AND lastName = 'Chapel'),
                (SELECT clinicID FROM Clinics WHERE city = 'Corvallis')),
           ('2025-12-10 10:00:00', 'Completed',
                (SELECT typeID FROM AppointmentTypes WHERE description = 'New OB'),
                (SELECT patientID FROM Patients WHERE firstName = 'Beckett' AND lastName = 'Mariner'),
                (SELECT providerID FROM Providers WHERE firstName = 'Julienne' AND lastName = 'Bashir'),
                (SELECT clinicID FROM Clinics WHERE city = 'Eugene')),
           ('2026-08-09 15:00:00', 'Scheduled',
                (SELECT typeID FROM AppointmentTypes WHERE description = 'Procedure'),
                (SELECT patientID FROM Patients WHERE firstName = 'B''Elanna' AND lastName = 'Torres'),
                (SELECT providerID FROM Providers WHERE firstName = 'Beverly' AND lastName = 'Crusher'),
                (SELECT clinicID FROM Clinics WHERE city = 'Salem'));

    INSERT INTO ProviderLocations (providerID, clinicID)
    VALUES ((SELECT providerID FROM Providers WHERE firstName = 'Beverly' AND lastName = 'Crusher'),
                (SELECT clinicID FROM Clinics WHERE city = 'Corvallis')),
           ((SELECT providerID FROM Providers WHERE firstName = 'Beverly' AND lastName = 'Crusher'),
                (SELECT clinicID FROM Clinics WHERE city = 'Salem')),
           ((SELECT providerID FROM Providers WHERE firstName = 'Christine' AND lastName = 'Chapel'),
                (SELECT clinicID FROM Clinics WHERE city = 'Corvallis')),
           ((SELECT providerID FROM Providers WHERE firstName = 'Julienne' AND lastName = 'Bashir'),
                (SELECT clinicID FROM Clinics WHERE city = 'Eugene')),
           ((SELECT providerID FROM Providers WHERE firstName = 'Katherine' AND lastName = 'Pulaski'),
                (SELECT clinicID FROM Clinics WHERE city = 'Salem'));

    SET FOREIGN_KEY_CHECKS = 1;

    COMMIT;
END//

DELIMITER ;

-- ##########################################################################
-- ################################ PATIENTs ################################
-- ##########################################################################

-- ###############################
-- CREATE PATIENT
-- ###############################
DROP PROCEDURE IF EXISTS sp_CreatePatient;

DELIMITER //

CREATE PROCEDURE sp_CreatePatient (
    IN p_firstName VARCHAR(50),
    IN p_lastName VARCHAR(50),
    IN p_dateOfBirth DATE,
    IN p_address VARCHAR(255),
    IN p_language VARCHAR(50),
    IN p_insurancePayor VARCHAR(50),
    OUT p_patientID INT
)
BEGIN
    INSERT INTO Patients (firstName, lastName, dateOfBirth, address, language, insurancePayor)
    VALUES (p_firstName, p_lastName, p_dateOfBirth, p_address, p_language, p_insurancePayor);
    
    -- Store the ID of the last inserted row
    SELECT LAST_INSERT_ID() into p_patientID;
    -- Display the ID of the last inserted patient
    SELECT LAST_INSERT_ID() AS 'new_id';

END //

DELIMITER ;

-- #########################
-- UPDATE PATIENT
-- #########################
DROP PROCEDURE IF EXISTS sp_UpdatePatient;

DELIMITER //

CREATE PROCEDURE sp_UpdatePatient (
    IN p_patientID INT,
    IN p_firstName VARCHAR(50),
    IN p_lastName VARCHAR(50),
    IN p_dateOfBirth DATE,
    IN p_address VARCHAR(255),
    IN p_language VARCHAR(50),
    IN p_insurancePayor VARCHAR(50)
)
BEGIN
    UPDATE Patients
    SET firstName = p_firstName, lastName = p_lastName, dateOfBirth = p_dateOfBirth, address = p_address, language = p_language, insurancePayor = p_insurancePayor
    WHERE patientID = p_patientID;
END //

DELIMITER ;

-- #########################
-- DELETE PATIENT
-- #########################
DROP PROCEDURE IF EXISTS sp_DeletePatient;

DELIMITER //

CREATE PROCEDURE sp_DeletePatient (IN p_patientID INT)
BEGIN
    DECLARE error_message VARCHAR(255);

    -- error handling
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Roll back the transaction on any error
        ROLLBACK;
        -- Propogate the custom error message to the caller
        RESIGNAL;
    END;

    START TRANSACTION;
        -- Deleting will only work if patientID is not referenced in an appointment due to ON DELETE RESTRICT foreign key constraint.
        DELETE FROM Patients WHERE patientID = p_patientID;

        -- ROW_COUNT() returns the number of rows affected by the preceding statement.
        IF ROW_COUNT() = 0 THEN
            SET error_message = CONCAT('Patient cannot be deleted either because it is associated with an appointment or it does not exist.');
            -- Trigger custom error, invoke EXIT HANDLER
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
        END IF;
    COMMIT;

END //

DELIMITER ;

-- ##########################################################################
-- ######################## Appointment-Types ###############################
-- ##########################################################################

-- ###############################
-- CREATE AppointmentType
-- ###############################
DROP PROCEDURE IF EXISTS sp_CreateAppointmentType;

DELIMITER //

CREATE PROCEDURE sp_CreateAppointmentType (
    IN p_typeID VARCHAR(10),
    IN p_description VARCHAR(255),
    IN p_durationInMinutes INT
)

BEGIN
    INSERT INTO AppointmentTypes (typeID, description, durationInMinutes)
    VALUES (p_typeID, p_description, p_durationInMinutes);

END//

DELIMITER ;

-- #########################
-- UPDATE AppointmentType
-- #########################
DROP PROCEDURE IF EXISTS sp_UpdateAppointmentType;

DELIMITER //

CREATE PROCEDURE sp_UpdateAppointmentType (
    IN p_typeID VARCHAR(10),
    IN p_description VARCHAR(255),
    IN p_durationInMinutes INT
)
BEGIN
    UPDATE AppointmentTypes SET description = p_description, durationInMinutes = p_durationInMinutes
    WHERE typeID = p_typeID;
END//

DELIMITER ;

-- #########################
-- DELETE AppointmentType
-- #########################
DROP PROCEDURE IF EXISTS sp_DeleteAppointmentType;

DELIMITER //

CREATE PROCEDURE sp_DeleteAppointmentType (IN p_typeID VARCHAR(10))
BEGIN
    DECLARE error_message VARCHAR(255);
-- error handling
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Roll back the transaction on any error
        ROLLBACK;
        -- Propogate the custom error message to the caller
        RESIGNAL;
    END;

    START TRANSACTION;
        -- Deleting an appointment type will only work if there are no matching appointments with that typeID
        DELETE FROM AppointmentTypes WHERE typeID = p_typeID;

        -- ROW_COUT() returns the number of rows affected by the preceding statement.
        IF ROW_COUNT() = 0 THEN
            -- If no rows were deleted, it means there was a foreign key constraint violation
            SET error_message = CONCAT('Appointment type cannot be deleted either because it does not exist 
            or there are appointments associated with type ID: ', p_typeID);
            -- Trigger custom error, invoke EXIT HANDLER
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
        END IF;
    COMMIT;
    
END//

DELIMITER ;

-- ##########################################################################
-- ################################# PROVIDERS ##############################
-- ##########################################################################

-- ###############################
-- CREATE PROVIDER
-- ###############################
DROP PROCEDURE IF EXISTS sp_CreateProvider;

DELIMITER //

CREATE PROCEDURE sp_CreateProvider (
    IN p_providerID INT,
    IN p_firstName VARCHAR(50),
    IN p_lastName VARCHAR(50),
    IN p_startDate DATE,
    IN p_title VARCHAR(50)
)
BEGIN
    INSERT INTO Providers (providerID, firstName, lastName, startDate, title)
    VALUES (p_providerID, p_firstName, p_lastName, p_startDate, p_title);
    
    -- Display the ID of the inserted provider
    SELECT p_providerID AS 'new_id';

END //

DELIMITER ;

-- #########################
-- UPDATE PROVIDER
-- #########################
DROP PROCEDURE IF EXISTS sp_UpdateProvider;

DELIMITER //

CREATE PROCEDURE sp_UpdateProvider (
    IN p_providerID INT,
    IN p_firstName VARCHAR(50),
    IN p_lastName VARCHAR(50),
    IN p_startDate DATE,
    IN p_title VARCHAR(50)
)
BEGIN
    UPDATE Providers
    SET firstName = p_firstName, lastName = p_lastName, startDate = p_startDate, title = p_title
    WHERE providerID = p_providerID;
END //

DELIMITER ;

-- #########################
-- DELETE PROVIDER
-- #########################
DROP PROCEDURE IF EXISTS sp_DeleteProvider;

DELIMITER //

CREATE PROCEDURE sp_DeleteProvider (IN p_providerID INT)
BEGIN
    DECLARE error_message VARCHAR(255);

    -- error handling
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Roll back the transaction on any error
        ROLLBACK;
        -- Propagate the custom error message to the caller
        RESIGNAL;
    END;

    START TRANSACTION;
        -- Deleting will only work if providerID is not referenced in appointments or provider locations due to ON DELETE RESTRICT foreign key constraint.
        DELETE FROM Providers WHERE providerID = p_providerID;

        -- ROW_COUNT() returns the number of rows affected by the preceding statement.
        IF ROW_COUNT() = 0 THEN
            SET error_message = CONCAT('Provider cannot be deleted either because it is associated with an appointment or provider location or it does not exist.');
            -- Trigger custom error, invoke EXIT HANDLER
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
        END IF;
    COMMIT;

END //

DELIMITER ;

-- ##########################################################################
-- ################################# Clinics ################################
-- ##########################################################################

-- #########################
-- CREATE CLINIC
-- #########################
DROP PROCEDURE IF EXISTS sp_CreateClinic;

DELIMITER //

CREATE PROCEDURE sp_CreateClinic(
    IN p_city VARCHAR(50),
    OUT p_clinicID INT
)
BEGIN
    INSERT INTO Clinics (city)
    VALUES (p_city);

    -- Store the ID of the last inserted row
    SELECT LAST_INSERT_ID() into p_clinicID;
    -- Display the ID of the last inserted clinic
    SELECT LAST_INSERT_ID() as 'new_id';

END //

DELIMITER ;

-- #########################
-- UPDATE CLINIC
-- #########################
DROP PROCEDURE IF EXISTS sp_UpdateClinic;

DELIMITER //

CREATE PROCEDURE sp_UpdateClinic (
    IN p_clinicID INT,
    IN p_city VARCHAR(50)
)

BEGIN
    UPDATE Clinics SET city = p_city WHERE clinicID = p_clinicID;
    
END //

DELIMITER ;

-- #########################
-- DELETE CLINIC
-- #########################
DROP PROCEDURE IF EXISTS sp_DeleteClinic;

DELIMITER //

CREATE PROCEDURE sp_DeleteClinic  (
    IN p_clinicID INT
)
BEGIN
    DECLARE error_message VARCHAR(255);

    -- error handling
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Roll back the transaction on any error
        ROLLBACK;
        -- Propogate the custome error message to the caller
        RESIGNAL;
    END;

    START TRANSACTION;
        -- Deleting will only work if clinicID is not referenced in an appointment due to ON DELETE RESTRICT foreign key constraint. 
        DELETE FROM Clinics WHERE clinicID = p_clinicID;

        -- ROW_COUNT() returns the number of rows affected by the preceding statement.
        IF ROW_COUNT() = 0 THEN
            SET error_message = CONCAT('Clinic cannot be deleted either because it is associated with an appointment or it does not exist.');
            -- Trigger custome error, invoke EXIT HANDLER
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
        END IF;
    COMMIT;

END //

DELIMITER ;

-- ##########################################################################
-- ############################ Appointments ################################
-- ##########################################################################

-- ###############################
-- CREATE Appointment
-- ###############################

DROP PROCEDURE IF EXISTS sp_CreateAppointment;

DELIMITER //

CREATE PROCEDURE sp_CreateAppointment (
    IN p_apptDateTime DATETIME,
    IN p_apptStatus VARCHAR(50),
    IN p_typeID VARCHAR(10),
    IN p_patientID INT,
    IN p_providerID INT,
    IN p_clinicID INT,
    OUT p_appointmentID INT  
)
BEGIN
    INSERT INTO Appointments (apptDateTime, apptStatus, typeID, patientID, providerID, clinicID)
    VALUES (p_apptDateTime, p_apptStatus, p_typeID, p_patientID, p_providerID, p_clinicID);
    
    -- Store the ID of the last inserted row
    SELECT LAST_INSERT_ID() into p_appointmentID;
    -- Display the ID of the last inserted appointment.
    SELECT LAST_INSERT_ID() AS 'new_id';

END//

DELIMITER ;

-- #########################
-- UPDATE Appointment
-- #########################
DROP PROCEDURE IF EXISTS sp_UpdateAppointment;

DELIMITER //

CREATE PROCEDURE sp_UpdateAppointment (
    IN p_appointmentID INT,
    IN p_apptDateTime DATETIME,
    IN p_apptStatus VARCHAR(50),
    IN p_typeID VARCHAR(10),
    IN p_patientID INT,
    IN p_providerID INT,
    IN p_clinicID INT
)
BEGIN
    UPDATE Appointments
    SET apptDateTime = p_apptDateTime, apptStatus = p_apptStatus, typeID = p_typeID, patientID = p_patientID, providerID = p_providerID, clinicID = p_clinicID
    WHERE appointmentID = p_appointmentID;
END//

DELIMITER ;

-- #########################
-- DELETE Appointment
-- #########################
DROP PROCEDURE IF EXISTS sp_DeleteAppointment;

DELIMITER //

CREATE PROCEDURE sp_DeleteAppointment (IN p_appointmentID INT)
BEGIN
    DECLARE appt_status VARCHAR(50);
    DECLARE error_message VARCHAR(255);

    -- error handling
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Roll back the transaction on any error
        ROLLBACK;
        -- Propogate the custom error message to the caller
        RESIGNAL;
    END;
    START TRANSACTION;
        -- Check the appointment status before allowing deletion.
        SELECT apptStatus INTO appt_status FROM Appointments WHERE appointmentID = p_appointmentID;

        -- If appointment status is not "Voided", appointment can't be deleted from database.
        IF appt_status != 'Voided' THEN
            SET error_message = CONCAT('Only appointments with status "Voided" can be deleted.');
            -- Trigger custom error, invoke EXIT HANDLER
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
        END IF;
        
        -- Okay to delete.
        DELETE FROM Appointments WHERE appointmentID = p_appointmentID;

        IF ROW_COUNT() = 0 THEN
            -- If no rows were deleted, it means the appointment ID does not exist
            SET error_message = CONCAT('Appointment cannot be deleted because it does not exist with appointment ID: ', p_appointmentID);
            -- Trigger custom error, invoke EXIT HANDLER
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
        END IF;
    COMMIT;
END//

DELIMITER ;

-- ##########################################################################
-- ########################## ProviderLocations #############################
-- ##########################################################################

-- #########################
-- CREATE PROVIDER LOCATIONS
-- #########################
DROP PROCEDURE IF EXISTS sp_CreateProviderLocation;

DELIMITER //

CREATE PROCEDURE sp_CreateProviderLocation (
    IN p_providerID INT,
    IN p_clinicID INT
)
BEGIN
    -- Insert a new provider-to-clinic mapping row into the intersection table.
    INSERT INTO ProviderLocations (providerID, clinicID)
    VALUES (p_providerID, p_clinicID);

    -- Display the ID of the inserted provider location.
    SELECT LAST_INSERT_ID() AS 'new_id';
END //

DELIMITER ;

-- #########################
-- UPDATE PROVIDER LOCATIONS
-- #########################
DROP PROCEDURE IF EXISTS sp_UpdateProviderLocation;

DELIMITER //

CREATE PROCEDURE sp_UpdateProviderLocation (
    IN p_locationID INT,
    IN p_clinicID INT
)
BEGIN
    -- Update the clinic assignment for a specific provider-location row.
    UPDATE ProviderLocations
    SET clinicID = p_clinicID
    WHERE locationID = p_locationID;
END //

DELIMITER ;

-- #########################
-- DELETE PROVIDER LOCATIONS
-- #########################
DROP PROCEDURE IF EXISTS sp_DeleteProviderLocation;

DELIMITER //

CREATE PROCEDURE sp_DeleteProviderLocation (IN p_locationID INT)
BEGIN
    DECLARE error_message VARCHAR(255);

    -- error handling
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Roll back the transaction on any error
        ROLLBACK;
        -- Propagate the custom error message to the caller
        RESIGNAL;
    END;

    START TRANSACTION;
        -- Delete the targeted provider-location row.
        DELETE FROM ProviderLocations WHERE locationID = p_locationID;

        -- If no rows were deleted, it means the locationID does not exist.
        IF ROW_COUNT() = 0 THEN
            SET error_message = CONCAT('Provider location does not exist with locationID: ', p_locationID);
            -- Trigger custom error, invoke EXIT HANDLER
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
        END IF;
    COMMIT;
END //

DELIMITER ;

