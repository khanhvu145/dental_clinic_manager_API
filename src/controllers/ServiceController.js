const Service = require('../models/tw_Service');

const ServiceController = {
    create: async(req, res) => {
        try{
            var formData = req.body;
            /** Kiểm tra điều kiện đầu vào */
            if(formData.code == null || formData.code == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập mã dịch vụ" });
            }
            if(formData.name == null || formData.name == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập tên dịch vụ" });
            }
            if(formData.price == null || formData.price == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập giá dịch vụ" });
            }
            if(formData.executionTime == null || formData.executionTime == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập thời gian thực hiện tối thiểu" });
            }
            //Xử lý
            var exists = await Service.findOne({ code: formData.code });
            if(exists == null){
                const newService = await new Service({
                    code: formData.code ? formData.code : '', 
                    name: formData.name ? formData.name : '', 
                    price: formData.price ? parseFloat(formData.price) : parseFloat(0),
                    executionTime: formData.executionTime ? parseFloat(formData.executionTime) : parseFloat(0),
                    executionTimeType: formData.executionTimeType ? formData.executionTimeType : '', 
                    description: formData.description ? formData.description : '', 
                    isActive: formData.isActive,
                    createdAt: Date.now(),
                    createdBy: formData.createdBy ? formData.createdBy : ''
                });
                const data = await newService.save();
                return res.status(200).json({ success: true, message: 'Tạo thành công', data: data });
            }
            else{
                return res.status(200).json({ success: false, error: 'Mã dịch vụ đã tồn tại' });
            }
        }
        catch(err){
            return res.status(200).json({ success: false, error: err });
        }
    },
    getByQuery: async(req, res) => {
        try{
            var filters = req.body.filters;
            var sorts = new Map([req.body.sorts.split("&&")]);
            var pages = req.body.pages;

            var data = await Service.find({
                $and: [
                    { code: { $regex: filters.codeF, $options:"$i" } },
                    { name: { $regex: filters.nameF, $options:"$i" } },
                    { isActive: { $in: filters.statusF == null ? [true, false] : [filters.statusF] } }
                ]
            }).sort(sorts).limit(pages.size).skip(pages.from);

            var total = await Service.find({
                $and: [
                    { code: { $regex: filters.codeF, $options:"$i" } },
                    { name: { $regex: filters.nameF, $options:"$i" } },
                    { isActive: { $in: filters.statusF == null ? [true, false] : [filters.statusF] } }
                ]
            }).count();

            return res.status(200).json({ success: true, data: data, total: total });
        }
        catch(err){
            return res.status(200).json({ success: false, error: err });
        }
    },
    getById: async(req, res) => {
        try{
            const data = await Service.findById(req.params.id);
            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(200).json({ success: false, error: err });
        }
    },
    update: async(req, res) => {
        try {
            var formData = req.body;
            /** Kiểm tra điều kiện đầu vào */
            if(formData.code == null || formData.code == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập mã dịch vụ" });
            }
            if(formData.name == null || formData.name == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập tên dịch vụ" });
            }
            if(formData.price == null || formData.price == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập giá dịch vụ" });
            }
            if(formData.executionTime == null || formData.executionTime == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập thời gian thực hiện tối thiểu" });
            }
            //Xử lý
            await Service.updateOne(
                { _id: formData._id }, 
                {
                    $set: { 
                        code: formData.code ? formData.code : '', 
                        name: formData.name ? formData.name : '', 
                        price: formData.price ? parseFloat(formData.price) : parseFloat(0),
                        executionTime: formData.executionTime ? parseFloat(formData.executionTime) : parseFloat(0),
                        executionTimeType: formData.executionTimeType ? formData.executionTimeType : '', 
                        description: formData.description ? formData.description : '', 
                        isActive: formData.isActive,
                        updatedAt: Date.now(),
                        updatedBy: formData.updatedBy ? formData.updatedBy : ''
                    }
                }
            );
            var data = await Service.findById(formData._id);
            return res.status(200).json({ success: true, message: 'Cập nhật thành công', data: data });
        }
        catch(err){
            return res.status(200).json({ success: false, error: err });
        }
    },
}

module.exports = ServiceController;