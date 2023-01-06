const Appointment = require('../models/tw_Appointment');
const moment = require('moment');
const CronJob = require('cron').CronJob;
const mongoose = require('mongoose');

const AppointmentController = {
    booking: async(req, res) => {
        try{
            var formData = req.body;
            /** Kiểm tra điều kiện đầu vào */
            //Các trường bắt buột
            if(formData.customerId == null || formData.customerId == '') {
                return res.status(200).json({ success: false, error: "Hãy chọn khách hàng" });
            }
            if(formData.dentistId == null || formData.dentistId == '') {
                return res.status(200).json({ success: false, error: "Hãy chọn nha sĩ phụ trách" });
            }
            if(formData.serviceGroupId == null || formData.serviceGroupId == '') {
                return res.status(200).json({ success: false, error: "Hãy chọn dịch vụ" });
            }
            if((formData.date == null || formData.date == '') || (formData.time == null || formData.time == '') || (formData.duration == null || formData.duration == '')) {
                return res.status(200).json({ success: false, error: "Hãy chọn thời gian hẹn" });
            }
            //Kiểm tra thời gian book
            var checkCanBook = await Appointment.checkCanBook(formData);
            if(checkCanBook < 1){
                if(checkCanBook == -1){
                    return res.status(200).json({ success: false, error: "Thời gian đặt hẹn không hợp lệ" });
                }
                else if(checkCanBook == -2){
                    return res.status(200).json({ success: false, error: "Khoảng thời gian không hợp lệ" });
                }
                else if(checkCanBook == -3){
                    return res.status(200).json({ success: false, error: "Thời gian đặt hẹn bị trùng" });
                }
                else{
                    return res.status(200).json({ success: false, error: "Có lỗi xảy ra trong quá trình đặt lịch hẹn" });
                }
            }

            /** Xử lý */
            // var expireTime = moment(formData.timeTo).add(1, 'm')._d;
            const newAppointment = await new Appointment({
                dentistId: formData.dentistId ? formData.dentistId : '', 
                customerId: formData.customerId ? formData.customerId : '', 
                serviceGroupId: formData.serviceGroupId ? formData.serviceGroupId : '',
                date: formData.date ? formData.date : null,
                time: formData.time ? formData.time : '',
                duration: formData.duration ? parseFloat(formData.duration) : parseFloat(0),
                durationType: formData.durationType ? formData.durationType : 'minutes',
                type: formData.type ? formData.type : '635dedbba3976c621f4c1d8f',
                status: 'Booked',
                note: formData.note ? formData.note : '', 
                isActive: formData.isActive ? formData.isActive : true,
                createdAt: Date.now(),
                createdBy: formData.createdBy ? formData.createdBy : '',
                // expireTime: expireTime ? expireTime : null
            }).save();

            await Appointment.updateOne(
                { _id: newAppointment._id }, 
                {
                    $set: { 
                        code: 'APM-' + newAppointment._id.toString().slice(-5).toUpperCase()
                    }
                }
            );
            
            var data = await Appointment.findById(newAppointment._id);
            
            // if(data){
            //     const job = new CronJob(expireTime, async function() {
            //         await Appointment.cronCancelBooking(data._id, "Lịch hẹn bị hủy tự động do hết hết hạn");
            //     });
            //     job.start();
            // }

            return res.status(200).json({ success: true, message: 'Đặt hẹn thành công', data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getEmptyCalendar: async(req, res) => {
        try{
            var data = await Appointment.find({ status: { $ne: 'Cancelled' } });
            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getByQuery: async(req, res) => {
        try{
            var filters = req.body.filters;
            var sorts = req.body.sorts;
            var pages = req.body.pages;
            var listDentistId = filters.dentistsF.map(x => mongoose.Types.ObjectId(x));
            var dateFromF = new Date(moment(filters.dateF[0]).format('YYYY/MM/DD'));
            var dateToF = new Date(moment(filters.dateF[1]).format('YYYY/MM/DD'));

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
                        "dentistName": { $arrayElemAt: ["$dentistInfo.name", 0] },
                        "dentistPhone": { $arrayElemAt: ["$dentistInfo.phone", 0] },
                        "dentistBirthday": { $arrayElemAt: ["$dentistInfo.birthday", 0] },
                        "dentistPhysicalId": { $arrayElemAt: ["$dentistInfo.physicalId", 0] },
                        "dentistCode": { $arrayElemAt: ["$dentistInfo.code", 0] },
                        "dentistGender": { $arrayElemAt: ["$dentistInfo.gender", 0] },
                        "serviceGroupName": { $arrayElemAt: ["$serviceGroupInfo.name", 0] }
                    }
                },
                 // {
                //     $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$customerInfo", 0 ] }, "$$ROOT" ] } }
                // },
                { $project: { 
                    customerInfo: 0,
                    dentistInfo: 0,
                    serviceGroupInfo: 0
                }},
                { $match: { 
                    $and: [
                        { code: { $regex: filters.codeF, $options:"$i" } },
                        { $or: [
                                { customerName: { $regex: filters.customersF, $options:"$i" } },
                                { customerPhone: { $regex: filters.customersF, $options:"$i" } },
                                { customerPhysicalId: { $regex: filters.customersF, $options:"$i" } },
                                { customerCode: { $regex: filters.customersF, $options:"$i" } },
                            ] 
                        },
                        { status: { $in: (filters.statusF.length > 0 && filters.statusF != null) ? filters.statusF : ["Booked", "Checkin", "Examined", "Cancelled"] } },
                        { date: { $gte: dateFromF } },
                        { date: { $lte: dateToF } },
                        (filters.dentistsF.length > 0 && filters.dentistsF != null) ? { 
                            dentistId: { $in: listDentistId }
                        } : {}
                    ]
                }},
                { $sort: { timeFrom: sorts }},
                { $limit: (pages.from + pages.size) },
                { $skip: pages.from }
            ]);

            var total = await Appointment.aggregate([
                { $lookup: {
                    from: "tw_customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerInfo"
                }},
                {
                    $addFields: {
                        "customerName": { $arrayElemAt: ["$customerInfo.name", 0] },
                        "customerPhone": { $arrayElemAt: ["$customerInfo.phone", 0] },
                        "customerPhysicalId": { $arrayElemAt: ["$customerInfo.physicalId", 0] },
                        "customerCode": { $arrayElemAt: ["$customerInfo.code", 0] }
                    }
                },
                { $project: { 
                    customerInfo: 0
                }},
                { $match: { 
                    $and: [
                        { code: { $regex: filters.codeF, $options:"$i" } },
                        { $or: [
                                { customerName: { $regex: filters.customersF, $options:"$i" } },
                                { customerPhone: { $regex: filters.customersF, $options:"$i" } },
                                { customerPhysicalId: { $regex: filters.customersF, $options:"$i" } },
                                { customerCode: { $regex: filters.customersF, $options:"$i" } },
                            ] 
                        },
                        { status: { $in: (filters.statusF.length > 0 && filters.statusF != null) ? filters.statusF : ["Booked", "Checkin", "Examined", "Cancelled"] } },
                        { date: { $gte: dateFromF } },
                        { date: { $lte: dateToF } },
                        (filters.dentistsF.length > 0 && filters.dentistsF != null) ? { 
                            dentistId: { $in: listDentistId }
                        } : {}
                    ]
                }},
                { $count: "count" }
            ]);

            return res.status(200).json({ success: true, data: data, total: total.count > 0 ? total[0].count : 0 });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    updateBooking: async(req, res) => {
        try{
            var formData = req.body;
            /** Kiểm tra điều kiện đầu vào */
            if(formData.serviceGroupId == null || formData.serviceGroupId == '') {
                return res.status(200).json({ success: false, error: "Hãy chọn dịch vụ" });
            }

            /**Kiểm tra tồn tại */
            const exist = await Appointment.findById(formData._id);
            if(exist == null) {
                return res.status(200).json({ success: false, error: "Lịch hẹn không tồn tại" });
            }

            /**Xử lý */
            await Appointment.updateOne(
                { _id: formData._id }, 
                {
                    $set: { 
                        serviceGroupId: formData.serviceGroupId ? formData.serviceGroupId : '',
                        type: formData.type ? formData.type : '635dedbba3976c621f4c1d8f',
                        note: formData.note ? formData.note : '', 
                        updatedAt: Date.now(),
                        updatedBy: formData.updatedBy ? formData.updatedBy : ''
                    }
                }
            );
            var data = await Appointment.findById(formData._id);
            return res.status(200).json({ success: true, message: 'Cập nhật thành công', data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    cancelBooking: async(req, res) => {
        try{
            var formData = req.body;
            /** Kiểm tra điều kiện đầu vào */
            if(formData.cancelReason == null || formData.cancelReason == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập lý do hủy" });
            }

            /**Kiểm tra tồn tại */
            const exist = await Appointment.findById(formData.id);
            if(exist == null) {
                return res.status(200).json({ success: false, error: "Lịch hẹn không tồn tại" });
            }
            else{
                /**Kiểm tra trạng thái lịch hẹn */
                if(exist.status == 'Cancelled' || exist.status == 'Examined'){
                    return res.status(200).json({ success: false, error: "Trạng thái lịch hẹn không thể hủy" });
                }
            }

            /**Xử lý */
            await Appointment.updateOne(
                { _id: formData.id }, 
                {
                    $set: { 
                        cancelReason: formData.cancelReason ? formData.cancelReason : '',
                        status: 'Cancelled',
                        isActive: false,
                        updatedAt: Date.now(),
                        updatedBy: formData.updatedBy ? formData.updatedBy : ''
                    }
                }
            );

            /**Thông báo */

            return res.status(200).json({ success: true, message: 'Hủy lịch hẹn thành công' });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    changeStatus: async(req, res) => {
        try{

        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    }
};

module.exports = AppointmentController;