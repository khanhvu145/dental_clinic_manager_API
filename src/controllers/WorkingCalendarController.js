const models = require('../models/tw_Appointment_Booking');
const Appointment = models.AppointmentModel;
const AppointmentLog = models.AppointmentLogModel;
const mongoose = require('mongoose');

const WorkingCalendarController = {
    getWorkingCalendar: async(req, res) => {
        try{
            var filters = req.body;
            var data = await Appointment.aggregate([
                { $lookup: {
                    from: "tw_users",
                    localField: "dentistId",
                    foreignField: "_id",
                    as: "dentistInfo"
                }},
                {
                    $addFields: {
                        "dentistName": { $arrayElemAt: ["$dentistInfo.name", 0] },
                        "dentistUsername": { $arrayElemAt: ["$dentistInfo.username", 0] },
                        "dentistPhone": { $arrayElemAt: ["$dentistInfo.phone", 0] },
                        "dentistCode": { $arrayElemAt: ["$dentistInfo.code", 0] }
                    }
                },
                { $project: { 
                    dentistInfo: 0
                }},
                { $match: { 
                    $and: [
                        { dentistUsername: req.username },
                        filters.dateF ? { 
                            dateTimeFrom: { $gte: new Date(new Date(`${filters.dateF}`).setHours(0,0,0,0)) }
                        } : {},
                        filters.dateF ? { 
                            dateTimeFrom: { $lte: new Date(new Date(`${filters.dateF}`).setHours(23,59,0,0)) }
                        } : {},
                        (filters.statusF.length > 0 && filters.statusF != null) ? { 
                            status: { $in: filters.statusF }
                        } : {}
                    ]
                }}
            ]);

            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getById: async(req, res) => {
        try{
            var data = await Appointment.aggregate([
                { $lookup: {
                    from: "tw_users",
                    localField: "dentistId",
                    foreignField: "_id",
                    as: "dentistInfo"
                }},
                {
                    $addFields: {
                        "dentistName": { $arrayElemAt: ["$dentistInfo.name", 0] },
                        "dentistPhone": { $arrayElemAt: ["$dentistInfo.phone", 0] },
                        "dentistCode": { $arrayElemAt: ["$dentistInfo.code", 0] },
                    }
                },
                { $project: { 
                    dentistInfo: 0
                }},
                { $match: { _id: mongoose.Types.ObjectId(req.body.id) } }
            ]);
            return res.status(200).json({ success: true, data: data && data.length > 0 ? data[0] : new Appointment() });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    }
};

module.exports = WorkingCalendarController;