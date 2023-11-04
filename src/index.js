const express = require('express');
const cors = require('cors');
const app = express();
const httpServer = require('http').createServer(app);
const createSocketIO = require('./configs/socket')
const mongoose = require('mongoose');
var bodyParser = require('body-parser');
const morgan = require('morgan');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const accountRoute = require('./routes/account');
const accessgroupRoute = require('./routes/accessgroup');
const userRoute = require('./routes/user');
const customerRoute = require('./routes/customer');
const generalconfigRoute = require('./routes/generalconfig');
const serviceRoute = require('./routes/service');
// const appointmentRoute = require('./routes/appointment');
const appointmentConfigRoute = require('./routes/appointmentConfig');
const smtpConfigRoute = require('./routes/smtpconfig');
const workingCalendarRoute = require('./routes/workingCalendar');
const paymentRoute = require('./routes/payment');
const paymentSlipRoute = require('./routes/paymentSlip');
const receiptsRoute = require('./routes/receipts');
const reportRoute = require('./routes/report');
const informationConfigRoute = require('./routes/informationConfig');
const appointmentBookingRoute = require('./routes/appointmentBooking');
const prescriptionConfigRoute = require('./routes/prescriptionConfig');
const schedule = require('node-schedule');
const axios = require('axios');
const swaggerDocs = require('../swagger.js');

process.env.TZ = 'Asia/Bangkok';

//CONNECT DATABASE
dotenv.config();
mongoose.connect((process.env.MONGODB_URL), () => {
    console.log('Connecting to MongoDB...');
})

app.use(bodyParser.json({
    limit: "50mb"
}));
app.use(cors());
app.use(morgan("common"));

//ROUTES
app.use('/api/account', accountRoute);
app.use('/api/accessgroup', accessgroupRoute);
app.use('/api/user', userRoute);
app.use('/api/customer', customerRoute);
app.use('/api/generalconfig', generalconfigRoute);
app.use('/api/service', serviceRoute);
// app.use('/api/appointment', appointmentRoute);
app.use('/api/appointmentConfig', appointmentConfigRoute);
app.use('/api/smtpConfig', smtpConfigRoute);
app.use('/api/workingCalendar', workingCalendarRoute);
app.use('/api/payment', paymentRoute);
app.use('/api/paymentSlip', paymentSlipRoute);
app.use('/api/receipts', receiptsRoute);
app.use('/api/report', reportRoute);
app.use('/api/informationConfig', informationConfigRoute);
app.use('/api/appointmentBooking', appointmentBookingRoute);
app.use('/api/prescriptionConfig', prescriptionConfigRoute);

app.get("/", (req, res) => {
    // res.json({ message: "THIS IS API FOR DENTAL CLINIC MANAGER WEB" });
    res.redirect('/docs');
});

//LISTEN PORT
httpServer.listen(process.env.PORT || 8000, () => {
    const port = process.env.PORT || 8000;
    console.log(`Server Started at ${port}`)
    swaggerDocs(app, port)
})
/////
const socketio = createSocketIO(httpServer);
app.set('socketio', socketio);

// Job lịch hẹn
const job = schedule.scheduleJob('0 0 * * *', async function(){
    console.log('Start job updateStatusToNoArrivedJob')
    const BACKEND_API_URL = process.env.BACKEND_API_URL;
    await axios.post(`${BACKEND_API_URL}/api/appointmentBooking/updateStatusToNoArrivedJob`);
});