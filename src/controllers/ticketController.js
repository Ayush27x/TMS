// Controller function


// Import Database
const db = require("../config/db");



// =============== getTickets =====================
// Retrieve tickets from database and send response to client

const getTickets = (req, res) => {


    //Get logged-in user's Role and university id
    const {role, university_id} = req.user;


    let sql;
    let values = [];


    // Operator can see all ticket
    if (role === "OPERATOR") {

        sql = `
                SELECT *
                FROM tickets
                `;
    }


        // University can see only its own tickets
        else if (role === "UNIVERSITY") {

            sql = `
                SELECT * 
                FROM tickets
                WHERE university_id = ?
                `;

                values = [university_id];
            }

                // Unknown role
                else {
                    return res.status(403).json({
                        message : "access dined"
                    });
                }



        db.query(sql, values, (err, result) => {

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
        return res.json(result);
    });
};



// =============== getTicketsById =====================
// Retrieve one tickets from using ID

const getTicketById = (req, res) => {

        // Get ticket ID from URL
        const {id} = req.params;
        const {role, university_id} = req.user;


        let sql;
        let values = [];
        
            if (role === "OPERATOR") {

                // Sql query 
                const sql = `
                SELECT * FROM tickets 
                WHERE id = ?`;

                values = [id];
            }

                else if (role = "UNIVERSITY") {

                    sql = `
                        SELECT * FROM tickets
                        WHERE id = ?
                        AND
                        university_id = ?
                        `;

                        values = [id, university_id];
                }

                    else {
                        return res.status(403).json({
                            message : "Access denied"
                        });
                    }


                // Execute Query
                db.query(sql, values,
                    (err, result) =>{

                            // Error
                            if(err) {
                                    console.error("Error Fetching Ticket", err.message)

                                            return res.status(500).json({
                                                    message : "Failed to fetch Ticket"
                                                                        });
                                    }

                            //Ticket not Found Error
                            if(result.length === 0) {
                                            return res.status(404).json({
                                                    message : "Ticket not found"
                                                                        });
                                    }
                
                // Success
                // First item of the [0]array
                return res.json(result[0]);
            }
        );
};


// =============== createTicket =====================

const createTicket = (req, res) => {

    // Get information from client
    const {
        form_number,
        student_name,
        roll_number,
        correction_type,
        correction_details
    } = req.body;

    const { university_id } = req.user;

    if(
        ! form_number ||
        ! student_name ||
        ! roll_number ||
        ! correction_type ||
        ! correction_details
    ) 
    {
        return res.status(400).json({
            message : "All felid are required"
        });
    }


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
                        };


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



// =============== updateTicketStatus =====================
//..........................................................

const updateTicketStatus = (req, res) => {

    // Get ticket ID from URL
    const { id } = req.params;

    // Get new status from request body
    const { status } = req.body;


    // Allowed ticket statuses
    const validStatuses = [
        "NEW",
        "IN_PROGRESS",
        "COMPLETED",
        "CORRECTION_REQUIRED"
    ];


    // Check whether status is valid
    if (!validStatuses.includes(status)) {

        return res.status(400).json({
            message: "Invalid ticket status"
        });
    }


    // ================= START TRANSACTION =================

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


        // ================= GET OLD STATUS =================

        const getTicketSql = `
            SELECT status
            FROM tickets
            WHERE id = ?
        `;


        db.query(
            getTicketSql,
            [id],
            (err, result) => {

                // Database error
                if (err) {

                    return db.rollback(() => {

                        console.error(
                            "Error fetching ticket:",
                            err.message
                        );

                        return res.status(500).json({
                            message: "Failed to fetch ticket"
                        });
                    });
                }


                // Ticket does not exist
                if (result.length === 0) {

                    return db.rollback(() => {

                        return res.status(404).json({
                            message: "Ticket not found"
                        });
                    });
                }


                // Store current/old status
                const oldStatus = result[0].status;


                // ================= UPDATE STATUS =================

                const updateSql = `
                    UPDATE tickets
                    SET status = ?
                    WHERE id = ?
                `;


                db.query(
                    updateSql,
                    [status, id],
                    (err) => {

                        // Update failed
                        if (err) {

                            return db.rollback(() => {

                                console.error(
                                    "Error updating ticket:",
                                    err.message
                                );

                                return res.status(500).json({
                                    message: "Failed to update ticket status"
                                });
                            });
                        }


                        // ================= INSERT HISTORY =================

                        const historySql = `
                            INSERT INTO ticket_history (
                                ticket_id,
                                user_id,
                                action,
                                old_status,
                                new_status
                            )
                            VALUES (?, ?, ?, ?, ?)
                        `;


                        // Temporary operator ID
                        const userId = req.user.id;


                        db.query(
                            historySql,
                            [
                                id,
                                userId,
                                "STATUS_UPDATED",
                                oldStatus,
                                status
                            ],
                            (err) => {

                                // History insert failed
                                if (err) {

                                    return db.rollback(() => {

                                        console.error(
                                            "Error creating ticket history:",
                                            err.message
                                        );

                                        return res.status(500).json({
                                            message: "Failed to create ticket history"
                                        });
                                    });
                                }


                                // ================= COMMIT =================

                                db.commit((err) => {

                                    if (err) {

                                        return db.rollback(() => {

                                            console.error(
                                                "Transaction commit failed:",
                                                err.message
                                            );

                                            return res.status(500).json({
                                                message: "Failed to complete transaction"
                                            });
                                        });
                                    }


                                    // ================= SUCCESS =================

                                    return res.status(200).json({

                                        message:
                                            "Ticket status updated successfully",

                                        ticket_id: id,

                                        old_status:
                                            oldStatus,

                                        new_status:
                                            status
                                    });

                                });

                            }
                        );

                    }
                );

            }
        );

    });
};


module.exports = {
    getTickets,
    getTicketById,
    createTicket,
    updateTicketStatus
};

