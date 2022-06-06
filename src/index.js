const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
var bodyParser = require('body-parser');
const morgan = require('morgan');
const dotenv = require('dotenv');
const employeeRoute = require('./routes/employee');

//CONNECT DATABASE
dotenv.config();
mongoose.connect((process.env.MONGODB_URL), () => {
    console.log('Connecting to MongoDB...');
})

/////
app.use(bodyParser.json({
    limit: "50mb"
}));
app.use(cors());
app.use(morgan("common"));

//ROUTES
app.use('/api/employee', employeeRoute);

//LISTEN PORT
app.listen(8000, () => {
    console.log(`Server Started at ${8000}`)
})