// Citation for the following code:
// Date: 4/1/2026
// Copied from CS340 Activity2 starter code.
// Source URL: https://canvas.oregonstate.edu/courses/2042369/assignments/10464646?module_item_id=26640125



// Get an instance of mysql we can use in the app
let mysql = require('mysql2')

// Creae a 'connection pool' using the provided credentials
const pool = mysql.createPool({
    waitForConnections: true,
    connectionLimit: 10,
    host: 'classmysql.engr.oregonstate.edu',
    user: 'cs340_plunkesh',
    password: 'TBc92DLG7NDK',
    database: 'cs340_plunkesh',
    // NOTE: dateStrings: true tells mysql2 to return DATE and DATETIME columns
    // as plain strings ('1972-03-26', '2026-07-15 14:30:00') instead of
    // JavaScript Date objects. This matters because when Handlebars renders a
    // Date object into a data-* attribute (e.g. data-dob), it calls .toString()
    // which produces a locale-specific string like 'Wed Mar 26 1972 00:00:00 GMT'
    // that the edit modal JS cannot reliably parse back into a date input value.
    // With dateStrings: true the value is already in the format that
    // formatValueForType() in main.hbs expects.
    dateStrings: true
}).promise(); // This makes it so we can use async/await rather than callbacks

//Export it for use in our application
module.exports = pool;