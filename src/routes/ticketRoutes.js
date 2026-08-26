const express = require("express");

// organize Routers in separate file
const router = express.Router();

const { getTickets, createTicket } = require("../controllers/ticketController");


// When req. receive on "/ GET". Then call getTickets function 

// GET = existing data read/fetch
router.get("/", getTickets);


// POST = Create/send new data
router.post("/", createTicket);

module.exports = router;