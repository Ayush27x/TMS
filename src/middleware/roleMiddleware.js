const authorizeRole = (allowedRole) => {

    return(req, res, next) => {

        //Check user Role
        if(req.user.role !== allowedRole) {

            console.log("USER ROLE:", req.user.role);
            console.log("REQUIRED ROLE:", allowedRole);
            return res.status(403).json({
                message : "access denied"
                
            });
        }

        //User has required role
        next();
    };
};

module.exports = {
    authorizeRole
}