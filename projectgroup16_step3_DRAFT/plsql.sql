/*
Citation for this file:
Date: 05/24/2026
Adapted from: 
Source: CS340 Exploration - Implementing CUD operations in your app
Source URL: https://canvas.oregonstate.edu/courses/2042369/pages/exploration-implementing-cud-operations-in-your-app?module_item_id=26640205
*/

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