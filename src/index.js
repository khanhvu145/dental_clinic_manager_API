const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
var bodyParser = require('body-parser');
const morgan = require('morgan');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const accountRoute = require('./routes/account');
const accessgroupRoute = require('./routes/accessgroup');
const userRoute = require('./routes/user');

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
app.use('/api/account', accountRoute);
app.use('/api/accessgroup', accessgroupRoute);
app.use('/api/user', userRoute);

//LISTEN PORT
app.listen(process.env.PORT || 8000, () => {
    const port = process.env.PORT || 8000;
    console.log(`Server Started at ${port}`)
})