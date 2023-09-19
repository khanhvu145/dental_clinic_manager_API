const AppointmentConfigs = require('../models/tw_Appointment_Config');
const IsNullOrEmpty = require('../helpers/IsNullOrEmpty');
const moment = require('moment');
const mongoose = require('mongoose');

const AppointmentConfigController = {
    update: async(req, res) => {
        try{
            var formData = req.body || [];
            for(var i = 0; i < formData.length; i++){
                if(!IsNullOrEmpty(formData[i].key) && !IsNullOrEmpty(formData[i].value)){
                    await AppointmentConfigs.updateOne(
                        { key: formData[i].key }, 
                        {
                            $set: { 
                                value: formData[i].value,
                                updatedAt: new Date(),
                                updatedBy: req.username ? req.username : ''
                            }
                        }
                    );
                }
            }

            var data = await AppointmentConfigs.find({});

            return res.status(200).json({ success: true, message: 'Cập nhật cấu hình thành công', data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getDataByKey: async (req, res) => {
        try{
            var data = await AppointmentConfigs.findOne({ key: req.query.key });
            return res.status(200).json(data);
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getDataByListKey: async (req, res) => {
        try{
            var data = await AppointmentConfigs.find({ key: { $in: req.body || [] } });
            return res.status(200).json(data);
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
};

module.exports = AppointmentConfigController;