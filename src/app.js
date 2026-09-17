// Import express, cors
const express = require("express");
const cors = require("cors"); //cross-origin requests allow
const app = express(); // Create application(app) object
const path = require("path");

// Import db.js, ticketRoutes.js, authRoutes.js
const ticketRoutes = require("./routes/ticketRoutes");
const authRoutes = require("./routes/authRoutes");


//cors send request react to express
//middleware
//app.use => register in express application
app.use(cors());
app.use(express.json());
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);


 // TicketRoutes.js
// to register/mount middleware or router with the application
app.use("/api/tickets",
     ticketRoutes);


// Login API
app.use("/api/auth",
    authRoutes);


// req, res = call back function
app.get("/",
    (req, res) =>{
    res.json({
        message : "TMS backend running"
    });
});


// exporting app.js to server.js
module.exports = app;