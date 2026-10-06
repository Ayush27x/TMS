    const express = require("express");

    // Create Express Router
    const router = express.Router();

    // Import Ticket Controllers
    const {
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
    } = require("../controllers/ticketController");

    // Import Authentication Middleware
    const {
        authenticateToken
    } = require("../middleware/authMiddleware");

    // Import Role Authorization Middleware
    const {
        authorizeRole
    } = require("../middleware/roleMiddleware");

    // Import Multer Upload Middleware
    const upload = require("../middleware/uploadMiddleware");


    // ================= GET ALL TICKETS =================
    // Fetch all tickets (Role-based + Filters + Pagination)
    router.get(
        "/",
        authenticateToken,
        getTickets
    );

    // ================= GET ALL STATE =================
    // Fetch ticket statistics  for dashboard
    router.get(
        "/stats",
        authenticateToken,
        getTicketState
    );


    // ================= UPDATE CORRECTION REQUIRED  =================
    router.put(
    "/:id/correction",
    authenticateToken,
    authorizeRole("UNIVERSITY"),
    updateCorrectionDetails
);

    // ================= CORRECTION REQUIRED  =================
    router.post(
    "/:id/submit-correction",
    authenticateToken,
    authorizeRole("UNIVERSITY"),
    submitCorrection
);

    // ================= GET TICKET HISTORY =================
    router.get(
        "/:id/history",
        authenticateToken,
        getTicketHistory
    );

    // ================= GET SINGLE TICKET =================
    // Fetch one ticket using Ticket ID
    router.get(
        "/:id",
        authenticateToken,
        getTicketById
    );


    // ================= CREATE TICKET =================
    // Create a new ticket
    router.post(
        "/",
        authenticateToken,
        createTicket
    );


    // ================= REOPENED TICKET =================
    router.post(
        "/:id/reopen",
        authenticateToken,
        authorizeRole("UNIVERSITY"),
        reopenTicket
    )


    // ================= UPDATE TICKET STATUS =================
    // Only Operator can update ticket status
    router.patch(
        "/:id/status",
        authenticateToken,
        authorizeRole("OPERATOR"),
        updateTicketStatus
    );


    // ================= UPLOAD MARK SHEET =================
    // Upload one mark sheet image for a ticket
    router.post(
    "/:id/attachment",
    authenticateToken,
    (req, res, next) => {

        upload.single("marksheet")(req, res, (error) => {

            if (error) {

                if (error.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({
                        message: "File size must be less than 2 MB"
                    });
                }

                return res.status(400).json({
                    message: error.message
                });
            }

            next();
        });

    },
    uploadTicketAttachment
);
    router.get(
        "/:id/attachment",
        authenticateToken,
        getTicketAttachment
    );


    // Export Router
    module.exports = router;