// Controller function

// Import Database
const db = require("../config/db");



// =============== getTickets =====================
// Retrieve tickets from database and send response to client

const getTickets = (req, res) => {

    // SQL query for retrieving tickets
    const sql = "SELECT * FROM tickets";

    db.query(sql, (err, result) => {

        // Error Section
        if (err) {

            console.error(
                "Error fetching tickets:",
                err.message
            );

            return res.status(500).json({
                message: "Failed to fetch tickets"
            });
        }

        // Result Section
        res.json(result);
    });
};



// =============== createTicket =====================

const createTicket = (req, res) => {

    // Get information from client
    const {
        university_id,
        form_number,
        student_name,
        roll_number,
        correction_type,
        correction_details
    } = req.body;


    // Get current year
    const currentYear = new Date().getFullYear();


    // Temporary ticket number
    const temporaryTicketNumber = `TEMP-${Date.now()}`;


    // Start transaction
    db.beginTransaction((err) => {

        if (err) {

            console.error(
                "Transaction failed:",
                err.message
            );

            return res.status(500).json({
                message: "Failed to start transaction"
            });
        }


        // SQL query for inserting ticket
        const sql = `
            INSERT INTO tickets (
                university_id,
                ticket_number,
                form_number,
                student_name,
                roll_number,
                correction_type,
                correction_details
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;


        // Execute INSERT query
        db.query(
            sql,
            [
                university_id,
                temporaryTicketNumber,
                form_number,
                student_name,
                roll_number,
                correction_type,
                correction_details
            ],

            (err, result) => {

                // INSERT error
                if (err) {

                    return db.rollback(() => {

                        console.error(
                            "Error creating ticket:",
                            err.message
                        );

                        return res.status(500).json({
                            message: "Failed to create ticket"
                        });
                    });
                }


                // Get automatically generated ID
                const ticketId = result.insertId;


                // Generate actual ticket number
                const ticketNumber =
                    `MGSU-${currentYear}-${String(ticketId).padStart(4, "0")}`;


                // SQL query for updating ticket number
                const updateSql = `
                    UPDATE tickets
                    SET ticket_number = ?
                    WHERE id = ?
                `;


                // Execute UPDATE query
                db.query(
                    updateSql,
                    [ticketNumber, ticketId],

                    (err) => {

                        // UPDATE error
                        if (err) {

                            return db.rollback(() => {

                                console.error(
                                    "Error updating ticket number:",
                                    err.message
                                );

                                return res.status(500).json({
                                    message: "Failed to generate ticket number"
                                });
                            });
                        }


                        // Commit transaction
                        // if UPDATE and and INSERT query run successfully then always save the changes inside the transaction
                        db.commit((err) => {

                            // COMMIT error
                            if (err) {

                                return db.rollback(() => {

                                    console.error(
                                        "Transaction commit failed:",
                                        err.message
                                    );

                                    return res.status(500).json({
                                        message: "Failed to create ticket"
                                    });
                                });
                            }


                            // Success response
                            return res.status(201).json({
                                message: "Ticket created successfully",
                                ticketId: ticketId,
                                ticket_number: ticketNumber
                            });
                        });
                    }
                );
            }
        );
    });
};



module.exports = {
    getTickets,
    createTicket
};



// {
//     "university_id": 1,
//     "form_number": "272728",
//     "student_name": "Aman Gupta",
//     "roll_number": "123456",
//     "correction_type": "Marks Correction",
//     "correction_details": "Mathematics marks are incorrect"
// }