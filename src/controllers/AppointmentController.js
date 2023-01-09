const models = require('../models/tw_Appointment');
const Appointment = models.AppointmentModel;
const AppointmentLog = models.AppointmentLogModel;
const ServiceGroup = require('../models/tw_ServiceGroup');
const GeneralConfig = require('../models/tw_GeneralConfig');
const User = require('../models/tw_User');
const Customer = require('../models/tw_Customer');
const IsNullOrEmpty = require('../helpers/IsNullOrEmpty');
const isObjectId = require('../helpers/isObjectId');
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
            if((formData.date == null || formData.date == '') || (formData.time == null || formData.time == '') || (formData.duration == null || formData.duration == '' || formData.duration == 0)) {
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
            /**Log */
            var log = [];
            var isUpdate = false;
            if(isObjectId(data.dentistId)){
                const UserData = await User.findById(data.dentistId);
                isUpdate = true;
                var item = {
                    column: 'Nha sĩ phụ trách',
                    oldvalue: '',
                    newvalue: UserData.name || ''
                };
                log.push(item);
            }
            if(isObjectId(data.customerId)){
                const CustomerData = await Customer.findById(data.customerId);
                isUpdate = true;
                var item = {
                    column: 'Khách hàng',
                    oldvalue: '',
                    newvalue: CustomerData.name || ''
                };
                log.push(item);
            }
            if(isObjectId(data.serviceGroupId)) {
                const ServiceGroupData = await ServiceGroup.findById(data.serviceGroupId);
                isUpdate = true;
                var item = {
                    column: 'Loại dịch vụ',
                    oldvalue: '',
                    newvalue: ServiceGroupData.name
                };
                log.push(item);
            }
            if(data.date != null) {
                isUpdate = true;
                var item = {
                    column: 'Ngày hẹn',
                    oldvalue: '',
                    newvalue: moment(data.date).format('DD/MM/YYYY')
                };
                log.push(item);
            }
            if(!IsNullOrEmpty(data.time)) {
                isUpdate = true;
                var item = {
                    column: 'Giờ hẹn',
                    oldvalue: '',
                    newvalue: data.time
                };
                log.push(item);
            }
            if(data.duration > 0) {
                isUpdate = true;
                var item = {
                    column: 'Khoảng thời gian',
                    oldvalue: '',
                    newvalue: `${data.duration.toString()} ${(data.durationType == 'minutes' ? 'phút' : 'giờ')}`
                };
                log.push(item);
            }
            if(isObjectId(data.type)) {
                const GeneralConfigData = await GeneralConfig.findById(data.type);
                isUpdate = true;
                var item = {
                    column: 'Loại lịch hẹn',
                    oldvalue: '',
                    newvalue: GeneralConfigData.value || ''
                };
                log.push(item);
            }
            if(!IsNullOrEmpty(data.note)) {
                isUpdate = true;
                var item = {
                    column: 'Ghi chú',
                    oldvalue: '',
                    newvalue: data.note
                };
                log.push(item);
            }
            if (isUpdate)
            {
                await AppointmentLog.CreateLog(data._id, 'create', log, formData.createdBy);
            }
            
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

            return res.status(200).json({ success: true, data: data, total: total.length > 0 ? total[0].count : 0 });
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
                        type: formData.type ? formData.type : exist.type,
                        note: formData.note ? formData.note : '', 
                        updatedAt: Date.now(),
                        updatedBy: formData.updatedBy ? formData.updatedBy : ''
                    }
                }
            );
            var data = await Appointment.findById(formData._id);

            /**Log */
            var log = [];
            var isUpdate = false;
            if(!exist.serviceGroupId.equals(data.serviceGroupId)){
                const ServiceGroupData = await ServiceGroup.find({ isActive: true });
                isUpdate = true;
                var item = {
                    column: 'Dịch vụ',
                    oldvalue: ServiceGroupData.find(x => x._id.equals(exist.serviceGroupId)) ? ServiceGroupData.find(x => x._id.equals(exist.serviceGroupId)).name : '',
                    newvalue: ServiceGroupData.find(x => x._id.equals(data.serviceGroupId)) ? ServiceGroupData.find(x => x._id.equals(data.serviceGroupId)).name : ''
                };
                log.push(item);
            }
            if(!exist.type.equals(data.type)){
                const GeneralConfigData = await GeneralConfig.find({
                    $and: [
                        { type: { $regex: 'appointment_type', $options:"$i" } },
                        { isActive: true }
                    ]
                });
                isUpdate = true;
                var item = {
                    column: 'Loại lịch hẹn',
                    oldvalue: GeneralConfigData.find(x => x._id.equals(exist.type)) ? GeneralConfigData.find(x => x._id.equals(exist.type)).value : '',
                    newvalue: GeneralConfigData.find(x => x._id.equals(data.type)) ? GeneralConfigData.find(x => x._id.equals(data.type)).value : ''
                };
                log.push(item);
            }
            if(exist.note != data.note) {
                isUpdate = true;
                var item = {
                    column: 'Ghi chú',
                    oldvalue: exist.note,
                    newvalue: data.note
                };
                log.push(item);
            }
            if (isUpdate)
            {
                await AppointmentLog.CreateLog(data._id, 'update', log, formData.updatedBy);
            }

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
            
            /**Log */
            var log = [];
            var item = {
                column: 'Lý do',
                oldvalue: '',
                newvalue: formData.cancelReason || ''
            };
            log.push(item);
            await AppointmentLog.CreateLog(formData.id, 'cancel', log, formData.updatedBy);

            /**Thông báo */

            return res.status(200).json({ success: true, message: 'Hủy lịch hẹn thành công' });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getLogs: async(req, res) => {
        try{
            const data = await AppointmentLog.find({ appointmentId: req.params.id }).sort({ createdAt: -1 });
            return res.status(200).json({ success: true, data: data });
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