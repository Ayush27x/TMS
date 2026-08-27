const express = require("express");

// organize Routers in separate file
const router = express.Router();

const { getTickets, getTicketById, createTicket  } = require("../controllers/ticketController");


// When req. receive on "/ GET". Then call getTickets function 

// GET = existing data read/fetch
// for all tickets
router.get("/", getTickets);


// GET = get a single ticket from URL
router.get("/:id", getTicketById);

// POST = Create/send new data
router.post("/", createTicket);

module.exports = router;