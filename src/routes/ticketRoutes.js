const express = require("express");

// organize Routers in separate file
const router = express.Router();

const { getTickets } = require("../controllers/ticketController");


// When req. receive on "/ GET". Then call getTickets function 
router.get("/", getTickets);

module.exports = router;