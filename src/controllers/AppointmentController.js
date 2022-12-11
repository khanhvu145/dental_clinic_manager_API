const Appointment = require('../models/tw_Appointment');
const moment = require('moment');

const AppointmentController = {
    create: async(req, res) => {
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
            if((formData.timeFrom == null || formData.timeFrom == '') || (formData.timeTo == null || formData.timeTo == '')) {
                return res.status(200).json({ success: false, error: "Hãy chọn thời gian hẹn" });
            }
            //Kiểm tra thời gian book
            var checkCanBook = await Appointment.checkCanBook(formData);
            if(checkCanBook < 1){
                if(checkCanBook == -1){
                    return res.status(200).json({ success: false, error: "Thời gian đặt hẹn không hợp lệ" });
                }
                else if(checkCanBook == -2){
                    return res.status(200).json({ success: false, error: "Thời gian kết thúc phải sau thời gian bắt đầu" });
                }
                else if(checkCanBook == -3){
                    return res.status(200).json({ success: false, error: "Thời gian đặt hẹn bị trùng" });
                }
                else{
                    return res.status(200).json({ success: false, error: "Có lỗi xảy ra trong quá trình đặt lịch hẹn" });
                }
            }

            /** Xử lý */
            const newAppointment = await new Appointment({
                dentistId: formData.dentistId ? formData.dentistId : '', 
                customerId: formData.customerId ? formData.customerId : '', 
                serviceGroupId: formData.serviceGroupId ? formData.serviceGroupId : '',
                timeFrom: formData.timeFrom ? formData.timeFrom : null,
                timeTo: formData.timeTo ? formData.timeTo : null,
                type: formData.type ? formData.type : '635dedbba3976c621f4c1d8f',
                status: formData.status ? formData.status : '635dee69a3976c621f4c1d94', 
                note: formData.note ? formData.note : '', 
                isActive: formData.isActive ? formData.isActive : true,
                createdAt: Date.now(),
                createdBy: formData.createdBy ? formData.createdBy : ''
            });
            const data = await newAppointment.save();
            
            return res.status(200).json({ success: true, message: 'Đặt hẹn thành công', data: data });
        }
        catch(err){
            return res.status(200).json({ success: false, error: err });
        }
    }
};

module.exports = AppointmentController;