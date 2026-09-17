// Node.js => Express => Port 500
const app = require('./src/app.js');
const port = 5200;

app.listen(port, () => {

    console.log(`TMS server running on port ${port} 🐎`);

});