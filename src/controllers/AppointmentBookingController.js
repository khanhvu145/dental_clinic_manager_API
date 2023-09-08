const { forEach } = require('lodash');
const models = require('../models/tw_Appointment_Booking');
const Appointment = models.AppointmentModel;
// const AppointmentLog = models.AppointmentLogModel;
const tw_Customer = require('../models/tw_Customer');
const Customer = tw_Customer.CustomerModel;
const CustomerLog = tw_Customer.CustomerLogModel;
const mongoose = require('mongoose');

const AppointmentBookingController = {
    create: async(req, res) => {
        try{
            var formData = req.body;
            //#region Kiểm tra đầu vào
            //Kiểm tra khách hàng
            if(formData.mainCustomer == null || formData.mainCustomer._id == null || formData.mainCustomer._id == '') {
                return res.status(200).json({ success: false, error: "Hãy chọn khách hàng" });
            }
            else{
                var customerInfo =  await Customer.findById(formData.mainCustomer._id);
                if(customerInfo == null){
                    return res.status(200).json({ success: false, error: "Không có thông tin khách hàng" });
                }
            }
            //Kiểm tra nha sĩ
            if(formData.dentistId == null || formData.dentistId == '') {
                return res.status(200).json({ success: false, error: "Hãy chọn nha sĩ phụ trách" });
            }
            //Kiểm tra thời gian
            if(formData.date == null || formData.date == ''){
                return res.status(200).json({ success: false, error: "Hãy chọn thời gian hẹn" });
            }
            if(formData.timeFrom == null || formData.timeFrom == ''){
                return res.status(200).json({ success: false, error: "Hãy chọn thời gian hẹn" });
            }
            if(formData.timeTo == null || formData.timeTo == ''){
                return res.status(200).json({ success: false, error: "Hãy chọn thời gian hẹn" });
            }
            //Nội dung
            if(formData.content == null || formData.content == '') {
                return res.status(200).json({ success: false, error: "Hãy chọn nội dung lịch hẹn" });
            }
            //#endregion
        
            //#region Kiểm tra thời gian đặt hẹn
            var checkCanBook = await Appointment.checkCanBook(formData, false);
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
            //#region 

            //#region Xử lý
            //Chuẩn hóa data
            var customerBooking = {
                _id: formData.mainCustomer._id,
                code: formData.mainCustomer.code,
                name: formData.mainCustomer.name,
                physicalId: formData.mainCustomer.physicalId,
                dateOfIssue: formData.mainCustomer.dateOfIssue,
                placeOfIssue: formData.mainCustomer.placeOfIssue,
                email: formData.mainCustomer.email,
                phone: formData.mainCustomer.phone,
                birthday: formData.mainCustomer.birthday,
                gender: formData.mainCustomer.gender,
                fullAddress: formData.mainCustomer.fullAddress
            }
            formData.mainCustomer = customerBooking;
            console.log('0')
            var data = await Appointment.createBooking(formData, req.username);
            console.log(data)
            if(data.code <= 0){
                return res.status(200).json({ success: false, error: data.error });
            }
            //#endregion
            console.log('1')
            //#region Log khách hàng
            if(data && data.data){
                console.log('2')
                var log = [];
                var item = {
                    column: 'Đặt hẹn',
                    oldvalue: '',
                    newvalue: data.data.code || ''
                };
                log.push(item);
                await CustomerLog.CreateLog(data.data.mainCustomer._id, 'booking', log, 'create', formData.createdBy);
            }
            //#endregion
            console.log('3')

            return res.status(200).json({ success: true, message: 'Đặt hẹn thành công', data: data.data, checkCanBook: checkCanBook });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    updateStatusToNoArrivedJob: async(req, res) => {
        try{
            var currentDate = new Date(new Date().setHours(0,0,0,0));
            var appointments = await Appointment.find({
                status: 'new',
                dateTimeFrom: { $lt: currentDate }
            }, { projection: { _id: 1 } });
            if(appointments && appointments.length > 0){
                var ids = appointments.map(m => m._id);
                const updated = await Appointment.updateMany(
                    { _id: { $in: ids } },
                    {
                        $set: {
                            status: 'notarrived',
                            updatedAt: Date.now(),
                            updatedBy: 'System'
                        }
                    }
                );
                if(updated){
                    console.log('matchedCount: ' + updated.matchedCount);
                    console.log('modifiedCount: ' + updated.modifiedCount);
                }
            }
        }
        catch(err){
            console.log('Có lỗi xảy ra khi chạy job cập nhật lịch hẹn: ' + err);
        }
    },
    getEmptyCalendar: async(req, res) => {
        try{
            var formData = req.body;
            var listDentistId = formData.dentistsF.map(x => mongoose.Types.ObjectId(x));
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
                { $match: { 
                    $and: [
                        { date: { $gte: new Date(new Date(`${formData.dateF}`).setHours(0,0,0,0)) } },
                        { date: { $lte: new Date(new Date(`${formData.dateF}`).setHours(23,59,0,0)) } },
                        { status: { $ne: 'cancelled' } },
                        (formData.dentistsF.length > 0 && formData.dentistsF != null) ? { 
                            dentistId: { $in: listDentistId }
                        } : {},
                        (formData.currentId != null && formData.currentId != '') ? { 
                            _id: { $ne: formData.currentId }
                        } : {}
                    ]
                }}
            ]);

            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    }
}

module.exports = AppointmentBookingController;