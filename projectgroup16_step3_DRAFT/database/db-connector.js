// Step 3 draft note:
// This file is intentionally a placeholder. Database wiring is completed in later steps.

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
    database: 'cs340_plunkesh'
}).promise(); // This makes it so we can use async/await rather than callbacks

//Export it for use in our application
module.exports = pool;
