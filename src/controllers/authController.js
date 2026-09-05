// Import database connection and bcrypt
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// for JWT sing in server want a secret key
const JWT_SECRET = "tms_super_secret_key";

// ==================== LOGIN FUNCTION ====================

const login = async (req, res) => {

    // Extract username and password from request body
    const {
        username,
        password
    } = req.body;


    // SQL query to find the user by username
    const sql = `
        SELECT *
        FROM users
        WHERE username = ?
    `;


    // Execute the SQL query
    db.query(
        sql,
        [username],
        async (err, result) => {

            // Handle database error
            if (err) {

                console.error(
                    "Error fetching user:",
                    err.message
                );

                return res.status(500).json({
                    message: "Database error"
                });
            }


            // Check if user does not exist
            if (result.length === 0) {

                return res.status(401).json({
                    message: "Invalid username or password"
                });
            }


            // Get the user data from the database result
            const user = result[0];


            // Compare the entered password with the stored password hash
            const isPasswordCorrect = await bcrypt.compare(
                password,
                user.password 
            );


            // Check if the password is incorrect
            if (!isPasswordCorrect) {

                return res.status(401).json({
                    message: "Invalid username or password"
                });
            }


            // Create JWT token
            const token = jwt.sign(
                {
                    id : user.id,
                    username : user.username,
                    role : user.roll
                },
                JWT_SECRET,
                {
                    // Valid for 1 Day
                    expiresIn : "1d"
                }
            );


            // Send successful login response
            return res.json({

                message: "Login successful",

                token : token,

                // Send only required user information
                // Do not send the password to the client
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    university_id: user.university_id
                }
            });
        }
    );
};


// Export login function
module.exports = {
    login
};