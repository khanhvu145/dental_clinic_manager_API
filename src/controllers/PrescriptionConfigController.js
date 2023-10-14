const PrescriptionConfig = require('../models/tw_Prescription_Config');

const PrescriptionConfigController = {
    create: async(req, res) => {
        try{
            var formData = req.body;
            /** Kiểm tra điều kiện đầu vào */
            if(formData.title == null || formData.title == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập tiêu đề" });
            }
            //Xử lý
            const newService = await new PrescriptionConfig({
                title: formData.title ? formData.title : '', 
                isActive: formData.isActive,
                advice: formData.advice || '', 
                medicines: formData.medicines || [],
                createdAt: Date.now(),
                createdBy: req.username ? req.username : ''
            });
            const data = await newService.save();
            return res.status(200).json({ success: true, message: 'Tạo thành công', data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getByQuery: async(req, res) => {
        try{
            var filters = req.body.filters;
            var sorts = new Map([req.body.sorts.split("&&")]);
            var pages = req.body.pages;

            var data = await PrescriptionConfig.find({
                $and: [
                    { title: { $regex: filters.titleF, $options:"i" } },
                    { isActive: { $in: filters.statusF == null ? [true, false] : [filters.statusF] } }
                ]
            }).sort(sorts).limit(pages.size).skip(pages.from);

            var total = await PrescriptionConfig.find({
                $and: [
                    { title: { $regex: filters.titleF, $options:"i" } },
                    { isActive: { $in: filters.statusF == null ? [true, false] : [filters.statusF] } }
                ]
            }).count();

            return res.status(200).json({ success: true, data: data, total: total });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getById: async(req, res) => {
        try{
            const data = await PrescriptionConfig.findById(req.params.id);
            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    update: async(req, res) => {
        try {
            var formData = req.body;
            /** Kiểm tra điều kiện đầu vào */
            if(formData.title == null || formData.title == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập tiêu đề" });
            }
            /**Kiểm tra tồn tại */
            const exist = await PrescriptionConfig.findById(formData._id);
            if(exist == null) {
                return res.status(200).json({ success: false, error: "Đơn thuốc không tồn tại" });
            }
            //Xử lý
            await PrescriptionConfig.updateOne(
                { _id: formData._id }, 
                {
                    $set: { 
                        title: formData.title ? formData.title : '', 
                        isActive: formData.isActive,
                        advice: formData.advice || '', 
                        medicines: formData.medicines || [],
                        updatedAt: Date.now(),
                        updatedBy: req.username ? req.username : ''
                    }
                }
            );
            var data = await PrescriptionConfig.findById(formData._id);
            return res.status(200).json({ success: true, message: 'Cập nhật thành công', data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getByTextSearch: async(req, res) => {
        try{
            var filters = req.body.filters;
            var sorts = new Map([req.body.sorts.split("&&")]);
            var pages = req.body.pages;
            var data = await PrescriptionConfig.find({
                $and: [
                    { title: { $regex: filters.textSearch, $options:"i" } },
                    { isActive: true }
                ]
            }).sort(sorts).limit(pages.size).skip(pages.from);
            var total = await PrescriptionConfig.find({
                $and: [
                    { title: { $regex: filters.textSearch, $options:"i" } },
                    { isActive: true }
                ]
            }).count();

            return res.status(200).json({ success: true, data: data, total: total });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    }
};

module.exports = PrescriptionConfigController;