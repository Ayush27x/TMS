// Controller function

// Import Database
const db = require("../config/db");


// ================== getTickets =====================
// Retrieve tickets from database and send response to client

const getTickets = (req, res) => {

    // Get logged-in user's role and university id
    const { role, university_id } = req.user;


    // Get filters and pagination values from URL query
    const {
        status,
        roll_number,
        student_name,
        ticket_number,
        page,
        limit
    } = req.query;


    // STATUS VALIDATION =================

    const allowedStatuses = [
        "NEW",
        "IN_PROGRESS",
        "COMPLETED",
        "CORRECTION_REQUIRED"
    ];

    if (
        status &&
        !allowedStatuses.includes(status)
    ) {
        return res.status(400).json({
            message: "Invalid Status"
        });
    }


    // PAGE VALIDATION =================

    if (
        page &&
        (
            !Number.isInteger(Number(page)) ||
            Number(page) < 1
        )
    ) {
        return res.status(400).json({
            message: "Page must be a positive number"
        });
    }


    //  LIMIT VALIDATION =================

    if (
        limit &&
        (
            !Number.isInteger(Number(limit)) ||
            Number(limit) < 1
        )
    ) {
        return res.status(400).json({
            message: "Limit must be a positive number"
        });
    }


    //  MAX LIMIT =================

    if (
        limit &&
        Number(limit) > 100
    ) {
        return res.status(400).json({
            message: "Limit cannot be greater than 100"
        });
    }


    //  PAGINATION =================

    const currentPage = Number(page) || 1;

    const itemsPerPage = Number(limit) || 10;

    const offset =
        (currentPage - 1) * itemsPerPage;


    //  SQL SETUP =================

    let sql;

    let countSql;

    let values = [];

    let countValues = [];


    //  OPERATOR =================

    // Operator can see all tickets
    if (role === "OPERATOR") {

        sql = `
            SELECT *
            FROM tickets
            WHERE 1 = 1
        `;

        countSql = `
            SELECT COUNT(*) AS total
            FROM tickets
            WHERE 1 = 1
        `;
    }


    //  UNIVERSITY =================

    // University can see only its own tickets
    else if (role === "UNIVERSITY") {

        sql = `
            SELECT *
            FROM tickets
            WHERE university_id = ?
        `;

        values = [university_id];


        countSql = `
            SELECT COUNT(*) AS total
            FROM tickets
            WHERE university_id = ?
        `;

        countValues = [university_id];
    }


    //  UNKNOWN ROLE =================

    else {

        return res.status(403).json({
            message: "Access denied"
        });
    }


    //  STATUS FILTER =================

    if (status) {

        sql += `
            AND status = ?
        `;

        values.push(status);


        countSql += `
            AND status = ?
        `;

        countValues.push(status);
    }


    //  ROLL NUMBER FILTER =================

    if (roll_number) {

        sql += `
            AND roll_number = ?
        `;

        values.push(roll_number);


        countSql += `
            AND roll_number = ?
        `;

        countValues.push(roll_number);
    }


    //  STUDENT NAME FILTER =================

    if (student_name) {

        sql += `
            AND student_name LIKE ?
        `;

        values.push(
            `%${student_name}%`
        );


        countSql += `
            AND student_name LIKE ?
        `;

        countValues.push(
            `%${student_name}%`
        );
    }


    //  TICKET NUMBER FILTER =================

    if (ticket_number) {

        sql += `
            AND ticket_number LIKE ?
        `;

        values.push(
            `%${ticket_number}%`
        );


        countSql += `
            AND ticket_number LIKE ?
        `;

        countValues.push(
            `%${ticket_number}%`
        );
    }


    //  PAGINATION =================

    sql += `
        LIMIT ?
        OFFSET ?
    `;

    values.push(
        itemsPerPage,
        offset
    );


    //  GET TOTAL COUNT =================

    db.query(
        countSql,
        countValues,
        (err, countResult) => {

            // Count query error
            if (err) {

                console.error(
                    "Error counting tickets:",
                    err.message
                );

                return res.status(500).json({
                    message:
                        "Failed to count tickets"
                });
            }


            // Total matching tickets
            const totalTickets =
                countResult[0].total;


            // Calculate total pages
            const totalPages =
                Math.ceil(
                    totalTickets / itemsPerPage
                );


            //  GET TICKETS =================

            db.query(
                sql,
                values,
                (err, result) => {

                    // Database error
                    if (err) {

                        console.error(
                            "Error fetching tickets:",
                            err.message
                        );

                        return res.status(500).json({
                            message:
                                "Failed to fetch tickets"
                        });
                    }


                    //  SUCCESS =================

                    return res.json({

                        tickets: result,

                        pagination: {

                            currentPage:
                                currentPage,

                            limit:
                                itemsPerPage,

                            totalTickets:
                                totalTickets,

                            totalPages:
                                totalPages
                        }
                    });
                }
            );
        }
    );
};


//============== GET TICKET STATE =============
// Get ticket statistics for dashboard
//.............................................

const getTicketState = (req, res) => {

    const {role, university_id} = req.user;


    // Operator========
    // Operator can see statistic of all tickets
    if (role === "OPERATOR") {

        const sql = `
            SELECT 
                COUNT(*) AS total,
                SUM(status = 'NEW') AS NEW,
                SUM(status = 'IN_PROGRESS') AS IN_PROGRESS,
                SUM(status = 'COMPLETED') AS COMPLETED,
                SUM(status = 'CORRECTION_REQUIRED') AS CORRECTION_REQUIRED
            FROM tickets
            `;

            db.query(
                sql,
                (err, result) => {

                    if(err) {
                    console.error("Error fetching statistic : ",
                        err.message
                    );

                    return res.status(500).json({
                        message : "failed to fetching statistic"
                    });
                }

                //Success
                return res.json(result[0]);
            }
        );

        return;
    }

    // UNIVERSITY========
    if(role === "UNIVERSITY") {

        const sql = `
            SELECT 
                COUNT(*) AS TOTAL,
                SUM(status = 'NEW') AS NEW,
                SUM(status = 'IN_PROGRESS') AS PROGRESS,
                SUM(status = 'COMPLETED') AS COMPLETED,
                SUM(status = 'CORRECTION_REQUIRED') AS CORRECTION_REQUIRED
            FROM tickets
            WHERE university_Id = ?
            `;

            db.query(
                sql,
                [university_id],
                (err, result) => {

                    if(err) {

                        console.error("Error fetching ticket statistics",
                             err.message);

                             return res.status(500).json({
                                message : "Failed to fetch ticket statistics"
                        });
                    }

                    // Success
                    return res.json(result[0]);
                }
            );
            return;
    }

    // Unknown Role=======
    return res.status(403).json({
        message : "Access denied"
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
                sql = `
                SELECT * FROM tickets 
                WHERE id = ?`;

                values = [id];
            }

                else if (role === "UNIVERSITY") {

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


// ===============GET TICKET HISTORY=====================
// Get history of a ticket
const getTicketHistory = (req, res) => {

    // Get ticket ID from URL
    const {id} = req.params;

    //Get Logged-in User's role and university id
    const {role, university_id } = req.user;


    // Check ticket status ========
    let ticketSql;
    let ticketValues;

    // Operator can access and tickets
    if (role === "OPERATOR") {

        ticketSql = `
            SELECT * FROM tickets
            WHERE id = ?`;

            ticketValues = [id]
    }

    // University can only access own tickets
    else if (role === "UNIVERSITY") {

        ticketSql = `
            SELECT * FROM tickets
            WHERE id = ?
            AND
            university_id = ?`;

            ticketValues = [id, university_id];
    }

    // Unknown role
    else {
        return res.status(403).json({
            message : "access denied"
        });
    }

    // Check ticket ========
    db.query(
        ticketSql,
        ticketValues,
        (err, result) => {

            if(err) {
                console.error("Error checking ticket : ", err.message);

                return res.status(500).json({
                    message : "Access dined"
                });
            }

            // Ticket not fount
            if(result.length === 0) {

                res.status(404).json({
                    message : "Ticket not found"
                });
            }

            // Get history
            const historySql = `
                    SELECT
                        th.id,
                        th.ticket_id,
                        th.action,
                        th.old_status,
                        th.new_status,
                        th.created_at,
                        u.username AS changed_by
                        FROM ticket_history th
                        JOIN users u
                            ON th.user_id = u.id
                        WHERE th.ticket_id = ?
                        ORDER BY th.created_at ASC
                        `;

                        db.query(
                            historySql,
                            [id],
                            (err, historyResult) => {

                                if(err) {
                                    console.error("Error fetching ticket history :", err.message);

                                    return res.status(500).json({
                                        message: "Failed to fetch ticket"
                                    });
                                }

                                // Success
                                return res.json({
                                    ticket_id : id,
                                    history : historyResult
                    });
                }
            );
        }
    );  
};


// =============== createTicket =====================
// Create a new ticket

const createTicket = (req, res) => {

    //  GET DATA FROM REQUEST =================

    const {
        form_number,
        student_name,
        roll_number,
        correction_type,
        correction_details
    } = req.body;


    // Get university ID from logged-in user
    const { university_id } = req.user;


    //  REQUIRED FIELD VALIDATION =================

    if (
        !form_number ||
        !student_name ||
        !roll_number ||
        !correction_type ||
        !correction_details
    ) {

        return res.status(400).json({
            message: "All fields are required"
        });
    }


    //  CURRENT YEAR =================

    const currentYear =
        new Date().getFullYear();


    //  START TRANSACTION =================

    db.beginTransaction((err) => {

        if (err) {

            console.error(
                "Transaction failed:",
                err.message
            );

            return res.status(500).json({
                message:
                    "Failed to start transaction"
            });
        }


        //  CHECK DUPLICATE =================

        const duplicateSql = `
            SELECT
                id,
                ticket_number,
                status
            FROM tickets
            WHERE university_id = ?
            AND form_number = ?
            AND correction_type = ?
            AND status IN (
                'NEW',
                'IN_PROGRESS',
                'CORRECTION_REQUIRED'
            )
            LIMIT 1
        `;


        db.query(
            duplicateSql,
            [
                university_id,
                form_number,
                correction_type
            ],
            (err, duplicateResult) => {

                // Duplicate check database error
                if (err) {

                    return db.rollback(() => {

                        console.error(
                            "Error checking duplicate ticket:",
                            err.message
                        );

                        return res.status(500).json({
                            message:
                                "Failed to check duplicate ticket"
                        });
                    });
                }


                //  DUPLICATE FOUND =================

                if (duplicateResult.length > 0) {

                    const existingTicket =
                        duplicateResult[0];

                    return db.rollback(() => {

                        return res.status(409).json({

                            message:
                                "An active ticket already exists for this correction",

                            ticket_number:
                                existingTicket.ticket_number,

                            status:
                                existingTicket.status
                        });
                    });
                }


                //  TEMPORARY TICKET NUMBER =================

                const temporaryTicketNumber =
                    `TEMP-${Date.now()}`;


                //  INSERT TICKET =================

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
                                    message:
                                        "Failed to create ticket"
                                });
                            });
                        }


                        //  GET TICKET ID =================

                        const ticketId =
                            result.insertId;


                        //  GENERATE FINAL TICKET NUMBER =================

                        const ticketNumber =
                            `MGSU-${currentYear}-${String(ticketId).padStart(4, "0")}`;


                        //  UPDATE TICKET NUMBER =================

                        const updateSql = `
                            UPDATE tickets
                            SET ticket_number = ?
                            WHERE id = ?
                        `;


                        db.query(
                            updateSql,
                            [
                                ticketNumber,
                                ticketId
                            ],
                            (err) => {

                                // UPDATE error
                                if (err) {

                                    return db.rollback(() => {

                                        console.error(
                                            "Error updating ticket number:",
                                            err.message
                                        );

                                        return res.status(500).json({
                                            message:
                                                "Failed to generate ticket number"
                                        });
                                    });
                                }


                                //  COMMIT TRANSACTION =================

                                db.commit((err) => {

                                    // COMMIT error
                                    if (err) {

                                        return db.rollback(() => {

                                            console.error(
                                                "Transaction commit failed:",
                                                err.message
                                            );

                                            return res.status(500).json({
                                                message:
                                                    "Failed to create ticket"
                                            });
                                        });
                                    }


                                    //  SUCCESS =================

                                    return res.status(201).json({

                                        message:
                                            "Ticket created successfully",

                                        ticketId:
                                            ticketId,

                                        ticket_number:
                                            ticketNumber
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


// =============== updateTicketStatus =====================
// Update ticket status and remarks
// Only OPERATOR can access this api
//..........................................................

const updateTicketStatus = (req, res) => {

    // Get ticket ID from URL
    const { id } = req.params;

    // Get new status from request body
    const { status,
            remark
     } = req.body;


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


    // REMARKS VALIDATION
    if (status === "CORRECTION_REQUIRED" && !remark) {

        return res.status(400).json({
            message : "Remark is required for correction"
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
            SELECT 
            status,
            remark
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

                // Store current/old remark
                const oldRemark = result[0].remark;


                // ================= UPDATE STATUS =================

                const updateSql = `
                    UPDATE tickets
                    SET 
                    status = ?,
                    remark = ?
                    WHERE id = ?
                `;


                db.query(
                    updateSql,
                    [
                        status,
                        remark || null,
                         id
                    ],
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
                                            status,

                                        remark :
                                            remark || null
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


// =============== UPLOAD TICKET ATTACHMENT =================
// .........................................................

const uploadTicketAttachment = (req, res) => {

    const { id } = req.params;
    const { role, university_id } = req.user;


    // Check whether file is uploaded
    if (!req.file) {

        return res.status(400).json({
            message: "Marksheet image is required"
        });
    }


    let ticketSql;
    let ticketValues;


    // Operator can access any ticket
    if (role === "OPERATOR") {

        ticketSql = `
            SELECT *
            FROM tickets
            WHERE id = ?
        `;

        ticketValues = [id];
    }


    // University can access only its own tickets
    else if (role === "UNIVERSITY") {

        ticketSql = `
            SELECT *
            FROM tickets
            WHERE id = ?
            AND university_id = ?
        `;

        ticketValues = [id, university_id];
    }


    else {

        return res.status(403).json({
            message: "Access denied"
        });
    }


    // Check ticket
    db.query(
        ticketSql,
        ticketValues,
        (err, result) => {

            if (err) {

                console.error(
                    "Error checking ticket:",
                    err.message
                );

                return res.status(500).json({
                    message: "Database error"
                });
            }


            // Ticket does not exist
            if (result.length === 0) {

                return res.status(404).json({
                    message: "Ticket not found"
                });
            }


            // Check if attachment already exists
            const checkSql = `
                SELECT id
                FROM ticket_attachments
                WHERE ticket_id = ?
            `;


            db.query(
                checkSql,
                [id],
                (err, attachmentResult) => {

                    if (err) {

                        console.error(
                            "Error checking attachment:",
                            err.message
                        );

                        return res.status(500).json({
                            message: "Database error"
                        });
                    }


                    // Only one marksheet allowed per ticket
                    if (attachmentResult.length > 0) {

                        return res.status(409).json({
                            message: "Marksheet already exists"
                        });
                    }


                    // Save attachment information
                    const insertSql = `
                        INSERT INTO ticket_attachments
                        (
                            ticket_id,
                            file_name,
                            file_path,
                            file_type,
                            file_size
                        )
                        VALUES (?, ?, ?, ?, ?)
                    `;


                    const insertValues = [
                        id,
                        req.file.originalname,
                        req.file.path,
                        req.file.mimetype,
                        req.file.size
                    ];


                    db.query(
                        insertSql,
                        insertValues,
                        (err, result) => {

                            if (err) {

                                console.error(
                                    "Error saving attachment:",
                                    err.message
                                );

                                return res.status(500).json({
                                    message: "Failed to save attachment"
                                });
                            }


                            // Upload successful
                            return res.status(201).json({

                                message:
                                    "Marksheet uploaded successfully",

                                attachment: {

                                    ticket_id: id,

                                    file_name:
                                        req.file.originalname,

                                    file_type:
                                        req.file.mimetype,

                                    file_size:
                                        req.file.size
                                }
                            });
                        }
                    );
                }
            );
        }
    );
};


// =============== GET TICKET ATTACHMENT =================
// .........................................................

const getTicketAttachment = (req, res) => {

    const { id } = req.params;
    const { role, university_id } = req.user;

    let ticketSql;
    let ticketValues;

    // Operator can access ant ticket
    if(role === "OPERATOR") {
        
        ticketSql = `
        SELECT * FROM
        tickets 
        WHERE 
        id = ?
        `;

        ticketValues = [id];
    }

    // University can access only own tickets
    else if (role === "UNIVERSITY") {

        ticketSql = `
            SELECT * FROM 
            tickets
            WHERE id = ?
            AND 
            university_id = ?
            `;

            ticketValues = [id, university_id];
    }

    else {

        return res.status(403).json({
            message : "Access denied"
        });

    }

    db.query(
        ticketSql,
        ticketValues,
        (err, result) => {

            if(err) {
                console.error(
                    "Error checking ticket :",
                    err.message
                );

                return res.status(500).json({
                    message : "Database Error"
                });
            }

            // Ticket not found
            if(result.length === 0) {
                return res.status(404).json({
                    message : "Ticket not found"
                });
            }

            // Get attachment
            const attachmentSql = `
                SELECT
                id,
                ticket_id,
                file_name,
                file_path,
                file_type,
                file_size,
                created_at
                FROM ticket_attachments
                WHERE ticket_id = ?`;

                db.query(
                    attachmentSql,
                    [id],
                    (err, attachmentResult) => {

                        if(err) {

                        console.error("Error fetching attachment",
                            err.message
                        );

                        return res.status(500).json({
                            message : "Database error"
                        });
                    }

                    // Attachment not found
                    if(attachmentResult.length === 0) {

                        return res.status(404).json({
                            message : "Attachment not found"
                        });
                    }

                    // Return attachment details
                    return res.json(
                        attachmentResult[0]
                    );
                }
            );
        }
    );
};


module.exports = {
    getTickets,
    getTicketState,
    getTicketById,
    getTicketHistory,
    createTicket,
    updateTicketStatus,
    uploadTicketAttachment,
    getTicketAttachment
};