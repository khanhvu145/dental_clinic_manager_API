const models = require('../models/tw_Appointment');
const Appointment = models.AppointmentModel;
const AppointmentLog = models.AppointmentLogModel;
const ServiceGroup = require('../models/tw_ServiceGroup');
const GeneralConfig = require('../models/tw_GeneralConfig');
const User = require('../models/tw_User');
const Customer = require('../models/tw_Customer');
const AppointmentConfig = require('../models/tw_AppointmentConfig');
const IsNullOrEmpty = require('../helpers/IsNullOrEmpty');
const isObjectId = require('../helpers/isObjectId');
const convertDateToCron = require('../helpers/convertDateToCron');
const moment = require('moment');
const CronJob = require('cron').CronJob;
const mongoose = require('mongoose');

const WorkingCalendarController = {
    getWorkingCalendarByDentist: async(req, res, next) => {
        try{
            var data = await Appointment.aggregate([
                { $lookup: {
                    from: "tw_customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerInfo"
                }},
                { $lookup: {
                    from: "tw_users",
                    localField: "dentistId",
                    foreignField: "_id",
                    as: "dentistInfo"
                }},
                { $lookup: {
                    from: "tw_servicegroups",
                    localField: "serviceGroupId",
                    foreignField: "_id",
                    as: "serviceGroupInfo"
                }},
                {
                    $addFields: {
                        "customerName": { $arrayElemAt: ["$customerInfo.name", 0] },
                        "customerPhone": { $arrayElemAt: ["$customerInfo.phone", 0] },
                        "customerBirthday": { $arrayElemAt: ["$customerInfo.birthday", 0] },
                        "customerPhysicalId": { $arrayElemAt: ["$customerInfo.physicalId", 0] },
                        "customerCode": { $arrayElemAt: ["$customerInfo.code", 0] },
                        "customerGender": { $arrayElemAt: ["$customerInfo.gender", 0] },
                        "customerDateOfIssue": { $arrayElemAt: ["$customerInfo.dateOfIssue", 0] },
                        "customerPlaceOfIssue": { $arrayElemAt: ["$customerInfo.placeOfIssue", 0] },
                        "customerEmail": { $arrayElemAt: ["$customerInfo.email", 0] },
                        "customerAddress": { $arrayElemAt: ["$customerInfo.address", 0] },
                        "customerImg": { $arrayElemAt: ["$customerInfo.img", 0] },
                        "customerImageFile": { $arrayElemAt: ["$customerInfo.imageFile", 0] },
                        "customerGroup": { $arrayElemAt: ["$customerInfo.customerGroup", 0] },
                        "customerSource": { $arrayElemAt: ["$customerInfo.source", 0] },
                        "dentistName": { $arrayElemAt: ["$dentistInfo.name", 0] },
                        "dentistPhone": { $arrayElemAt: ["$dentistInfo.phone", 0] },
                        "dentistBirthday": { $arrayElemAt: ["$dentistInfo.birthday", 0] },
                        "dentistPhysicalId": { $arrayElemAt: ["$dentistInfo.physicalId", 0] },
                        "dentistCode": { $arrayElemAt: ["$dentistInfo.code", 0] },
                        "dentistGender": { $arrayElemAt: ["$dentistInfo.gender", 0] },
                        "serviceGroupName": { $arrayElemAt: ["$serviceGroupInfo.name", 0] }
                    }
                },
                { $project: { 
                    customerInfo: 0,
                    dentistInfo: 0,
                    serviceGroupInfo: 0
                }},
                { $match: { dentistId: mongoose.Types.ObjectId(req.body.dentistId) } }
            ]);

            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    }
};

module.exports = WorkingCalendarController;