const models = require('../models/tw_Appointment_Booking');
const Appointment = models.AppointmentModel;
// const AppointmentLog = models.AppointmentLogModel;
const tw_Customer = require('../models/tw_Customer');
const Customer = tw_Customer.CustomerModel;
const CustomerLog = tw_Customer.CustomerLogModel;

const AppointmentBookingController = {
    create: async(req, res) => {
        try{
            var formData = req.body;
            //#region Kiểm tra đầu vào
            //Kiểm tra khách hàng
            if(formData.mainCustomer == null && formData.mainCustomer._id == null || formData.mainCustomer._id == '') {
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
            var data = await Appointment.createBooking(formData, req.username);
            if(data.code <= 0){
                return res.status(200).json({ success: false, error: data.error });
            }
            //#endregion

            //#region Log khách hàng
            if(data && data.data){
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

            return res.status(200).json({ success: true, message: 'Đặt hẹn thành công', data: data.data, checkCanBook: checkCanBook });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    }
}

module.exports = AppointmentBookingController;