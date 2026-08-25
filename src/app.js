// Import express, cors
const express = require("express");
const cors = require("cors");
const app = express();


// Import db.js, ticketRoutes.js
const db = require("./config/db");
const ticketRoutes = require("./routes/ticketRoutes");


//cors send request react to express
//middleware
app.use(cors());
app.use(express.json());


// TicketRoutes.js
app.use("/api/tickets", ticketRoutes);


// req, res = call back function
app.get("/",(req, res) =>{
    res.json({
        message : "TMS backend running"
    });
});



module.exports = app;