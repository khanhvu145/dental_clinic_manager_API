const AppointmentConfig = require('../models/tw_AppointmentConfig');
const IsNullOrEmpty = require('../helpers/IsNullOrEmpty');
const moment = require('moment');
const mongoose = require('mongoose');

const AppointmentConfigController = {
    createUpdate: async(req, res) => {
        try{
            var formData = req.body;
            var workingTimeData = formData.workingTime;
            var autoRemindData = formData.autoRemind;
            var otherData = formData.other;
            var viewsData = formData.views;
            var dayOfWeekData = [
                {
                    key: 'monday',
                    label: 'Thứ hai',
                    value: true
                },
                {
                    key: 'tuesday',
                    label: 'Thứ ba',
                    value: true
                },
                {
                    key: 'wednesday',
                    label: 'Thứ tư',
                    value: true
                },
                {
                    key: 'thursday',
                    label: 'Thứ năm',
                    value: true
                },
                {
                    key: 'friday',
                    label: 'Thứ sáu',
                    value: true
                },
                {
                    key: 'saturday',
                    label: 'Thứ bảy',
                    value: true
                },
                {
                    key: 'sunday',
                    label: 'Chủ nhật',
                    value: false
                },
            ];
            /**Kiểm tra đầu vào */
            //Thời gian làm việc
            if(workingTimeData.apply){
                if((workingTimeData.timeAM.timeFrom == null || workingTimeData.timeAM.timeFrom == '') || (workingTimeData.timeAM.timeTo == null || workingTimeData.timeAM.timeTo == '')) {
                    return res.status(200).json({ success: false, error: "Hãy nhập thời gian làm việc buổi sáng" });
                }
                if((workingTimeData.timePM.timeFrom == null || workingTimeData.timePM.timeFrom == '') || (workingTimeData.timePM.timeTo == null || workingTimeData.timePM.timeTo == '')) {
                    return res.status(200).json({ success: false, error: "Hãy nhập thời gian làm việc buổi chiều" });
                }
            }
            //Cấu hình nhắc hẹn tự động
            if(autoRemindData.apply){
                if(autoRemindData.duration == null || autoRemindData.duration == '' || autoRemindData.duration == 0){
                    return res.status(200).json({ success: false, error: "Hãy nhập ngày thông báo" });
                }
                if(autoRemindData.time == null || autoRemindData.time == '') {
                    return res.status(200).json({ success: false, error: "Hãy chọn thời gian nhắc hẹn" });
                }
            }

            //Cấu hình hủy hẹn tự động
            if(otherData.autoCancelApply){
                if(otherData.autoCancelDuration == null || otherData.autoCancelDuration == '' || otherData.autoCancelDuration == 0){
                    return res.status(200).json({ success: false, error: "Hãy nhập thời gian hủy hẹn tự động" });
                }
            }

            /**Xử lý */
            //Xóa cấu hình cũ
            await AppointmentConfig.deleteMany({});
            //Tạo cấu hình mới
            const newData = await new AppointmentConfig({
                "workingTime.apply": workingTimeData.apply,
                "workingTime.timeAM.timeFrom": workingTimeData.timeAM.timeFrom ? workingTimeData.timeAM.timeFrom : '',
                "workingTime.timeAM.timeTo": workingTimeData.timeAM.timeTo ? workingTimeData.timeAM.timeTo : '',
                "workingTime.timePM.timeFrom": workingTimeData.timePM.timeFrom ? workingTimeData.timePM.timeFrom : '',
                "workingTime.timePM.timeTo": workingTimeData.timePM.timeTo ? workingTimeData.timePM.timeTo : '',
                "workingTime.dayOfWeek": (workingTimeData.dayOfWeek && workingTimeData.dayOfWeek.length == 7) ? workingTimeData.dayOfWeek : dayOfWeekData,
                "autoRemind.apply": autoRemindData.apply,
                "autoRemind.repeat": autoRemindData.repeat,
                "autoRemind.duration": autoRemindData.duration ? parseFloat(autoRemindData.duration) : parseFloat(0),
                "autoRemind.time": autoRemindData.time ? autoRemindData.time : '',
                "autoRemind.type": autoRemindData.type ? autoRemindData.type : 'type3',
                "other.autoCancelApply": otherData.autoCancelApply,
                "other.autoCancelDuration": otherData.autoCancelDuration ? parseFloat(otherData.autoCancelDuration) : parseFloat(0),
                "other.autoCancelType": otherData.autoCancelType ? otherData.autoCancelType : 'minutes',
                "other.notifyIsBooked": otherData.notifyIsBooked,
                "other.notifyIsCheckin": otherData.notifyIsCheckin,
                "other.notifyIsCancelled": otherData.notifyIsCancelled,
                "other.notifyIsTranfer": otherData.notifyIsTranfer,
                views: viewsData,
                createdAt: Date.now(),
                createdBy: formData.createdBy ? formData.createdBy : ''
            });
            const data = await newData.save();

            return res.status(200).json({ success: true, message: 'Cập nhật cấu hình thành công', data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getData: async (req, res) => {
        try{
            var data = await AppointmentConfig.find({});
            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    }
};

module.exports = AppointmentConfigController;