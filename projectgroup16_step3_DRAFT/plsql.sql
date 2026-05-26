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
----------------------------------------------------------------------------------------

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

DELIMITER;

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

DELIMITER;

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

DELIMITER;

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

DELIMITER;

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

DELIMITER;

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

DELIMITER;

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

DELIMITER;

-- #########################
-- UPDATE CLINIC
-- #########################
DROP PROCEDURE IF EXISTS sp_UpdateClinic

DELIMITER //

CREATE PROCEDURE sp_UpdateClinic (
    IN p_clinicID INT,
    IN p_city VARCHAR(50)
)

BEGIN
    UPDATE Clinics SET city = p_city WHERE clinicID = p_clinicID;
    
END //

DELIMITER;

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

DELIMITER;