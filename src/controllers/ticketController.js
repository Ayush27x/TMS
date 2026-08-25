// Controller function

// Import Database
const db = require("../config/db");


// retrieve tickets from database and send Response to client
const getTickets = (req, res) => {

    const sql = "SELECT * FROM tickets";

    db.query(sql, (err, result) => {
        if(err) {
         console.error("Error fetching tickets: ", err.message);

        return res.status(500).json({
            message : "Failed to fetch tickets"
        });

        }
            res.json(result);
    });
};

module.exports = {
     getTickets
};