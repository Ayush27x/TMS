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
        document_type,
        ticket_number,
        page,
        limit
    } = req.query;


    // STATUS VALIDATION =================

    const allowedStatuses = [
        "NEW",
        "IN_PROGRESS",
        "COMPLETED",
        "CORRECTION_REQUIRED",
        "REOPENED"
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
    } else {

        sql += `
            AND status != 'COMPLETED'`;
    }

    countSql += `
        AND status != 'COMPLETED'
        `;


    // DOCUMENT TYPE=============== 


    if (document_type) {

    sql += `
        AND document_type LIKE ?
    `;

    values.push(`%${document_type}%`);

    countSql += `
        AND document_type LIKE ?
    `;

    countValues.push(`%${document_type}%`);
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

    console.log("COUNT SQL:", countSql);
console.log("COUNT VALUES:", countValues);


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
                COUNT(*) AS TOTAL,
                SUM(status = 'NEW') AS NEW,
                SUM(status = 'IN_PROGRESS') AS PROGRESS,
                SUM(status = 'COMPLETED') AS COMPLETED,
                SUM(status = 'CORRECTION_REQUIRED') AS CORRECTION_REQUIRED,
                SUM(status = 'REOPENED') AS REOPENED
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
                SUM(status = 'CORRECTION_REQUIRED') AS CORRECTION_REQUIRED,
                SUM(status = 'REOPENED') AS REOPENED
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
                
                const ticket = result[0];

                const correctionSql = `
                    SELECT
                        id,
                        ticket_id,
                        correction_type,
                        correction_details
                    FROM ticket_corrections
                    WHERE ticket_id = ?
                    ORDER BY id ASC
                    `;

                    db.query(
                        correctionSql,
                        [id],
                        (err, correctionResult) => {

                            if(err) {
                                console.error("Error fetching correction : ", err.message);

                                return res.status(500).json({
                                    message : "failed to fetch"
                                });
                            }

                            return res.json({
                                ...ticket,
                                corrections : correctionResult
                            });
                        }
                    );
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
                        th.remark,
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

    // GET DATA FROM REQUEST
    const {
        form_number,
        document_type,
        corrections
    } = req.body;


    // Get university ID from logged-in user
    const university_id = req.user.university_id;


    // REQUIRED FIELD VALIDATION
    if (
        !form_number ||
        ! document_type ||
        !corrections ||
        corrections.length === 0
    ) {

        return res.status(400).json({
            message: "All fields are required"
        });
    }


    // CURRENT YEAR
    const currentYear =
        new Date().getFullYear();


    // START TRANSACTION
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


        // CHECK DUPLICATE TICKET
        const duplicateSql = `
            SELECT
                id,
                ticket_number,
                status
            FROM tickets
            WHERE university_id = ?
            AND form_number = ?
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
                form_number
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


                // DUPLICATE FOUND
                if (duplicateResult.length > 0) {

                    const existingTicket =
                        duplicateResult[0];

                    return db.rollback(() => {

                        return res.status(409).json({

                            message:
                                "An active ticket already exists for this form",

                            ticket_number:
                                existingTicket.ticket_number,

                            status:
                                existingTicket.status
                        });
                    });
                }


                // TEMPORARY TICKET NUMBER(DATABASE)
                const temporaryTicketNumber =
                    `TEMP-${Date.now()}`;


                // INSERT TICKET
                const sql = `
                    INSERT INTO tickets (
                        university_id,
                        ticket_number,
                        form_number,
                        document_type
                    )
                    VALUES (?, ?, ?, ?)
                `;


                db.query(
                    sql,
                    [
                        university_id,
                        temporaryTicketNumber,
                        form_number,
                        document_type
                    ],
                    (err, result) => {

                        // INSERT ERROR
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


                        // GET TICKET ID
                        const ticketId =
                            result.insertId;


                        // TICKET CORRECTION DETAILS
                        const correctionSql = `
                            INSERT INTO ticket_corrections (
                                ticket_id,
                                correction_type,
                                correction_details
                            )
                            VALUES (?, ?, ?)
                        `;


                        // SAVE ALL CORRECTIONS
                        let completed = 0;


                        corrections.forEach((correction) => {

                            db.query(
                                correctionSql,
                                [
                                    ticketId,
                                    correction.type,
                                    correction.details
                                ],
                                (err) => {

                                    // CORRECTION INSERT ERROR
                                    if (err) {

                                        return db.rollback(() => {

                                            console.error(
                                                "Error saving correction:",
                                                err.message
                                            );

                                            return res.status(500).json({
                                                message:
                                                    "Failed to save corrections"
                                            });
                                        });
                                    }


                                    // One correction successfully saved
                                    completed++;


                                    // ALL CORRECTIONS SAVED
                                    if (
                                        completed ===
                                        corrections.length
                                    ) {

                                        // GENERATE FINAL TICKET NUMBER
                                        const ticketNumber =
                                            `MGSU-${currentYear}-${String(ticketId).padStart(4, "0")}`;


                                        // UPDATE TICKET NUMBER
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

                                                // UPDATE ERROR
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


                                                // COMMIT TRANSACTION
                                                db.commit((err) => {

                                                    // COMMIT ERROR
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


                                                    // SUCCESS
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

                                }
                            );

                        }

                    )}
                );

            }
        );

    });
};


// =============== reopenTicket =====================
//..........................................................
const reopenTicket = async (req, res) => {

    const ticketId = req.params.id;
    const university_id = req.user.university_id;
    const { remark } = req.body;

    console.log("REOPEN BODY:", req.body);

    // Remark required
    if (!remark || !remark.trim()) {
        return res.status(400).json({
            message : "Reopen remark is required"
        });
    }

    try {
        //Ticket check
        const [tickets] = await db.promise().query(
            `SELECT id, university_id, status
            FROM tickets
            WHERE id = ?`,
            [ticketId]
        );

        if(tickets.length === 0) {
            return res.status(404).json({
                message : "Ticket not found"
            });
        }

        const ticket = tickets[0];

        // University can access only own ticket
        if (ticket.university_id !== university_id) {
            return res.status(403).json({
                message : "You are not allowed to reopen this ticket"
            });
        }

        // Only completed ticket can be reopened
        if (ticket.status !== "COMPLETED") {
            return res.status(400).json({
                message : "Only completed ticket can be reopened"
            });
        }

        // Update ticket status
        await db.promise().query(
            `UPDATE tickets
            SET status = 'REOPENED',
                updated_at = NOW()
            WHERE id = ?`,
            [ticketId]
        );

        //Add history
        await db.promise().query(
            `INSERT INTO ticket_history
        (ticket_id, user_id, action, old_Status, new_status, remark)
        VALUE (?, ?, ?, ?, ?, ?)`,
        [
            ticketId,
            req.user.id,
            "REOPENED",
            "COMPLETED",
            "REOPENED",
            remark.trim()
        ]
        );

        return res.status(200).json({
            message : "Ticket open successfully"
        });
    } catch (error) {
        console.error("Reopen ticket error : ", error);

        return res.status(500).json({
            message : "Server Error"
        });
    }
};


// =============== SUBMIT CORRECTION =================

const submitCorrection = async (req, res) => {

    const ticketId = req.params.id;
    const university_id = req.user.university_id;

    try {

        // 1. Ticket check
        const [tickets] = await db.promise().query(
            `SELECT id, university_id, status
             FROM tickets
             WHERE id = ?`,
            [ticketId]
        );

        if (tickets.length === 0) {
            return res.status(404).json({
                message: "Ticket not found"
            });
        }

        const ticket = tickets[0];


        // 2. University ownership check
        if (ticket.university_id !== university_id) {
            return res.status(403).json({
                message: "You are not allowed to submit correction"
            });
        }


        // 3. Ticket must be CORRECTION_REQUIRED
        if (ticket.status !== "CORRECTION_REQUIRED") {
            return res.status(400).json({
                message: "Correction can only be submitted for correction required ticket"
            });
        }


        // 4. Change status
        await db.promise().query(
            `UPDATE tickets
             SET status = 'IN_PROGRESS',
                 updated_at = NOW()
             WHERE id = ?`,
            [ticketId]
        );


        // 5. Add history
        await db.promise().query(
            `INSERT INTO ticket_history
             (ticket_id, user_id, action, old_status, new_status, remark)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                ticketId,
                req.user.id,
                "CORRECTION_SUBMITTED",
                "CORRECTION_REQUIRED",
                "IN_PROGRESS",
                "University submitted corrected marksheet"
            ]
        );


        return res.status(200).json({
            message: "Correction submitted successfully"
        });

    } catch (error) {

        console.error(
            "Submit correction error:",
            error
        );

        return res.status(500).json({
            message: "Server Error"
        });
    }
};


// =============== UPDATE CORRECTION DETAILS ===============

const updateCorrectionDetails = async (req, res) => {

    const ticketId = req.params.id;
    const university_id = req.user.university_id;

    const {
        form_number,
        document_type,
        corrections
    } = req.body;

    try {

        // 1. Check ticket
        const [tickets] = await db.promise().query(
            `SELECT id, university_id, status
             FROM tickets
             WHERE id = ?`,
            [ticketId]
        );

        if (tickets.length === 0) {
            return res.status(404).json({
                message: "Ticket not found"
            });
        }

        const ticket = tickets[0];


        // 2. Check university ownership
        if (ticket.university_id !== university_id) {
            return res.status(403).json({
                message: "You are not allowed to edit this ticket"
            });
        }


        // 3. Only CORRECTION_REQUIRED ticket can be edited
        if (ticket.status !== "CORRECTION_REQUIRED") {
            return res.status(400).json({
                message: "Only correction required ticket can be edited"
            });
        }


        // 4. Basic validation
        if (!form_number || !form_number.trim()) {
            return res.status(400).json({
                message: "Form number is required"
            });
        }

        if (!document_type || !document_type.trim()) {
            return res.status(400).json({
                message: "Document type is required"
            });
        }

        if (!Array.isArray(corrections) || corrections.length === 0) {
            return res.status(400).json({
                message: "At least one correction is required"
            });
        }


        // 5. Start transaction
        const connection = db.promise();

        try {

            await connection.beginTransaction();


            // Update ticket details
            await connection.query(
                `UPDATE tickets
                 SET form_number = ?,
                     document_type = ?,
                     updated_at = NOW()
                 WHERE id = ?`,
                [
                    form_number.trim(),
                    document_type.trim(),
                    ticketId
                ]
            );


            // Remove old corrections
            await connection.query(
                `DELETE FROM ticket_corrections
                 WHERE ticket_id = ?`,
                [ticketId]
            );


            // Insert updated corrections
            for (const correction of corrections) {

                if (
                    !correction.correction_type ||
                    !correction.correction_details
                ) {
                    throw new Error(
                        "Invalid correction data"
                    );
                }

                await connection.query(
                    `INSERT INTO ticket_corrections
                     (
                         ticket_id,
                         correction_type,
                         correction_details
                     )
                     VALUES (?, ?, ?)`,
                    [
                        ticketId,
                        correction.correction_type.trim(),
                        correction.correction_details.trim()
                    ]
                );
            }


            // Add history
            await connection.query(
                `INSERT INTO ticket_history
                 (
                     ticket_id,
                     user_id,
                     action,
                     old_status,
                     new_status,
                     remark
                 )
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    ticketId,
                    req.user.id,
                    "CORRECTION_DETAILS_UPDATED",
                    ticket.status,
                    ticket.status,
                    "University updated correction details"
                ]
            );


            await connection.commit();


            return res.status(200).json({
                message: "Correction details updated successfully"
            });

        } catch (error) {

            await connection.rollback();

            throw error;
        }

    } catch (error) {

        console.error(
            "Update correction details error:",
            error
        );

        return res.status(500).json({
            message: "Server Error"
        });
    }
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
                                new_status,
                                remark

                            )
                            VALUES (?, ?, ?, ?, ?, ?)
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
                                status,
                                remark || null
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


// =============== UPLOAD / REPLACE TICKET ATTACHMENT =================
// ....................................................................

const fs = require("fs");

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

    // University can access only its own ticket
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

            const ticket = result[0];

            // Check existing attachment
            const checkSql = `
                SELECT *
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

                    // =================================================
                    // UNIVERSITY - REPLACE MARKSHEET
                    // =================================================

                    if (role === "UNIVERSITY") {

                        // University can replace marksheet
                        // only when correction is required
                        if (ticket.status !== "CORRECTION_REQUIRED") {

                            return res.status(400).json({
                                message:
                                    "Marksheet can only be replaced when correction is required"
                            });
                        }

                        // Attachment must already exist
                        if (attachmentResult.length === 0) {

                            return res.status(404).json({
                                message: "Existing marksheet not found"
                            });
                        }

                        const oldAttachment =
                            attachmentResult[0];

                        // Delete old physical file
                        fs.unlink(
                            oldAttachment.file_path,
                            (deleteError) => {

                                if (deleteError) {

                                    console.error(
                                        "Error deleting old file:",
                                        deleteError.message
                                    );

                                    // Continue with replacement
                                    // even if old file is already missing
                                }

                                // Update existing attachment
                                const updateSql = `
                                    UPDATE ticket_attachments
                                    SET
                                        file_name = ?,
                                        file_path = ?,
                                        file_type = ?,
                                        file_size = ?,
                                        updated_at = NOW()
                                    WHERE ticket_id = ?
                                `;

                                const updateValues = [
                                    req.file.originalname,
                                    req.file.path,
                                    "ORIGINAL",
                                    req.file.size,
                                    id
                                ];

                                db.query(
                                    updateSql,
                                    updateValues,
                                    (err) => {

                                        if (err) {

                                            console.error(
                                                "Error replacing attachment:",
                                                err.message
                                            );

                                            return res.status(500).json({
                                                message:
                                                    "Failed to replace marksheet"
                                            });
                                        }

                                        return res.status(200).json({

                                            message:
                                                "Marksheet replaced successfully",

                                            attachment: {

                                                ticket_id: id,

                                                file_name:
                                                    req.file.originalname,

                                                file_type:
                                                    "ORIGINAL",

                                                file_size:
                                                    req.file.size
                                            }
                                        });
                                    }
                                );
                            }
                        );

                        return;
                    }

                    // =================================================
                    // OPERATOR - NORMAL UPLOAD
                    // =================================================

                    // Operator cannot upload another marksheet
                    // if one already exists
                    if (attachmentResult.length > 0) {

                        return res.status(409).json({
                            message: "Marksheet already exists"
                        });
                    }

                    // Save new attachment
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
                        "ORIGINAL",
                        req.file.size
                    ];

                    db.query(
                        insertSql,
                        insertValues,
                        (err) => {

                            if (err) {

                                console.error(
                                    "Error saving attachment:",
                                    err.message
                                );

                                return res.status(500).json({
                                    message:
                                        "Failed to save attachment"
                                });
                            }

                            return res.status(201).json({

                                message:
                                    "Marksheet uploaded successfully",

                                attachment: {

                                    ticket_id: id,

                                    file_name:
                                        req.file.originalname,

                                    file_type:
                                        "ORIGINAL",

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
                updated_at
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
    reopenTicket,
    updateTicketStatus,
    uploadTicketAttachment,
    getTicketAttachment,
    submitCorrection,
    updateCorrectionDetails
};