const multer = require("multer");


// Upload file in disk/server folder
const storage = multer.diskStorage({ //diskStorage means upload file on disk
    
    destination : (req, file, cd) => {
        cd(null, "uploads/");
    },

    filename: (req, file, cd) => {

        // Upload file on server with uniqueName + originalname
        const uniqueName = 
            Date.now() + "-" + file.originalname;

            //no error save file with unique name
            cd(null, uniqueName);
    }
});

const fileFilter = (req, file, cd) => {
    
    allowedTypes = [
        "image/jpeg",
        "image/png"
    ];

    if(allowedTypes.include(file.mimetype)) { 
        cd(null, true);
    }
    else {
        cd(new Error("Only JPEG and PNG are allowed"), false);
    }
};

const upload = multer({

    storage : storage,
    fileFilter : fileFilter,
    limits : {
        fileSize : 5 * 1024 * 1024
    }
});

module.exports = upload;