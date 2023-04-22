const Service = require('../models/tw_Service');
const ServiceGroup = require('../models/tw_ServiceGroup');

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
            if(formData.groupId == null || formData.groupId == '') {
                return res.status(200).json({ success: false, error: "Hãy chọn nhóm dịch vụ" });
            }
            //Xử lý
            var exists = await Service.findOne({ code: formData.code });
            if(exists == null){
                const newService = await new Service({
                    code: formData.code ? formData.code : '', 
                    name: formData.name ? formData.name : '', 
                    groupId: formData.groupId ? formData.groupId : '',
                    price: formData.price ? parseFloat(formData.price) : parseFloat(0),
                    unit: formData.unit ? formData.unit : '',
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
            return res.status(400).json({ success: false, error: err });
        }
    },
    getByQuery: async(req, res) => {
        try{
            var filters = req.body.filters;
            var sorts = new Map([req.body.sorts.split("&&")]);
            var pages = req.body.pages;

            var data = await Service.find({
                $and: [
                    { code: { $regex: filters.codeF, $options:"i" } },
                    { name: { $regex: filters.nameF, $options:"i" } },
                    filters.groupF != '' ? { groupId: filters.groupF } : {},
                    { isActive: { $in: filters.statusF == null ? [true, false] : [filters.statusF] } }
                ]
            }).sort(sorts).limit(pages.size).skip(pages.from);

            var total = await Service.find({
                $and: [
                    { code: { $regex: filters.codeF, $options:"i" } },
                    { name: { $regex: filters.nameF, $options:"i" } },
                    filters.groupF != '' ? { groupId: filters.groupF } : {},
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
            const data = await Service.findById(req.params.id);
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
            if(formData.code == null || formData.code == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập mã dịch vụ" });
            }
            else{
                var exists = await Service.findOne({ code: formData.code, _id: { $ne: formData._id } });
                if(exists != null){
                    return res.status(200).json({ success: false, error: 'Mã dịch vụ đã tồn tại' });
                }
            }
            if(formData.name == null || formData.name == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập tên dịch vụ" });
            }
            if(formData.groupId == null || formData.groupId == '') {
                return res.status(200).json({ success: false, error: "Hãy chọn nhóm dịch vụ" });
            }
            /**Kiểm tra tồn tại */
            const exist = await Service.findById(formData._id);
            if(exist == null) {
                return res.status(200).json({ success: false, error: "Dịch vụ không tồn tại" });
            }
            //Xử lý
            await Service.updateOne(
                { _id: formData._id }, 
                {
                    $set: { 
                        code: formData.code ? formData.code : '', 
                        name: formData.name ? formData.name : '', 
                        groupId: formData.groupId ? formData.groupId : '',
                        price: formData.price ? parseFloat(formData.price) : parseFloat(0),
                        unit: formData.unit ? formData.unit : '',
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
            return res.status(400).json({ success: false, error: err });
        }
    },
    groupCreate: async(req, res) => {
        try{
            var formData = req.body;
            /** Kiểm tra điều kiện đầu vào */
            if(formData.code == null || formData.code == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập mã" });
            }
            if(formData.name == null || formData.name == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập tên nhóm dịch vụ" });
            }
            //Xử lý
            var exists = await ServiceGroup.findOne({ code: formData.code });
            if(exists == null){
                const newServiceGroup = await new ServiceGroup({
                    code: formData.code ? formData.code : '', 
                    name: formData.name ? formData.name : '', 
                    description: formData.description ? formData.description : '', 
                    isActive: formData.isActive,
                    createdAt: Date.now(),
                    createdBy: formData.createdBy ? formData.createdBy : ''
                });
                const data = await newServiceGroup.save();
                return res.status(200).json({ success: true, message: 'Tạo thành công', data: data });
            }
            else{
                return res.status(200).json({ success: false, error: 'Mã loại dịch vụ đã tồn tại' });
            }
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    groupGetByQuery: async(req, res) => {
        try{
            var filters = req.body.filters;
            var sorts = new Map([req.body.sorts.split("&&")]);
            var pages = req.body.pages;

            var data = await ServiceGroup.find({
                $and: [
                    { code: { $regex: filters.codeF, $options:"i" } },
                    { name: { $regex: filters.nameF, $options:"i" } },
                    { isActive: { $in: filters.statusF == null ? [true, false] : [filters.statusF] } }
                ]
            }).sort(sorts).limit(pages.size).skip(pages.from);

            var total = await ServiceGroup.find({
                $and: [
                    { code: { $regex: filters.codeF, $options:"i" } },
                    { name: { $regex: filters.nameF, $options:"i" } },
                    { isActive: { $in: filters.statusF == null ? [true, false] : [filters.statusF] } }
                ]
            }).count();

            return res.status(200).json({ success: true, data: data, total: total });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    groupGetById: async(req, res) => {
        try{
            const data = await ServiceGroup.findById(req.params.id);
            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    groupUpdate: async(req, res) => {
        try {
            var formData = req.body;
            /** Kiểm tra điều kiện đầu vào */
            if(formData.code == null || formData.code == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập mã dịch vụ" });
            }
            else{
                var exists = await ServiceGroup.findOne({ code: formData.code, _id: { $ne: formData._id } });
                if(exists != null){
                    return res.status(200).json({ success: false, error: 'Mã nhóm dịch vụ đã tồn tại' });
                }
            }
            if(formData.name == null || formData.name == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập tên dịch vụ" });
            }
            /**Kiểm tra tồn tại */
            const exist = await ServiceGroup.findById(formData._id);
            if(exist == null) {
                return res.status(200).json({ success: false, error: "Nhóm dịch vụ không tồn tại" });
            }
            //Xử lý
            await ServiceGroup.updateOne(
                { _id: formData._id }, 
                {
                    $set: { 
                        code: formData.code ? formData.code : '', 
                        name: formData.name ? formData.name : '', 
                        description: formData.description ? formData.description : '', 
                        isActive: formData.isActive,
                        updatedAt: Date.now(),
                        updatedBy: formData.updatedBy ? formData.updatedBy : ''
                    }
                }
            );
            var data = await ServiceGroup.findById(formData._id);
            return res.status(200).json({ success: true, message: 'Cập nhật thành công', data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
}

module.exports = ServiceController;