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
const sendMail = require('../helpers/sendMail');
const path = require('path');
const fs = require('fs');

const AppointmentController = {
    booking: async(req, res) => {
        try{
            var formData = req.body;
            /** Kiểm tra điều kiện đầu vào */
            //Các trường bắt buột
            if(formData.customerId == null || formData.customerId == '') {
                return res.status(200).json({ success: false, error: "Hãy chọn khách hàng" });
            }
            else{
                var customerInfo =  await Customer.findById(formData.customerId);
                if(customerInfo == null){
                    return res.status(200).json({ success: false, error: "Không có thông tin khách hàng" });
                }
            }
            if(formData.dentistId == null || formData.dentistId == '') {
                return res.status(200).json({ success: false, error: "Hãy chọn nha sĩ phụ trách" });
            }
            else{
                var dentistInfo =  await User.findById(formData.dentistId);
                if(dentistInfo == null){
                    return res.status(200).json({ success: false, error: "Không có thông tin nha sĩ" });
                }
            }
            if(formData.serviceGroupId == null || formData.serviceGroupId == '') {
                return res.status(200).json({ success: false, error: "Hãy chọn dịch vụ" });
            }
            else{
                var serviceInfo =  await ServiceGroup.findById(formData.serviceGroupId);
                if(serviceInfo == null){
                    return res.status(200).json({ success: false, error: "Không có thông tin loại dịch vụ" });
                }
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
                else if(checkCanBook == -4){
                    return res.status(200).json({ success: false, error: "Thời gian đặt hẹn nằm ngoài thời gian làm việc" });
                }
                else{
                    return res.status(200).json({ success: false, error: "Có lỗi xảy ra trong quá trình đặt lịch hẹn" });
                }
            }

            /** Xử lý */
            var data = await Appointment.booking(formData);

            if(data.code <= 0){
                return res.status(200).json({ success: false, error: data.error });
            }

            return res.status(200).json({ success: true, message: 'Đặt hẹn thành công', data: data.data, checkCanBook: checkCanBook });
            // var timeFrom = await Appointment.setTimeFrom(formData.date, formData.time);
            // var timeTo = await Appointment.setTimeTo(timeFrom, parseFloat(formData.duration), formData.durationType);
            // const newAppointment = await new Appointment({
            //     dentistId: formData.dentistId ? formData.dentistId : '', 
            //     customerId: formData.customerId ? formData.customerId : '', 
            //     serviceGroupId: formData.serviceGroupId ? formData.serviceGroupId : '',
            //     date: formData.date ? formData.date : null,
            //     time: formData.time ? formData.time : '',
            //     duration: formData.duration ? parseFloat(formData.duration) : parseFloat(0),
            //     durationType: formData.durationType ? formData.durationType : 'minutes',
            //     type: formData.type ? formData.type : '635dedbba3976c621f4c1d8f',
            //     status: 'Booked',
            //     note: formData.note ? formData.note : '', 
            //     timeFrom: timeFrom ? timeFrom : null, 
            //     timeTo: timeTo ? timeTo : null, 
            //     isActive: formData.isActive ? formData.isActive : true,
            //     createdAt: Date.now(),
            //     createdBy: formData.createdBy ? formData.createdBy : '',
            //     // expireTime: expireTime ? expireTime : null
            // }).save();

            // await Appointment.updateOne(
            //     { _id: newAppointment._id }, 
            //     {
            //         $set: { 
            //             code: 'APM-' + newAppointment._id.toString().slice(-5).toUpperCase()
            //         }
            //     }
            // );
            // var data = await Appointment.findById(newAppointment._id);

            // /**Xử lý hủy hẹn tự động */
            // var config = await AppointmentConfig.find({});
            // if(config != null && config.length > 0) {
            //     var configInfo = config[0]; 
            //     if(configInfo.other.autoCancelApply){
            //         var autoCancelDuration = configInfo.other.autoCancelDuration;
            //         var expireTime = moment(data.timeFrom)._d;
            //         if(configInfo.other.autoCancelType == 'minutes'){
            //             expireTime = moment(data.timeFrom).add(autoCancelDuration, 'm')._d;
            //         }
            //         else if (configInfo.other.autoCancelType == 'hours'){
            //             expireTime = moment(data.timeFrom).add(autoCancelDuration, 'h')._d;
            //         }

            //         if(expireTime != null){
            //             const dateCron = convertDateToCron(expireTime);
            //             var job = await new CronJob(
            //                 dateCron,
            //                 async function() {
            //                     await Appointment.cancelBooking(data._id, 'Hủy hẹn tự động do qua thời gian đặt hẹn', formData.createdBy);
            //                 },
            //                 null,
            //                 true,
            //                 'Asia/Ho_Chi_Minh'
            //             );
            //             // await job.start();
            //         }
            //     }
            // }

            // /**Log */
            // var log = [];
            // var isUpdate = false;
            // if(isObjectId(data.dentistId)){
            //     const UserData = await User.findById(data.dentistId);
            //     isUpdate = true;
            //     var item = {
            //         column: 'Nha sĩ phụ trách',
            //         oldvalue: '',
            //         newvalue: UserData.name || ''
            //     };
            //     log.push(item);
            // }
            // if(isObjectId(data.customerId)){
            //     const CustomerData = await Customer.findById(data.customerId);
            //     isUpdate = true;
            //     var item = {
            //         column: 'Khách hàng',
            //         oldvalue: '',
            //         newvalue: CustomerData.name || ''
            //     };
            //     log.push(item);
            // }
            // if(isObjectId(data.serviceGroupId)) {
            //     const ServiceGroupData = await ServiceGroup.findById(data.serviceGroupId);
            //     isUpdate = true;
            //     var item = {
            //         column: 'Loại dịch vụ',
            //         oldvalue: '',
            //         newvalue: ServiceGroupData.name
            //     };
            //     log.push(item);
            // }
            // if(data.date != null) {
            //     isUpdate = true;
            //     var item = {
            //         column: 'Ngày hẹn',
            //         oldvalue: '',
            //         newvalue: moment(data.date).format('DD/MM/YYYY')
            //     };
            //     log.push(item);
            // }
            // if(!IsNullOrEmpty(data.time)) {
            //     isUpdate = true;
            //     var item = {
            //         column: 'Giờ hẹn',
            //         oldvalue: '',
            //         newvalue: data.time
            //     };
            //     log.push(item);
            // }
            // if(data.duration > 0) {
            //     isUpdate = true;
            //     var item = {
            //         column: 'Khoảng thời gian',
            //         oldvalue: '',
            //         newvalue: `${data.duration.toString()} ${(data.durationType == 'minutes' ? 'phút' : 'giờ')}`
            //     };
            //     log.push(item);
            // }
            // if(isObjectId(data.type)) {
            //     const GeneralConfigData = await GeneralConfig.findById(data.type);
            //     isUpdate = true;
            //     var item = {
            //         column: 'Loại lịch hẹn',
            //         oldvalue: '',
            //         newvalue: GeneralConfigData.value || ''
            //     };
            //     log.push(item);
            // }
            // if(!IsNullOrEmpty(data.note)) {
            //     isUpdate = true;
            //     var item = {
            //         column: 'Ghi chú',
            //         oldvalue: '',
            //         newvalue: data.note
            //     };
            //     log.push(item);
            // }
            // if (isUpdate)
            // {
            //     await AppointmentLog.CreateLog(data._id, 'create', log, formData.createdBy);
            // }
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
            var dateFromF = null;
            var dateToF = null;
            if(filters.dateF != null && filters.dateF != '' && filters.dateF.length > 0){
                dateFromF = new Date(moment(filters.dateF[0]).format('YYYY/MM/DD'));
                dateToF = new Date(moment(filters.dateF[1]).format('YYYY/MM/DD'));
            }
            
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
                        { code: { $regex: filters.codeF, $options:"i" } },
                        { $or: [
                                { customerName: { $regex: filters.customersF, $options:"i" } },
                                { customerPhone: { $regex: filters.customersF, $options:"i" } },
                                { customerPhysicalId: { $regex: filters.customersF, $options:"i" } },
                                { customerCode: { $regex: filters.customersF, $options:"i" } },
                            ] 
                        },
                        { status: { $in: (filters.statusF.length > 0 && filters.statusF != null) ? filters.statusF : ["Booked", "Checkin", "Examined", "Cancelled"] } },
                        dateFromF ? { date: { $gte: dateFromF } } : {},
                        dateToF ? { date: { $lte: dateToF } } : {},
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
                        { code: { $regex: filters.codeF, $options:"i" } },
                        { $or: [
                                { customerName: { $regex: filters.customersF, $options:"i" } },
                                { customerPhone: { $regex: filters.customersF, $options:"i" } },
                                { customerPhysicalId: { $regex: filters.customersF, $options:"i" } },
                                { customerCode: { $regex: filters.customersF, $options:"i" } },
                            ] 
                        },
                        { status: { $in: (filters.statusF.length > 0 && filters.statusF != null) ? filters.statusF : ["Booked", "Checkin", "Examined", "Cancelled"] } },
                        dateFromF ? { date: { $gte: dateFromF } } : {},
                        dateToF ? { date: { $lte: dateToF } } : {},
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
                        { type: { $regex: 'appointment_type', $options:"i" } },
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
            await Appointment.cancelBooking(formData.id, formData.cancelReason, formData.updatedBy);
            // await Appointment.updateOne(
            //     { _id: formData.id }, 
            //     {
            //         $set: { 
            //             cancelReason: formData.cancelReason ? formData.cancelReason : '',
            //             status: 'Cancelled',
            //             isActive: false,
            //             updatedAt: Date.now(),
            //             updatedBy: formData.updatedBy ? formData.updatedBy : 'System',
            //             cancelledAt: Date.now(),
            //             cancelledBy: formData.updatedBy ? formData.updatedBy : 'System'
            //         }
            //     }
            // );
            
            /**Log */
            // var log = [];
            // var item = {
            //     column: 'Lý do',
            //     oldvalue: '',
            //     newvalue: formData.cancelReason || ''
            // };
            // log.push(item);
            // await AppointmentLog.CreateLog(formData.id, 'cancel', log, formData.updatedBy);

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
            var formData = req.body;
            /**Kiểm tra tồn tại */
            const exist = await Appointment.findById(formData.id);
            if(exist == null) {
                return res.status(200).json({ success: false, error: "Lịch hẹn không tồn tại" });
            }

            /**Xử lý */
            if(formData.action == 'Checkin'){
                /**Kiểm tra trạng thái lịch hẹn */
                if(exist.status != 'Booked'){
                    return res.status(200).json({ success: false, error: "Trạng thái lịch hẹn hiện tại không thể xác nhận" });
                }

                await Appointment.updateOne(
                    { _id: formData.id }, 
                    {
                        $set: { 
                            status: 'Checkin', 
                            updatedAt: Date.now(),
                            updatedBy: formData.currentUser ? formData.currentUser : ''
                        }
                    }
                );
                var data = await Appointment.findById(formData.id);
                
                /**Logs */
                await AppointmentLog.CreateLog(data._id, 'Xác nhận đến khám', [], formData.currentUser);
                /**Notify */

                return res.status(200).json({ success: true, message: 'Xác nhận thành công' });
            }
            else if(formData.action == 'Booked'){
                /**Kiểm tra trạng thái lịch hẹn */
                if(exist.status != 'Checkin'){
                    return res.status(200).json({ success: false, error: "Trạng thái lịch hẹn hiện tại không thể hủy xác nhận" });
                }

                await Appointment.updateOne(
                    { _id: formData.id }, 
                    {
                        $set: { 
                            status: 'Booked', 
                            updatedAt: Date.now(),
                            updatedBy: formData.currentUser ? formData.currentUser : ''
                        }
                    }
                );
                var data = await Appointment.findById(formData.id);
                
                /**Logs */
                await AppointmentLog.CreateLog(data._id, 'Hủy xác nhận đến khám', [], formData.currentUser);
                /**Notify */

                return res.status(200).json({ success: true, message: 'Hủy xác nhận thành công' });
            }
            else{
                return res.status(200).json({ success: true, message: 'Cập nhật thành công' });
            }
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getById: async(req, res) => {
        try{
            // const data = await Appointment.findById(req.params.id);
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
                { $match: { _id: mongoose.Types.ObjectId(req.params.id) } }
            ]);
            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getCalendarByDentist: async(req, res) => {
        try{
            var data = await Appointment.find({ dentistId: req.params.id, status: { $ne: 'Cancelled' } });
            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    transferBooking: async(req, res) => {
        try{
            var formData = req.body;
            /** Kiểm tra điều kiện đầu vào */
            if(formData.dentistId == null || formData.dentistId == '') {
                return res.status(200).json({ success: false, error: "Hãy chọn nha sĩ phụ trách" });
            }
            else{
                var dentistInfo =  await User.findById(formData.dentistId);
                if(dentistInfo == null){
                    return res.status(200).json({ success: false, error: "Không có thông tin nha sĩ" });
                }
            }
            if((formData.date == null || formData.date == '') || (formData.time == null || formData.time == '') || (formData.duration == null || formData.duration == '' || formData.duration == 0)) {
                return res.status(200).json({ success: false, error: "Hãy chọn thời gian hẹn" });
            }
            
            /**Kiểm tra tồn tại */
            const exist = await Appointment.findById(formData._id);
            if(exist == null) {
                return res.status(200).json({ success: false, error: "Lịch hẹn không tồn tại" });
            }

            /**Kiểm tra thời gian book */
            var checkCanBook = await Appointment.checkCanBook(formData, true);
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
                else if(checkCanBook == -4){
                    return res.status(200).json({ success: false, error: "Thời gian đặt hẹn nằm ngoài thời gian làm việc" });
                }
                else{
                    return res.status(200).json({ success: false, error: "Có lỗi xảy ra trong quá trình đặt lịch hẹn" });
                }
            }

            /**Xử lý */
            exist.dentistId = formData.dentistId;
            exist.date = formData.date;
            exist.time = formData.time;
            exist.duration = formData.duration;
            exist.durationType = formData.durationType;
            exist.note = formData.note;
            exist.createdBy = formData.updatedBy;

            //Tạo booking mới
            var data = await Appointment.booking(exist);
            if(data.code <= 0){
                return res.status(200).json({ success: false, error: data.error });
            }
            //Hủy booking cũ
            await Appointment.cancelBooking(exist._id, 'Lịch hẹn được chuyển sang lịch hẹn ' + data.code, formData.updatedBy);

            // var timeFrom = await Appointment.setTimeFrom(formData.date, formData.time);
            // var timeTo = await Appointment.setTimeTo(timeFrom, parseFloat(formData.duration), formData.durationType);
            // var data = await Appointment.findOneAndUpdate(
            //     { _id: formData.id }, 
            //     {
            //         $set: { 
            //             dentistId: formData.dentistId ? formData.dentistId : '', 
            //             date: formData.date ? formData.date : null,
            //             time: formData.time ? formData.time : '',
            //             duration: formData.duration ? parseFloat(formData.duration) : parseFloat(0),
            //             durationType: formData.durationType ? formData.durationType : 'minutes',
            //             status: 'Booked',
            //             note: formData.note ? formData.note : exist.note, 
            //             timeFrom: timeFrom ? timeFrom : null, 
            //             timeTo: timeTo ? timeTo : null, 
            //             updatedAt: Date.now(),
            //             updatedBy: formData.updatedBy ? formData.updatedBy : ''
            //         }
            //     },
            //     {
            //         new: true,
            //     }
            // );
            // var data = await Appointment.findById(formData.id);

            /**Log */
            var log = [];
            var isUpdate = false;
            if(data) {
                isUpdate = true;
                var item = {
                    column: 'Được chuyển từ lịch hẹn',
                    oldvalue: '',
                    newvalue: exist.code
                };
                log.push(item);
            }
            if (isUpdate)
            {
                await AppointmentLog.CreateLog(data._id, 'Chuyển lịch hẹn', log, formData.updatedBy);
            }

            return res.status(200).json({ success: true, message: 'Chuyển lịch hẹn thành công', data: data.data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    sendMail: async(req, res) => {
        try{
            var formData = req.body;
            /**Kiểm tra tồn tại */
            const exist = await Appointment.findById(formData.id);
            if(exist == null) {
                return res.status(200).json({ success: false, error: "Lịch hẹn không tồn tại" });
            }
            else{
                /**Kiểm tra trạng thái lịch hẹn */
                if(exist.status != 'Booked'){
                    return res.status(200).json({ success: false, error: "Trạng thái lịch hẹn không hợp lệ" });
                }
            }

            /**Xử lý */
            var customerInfo =  await Customer.findById(exist.customerId);
            var dentistInfo =  await User.findById(exist.dentistId);
            var serviceInfo =  await ServiceGroup.findById(exist.serviceGroupId);
            if(customerInfo == null) {
                return res.status(200).json({ success: false, error: "Không có thông tin khách hàng" });
            }
            if(dentistInfo == null) {
                return res.status(200).json({ success: false, error: "Không có thông tin nha sĩ" });
            }
            if(serviceInfo == null) {
                return res.status(200).json({ success: false, error: "Không có thông tin dịch vụ" });
            }

            var template = fs.readFileSync(path.join(__dirname, '/../content/emailTemplate/RemindEmailTemplate.html'),{encoding:'utf-8'});  

            template = template.replace('{customerName}', customerInfo != null ? customerInfo.name : '');
            template = template.replace('{code}', exist.code);
            template = template.replace('{date}', moment(exist.date).format('DD/MM/YYYY').toString());
            template = template.replace('{time}', exist.time);
            template = template.replace('{dentistName}', dentistInfo != null ? dentistInfo.name : '');
            template = template.replace('{service}', serviceInfo != null ? serviceInfo.name : '');
           
            if(customerInfo != null && !IsNullOrEmpty(customerInfo.email)) {
                await sendMail({ to: customerInfo.email, subject: 'THƯ NHẮC HẸN', body: template });
            }
            
            /**Log */
            var log = [];
            var item = {
                column: 'Gửi lúc',
                oldvalue: '',
                newvalue: moment().format('DD/MM/YYYY hh:mm')
            };
            log.push(item);
            await AppointmentLog.CreateLog(exist._id, 'Gửi nhắc hẹn đến khách hàng', log, Date.now());

            return res.status(200).json({ success: true, message: 'Gửi nhắc hẹn đến khách hàng thành công' });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    }
};

module.exports = AppointmentController;