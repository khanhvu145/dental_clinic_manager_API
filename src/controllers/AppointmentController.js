const Appointment = require('../models/tw_Appointment');
const moment = require('moment');
const CronJob = require('cron').CronJob;

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
            var expireTime = moment(formData.timeTo).add(1, 'm')._d;
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
                expireTime: expireTime ? expireTime : null
            });
            const data = await newAppointment.save();
            
            // if(data){
            //     const job = new CronJob(expireTime, async function() {
            //         await Appointment.cronCancelBooking(data._id, "Lịch hẹn bị hủy tự động do hết hết hạn");
            //     });
            //     job.start();
            // }

            return res.status(200).json({ success: true, message: 'Đặt hẹn thành công', data: data });
        }
        catch(err){
            return res.status(200).json({ success: false, error: err });
        }
    },
    getEmptyCalendar: async(req, res) => {
        try{
            var data = await Appointment.find({ status: { $ne: 'Cancelled' } });
            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(200).json({ success: false, error: err });
        }
    }
};

module.exports = AppointmentController;