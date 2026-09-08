// Security middleware for authentication and authorization in the TMS

//Middleware is use for receive and reject the request from client side.

const jwt = require("jsonwebtoken");

const JWT_SECRET = "tms_super_secret_key";

const authenticateToken = (req, res, next) => {

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    // Check if Authorization header exists
    if(!authHeader) {

        return res.status(401).json({
            message : "Access token required"
       });
    }

    
    // Extract token from "Bearer Token"
    const token = authHeader.split(" ")[1];

    jwt.verify(
        token,
        JWT_SECRET,
        (err, user) => {

            // Token invalid or expired
            if(err) {
                
                return res.status(403).json({
                    message : "invalid or expired token"
                });
            }

            //Store decoded user information in request
            req.user = user;

            //Continue to next middleware/controller
            next();

        });
};

module.exports = {
    authenticateToken
};