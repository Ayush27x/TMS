const express = require("express");

// organize Routers in separate file
const router = express.Router();

const { getTickets,
     getTicketById,
      createTicket,
       updateTicketStatus
    } = require("../controllers/ticketController");

const {
    authenticateToken
} = require("../middleware/authMiddleware");


// When req. receive on "/ GET". Then call getTickets function 

// GET = existing data read/fetch
// for all tickets
router.get("/", authenticateToken, getTickets);

// GET = get a single ticket from URL
router.get("/:id", getTicketById);

// POST = Create/send new data
router.post("/", createTicket);

// Patch : update the specific existing data.
router.patch("/:id/status", updateTicketStatus);


router.get("/", authenticateToken, getTickets);

module.exports = router;