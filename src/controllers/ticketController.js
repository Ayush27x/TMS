// Controller function

// Import Database
const db = require("../config/db");



// =============== getTicket =====================
// retrieve tickets from database and send Response to client
const getTickets = (req, res) => {

    //sql query for tickets only
    const sql = "SELECT * FROM tickets";

    db.query(sql, (err, result) => {

        // Error Section
        if(err) {
         console.error("Error fetching tickets: ", err.message);

        // Return into browser
        return res.status(500).json({
            message : "Failed to fetch tickets"
        });

        }
            //Result Section
            res.json(result);
    });
};



// =============== CreateTicket =====================
const createTicket = (req, res) => {


    // 1st receive Information from Customer
    const {
        university_id,
        form_number,
        student_name,
        roll_number,
        correction_type,
        correction_details
    } = req.body;


    // 2nd Write sql query for inset tickets information
    const sql = `
        INSERT INTO tickets (
        university_id,
        form_number,
        student_name,
        roll_number,
        correction_type,
        correction_details  ) 

        VALUE (?,?,?,?,?,?)`;
}

// bind actual values for ?(placeholder)
db.query(sql,
    [
        university_id,
        form_number,
        student_name,
        roll_number,
        correction_type,
        correction_details
    ],

    (err,result) => {

            // This error function for console error
            if(err) {
                console.error("Error Creating Ticket", err.message)
            
                
                return res.status(500).json({
                    message : "failed to Create ticket"
                });
            }
            
            // successful message for browser
            res.status(201).json({
                message : "Ticket Created successfully",
                ticket_id: result.insertId
            })
    }
)







module.exports = {
     getTickets
};