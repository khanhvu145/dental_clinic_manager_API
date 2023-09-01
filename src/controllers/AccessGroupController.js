const AccessGroup = require('../models/tw_AccessGroup');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const ADMIN_ACCESS_ID = process.env.ADMIN_ACCESS_ID;

const AccessGroupController = {
    create: async(req, res) => {
        try{
            var formData = req.body;
            /** Kiểm tra điều kiện đầu vào */
            if(formData.name == null || formData.name == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập tên nhóm người dùng" });
            }
            // if(formData.accesses.length == 0){
            //     return res.status(200).json({ success: false, error: "Hãy phân quyền nhóm người dùng" });
            // }
            //Xử lý
            var exists = await AccessGroup.findOne({ name: formData.name });
            if(exists == null) {
                const newAccessGroup = await new AccessGroup({
                    name: formData.name ? formData.name : '', 
                    note: formData.note ? formData.note : '',
                    accesses: formData.accesses ? formData.accesses : [],
                    isActive: formData.isActive,
                    createdAt: Date.now(),
                    createdBy: req.username ? req.username : ''
                });
                const data = await newAccessGroup.save();
                return res.status(200).json({ success: true, message: 'Tạo thành công', data: data });
            }
            else{
                return res.status(200).json({ success: false, error: 'Nhóm người dùng này đã có' });
            }
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getById: async(req, res) => {
        try{
            const data = await AccessGroup.findById(req.params.id);
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
            if(formData.name == null || formData.name == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập tên nhóm người dùng" });
            }
            // if(formData.accesses.length == 0){
            //     return res.status(200).json({ success: false, error: "Hãy phân quyền nhóm người dùng" });
            // }
            /**Kiểm tra tồn tại */
            const exist = await AccessGroup.findById(formData._id);
            if(exist == null) {
                return res.status(200).json({ success: false, error: "Nhóm người dùng không tồn tại" });
            }
            /** Không cho phép chỉnh sửa quyền admin */
            if(mongoose.Types.ObjectId(formData._id).equals(mongoose.Types.ObjectId(ADMIN_ACCESS_ID))){
                return res.status(200).json({ success: false, error: "Không cho phép chỉnh sửa quyền Administrator mặc định." });
            }
            //Xử lý
            await AccessGroup.updateOne(
                { _id: formData._id }, 
                {
                    $set: { 
                        name: formData.name ? formData.name : '', 
                        note: formData.note ? formData.note : '',
                        accesses: formData.accesses ? formData.accesses : [],
                        isActive: formData.isActive,
                        updatedAt: Date.now(),
                        updatedBy: req.username ? req.username : ''
                    }
                }
            );
            var data = await AccessGroup.findById(formData._id);
            return res.status(200).json({ success: true, message: 'Cập nhật thành công', data: data });
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

            var data = await AccessGroup.find({
                $and: [
                    { name: { $regex: filters.nameF, $options:"i" } },
                    { isActive: { $in: filters.statusF == null ? [true, false] : [filters.statusF] } }
                ]
            }).sort(sorts).limit(pages.size).skip(pages.from);

            var total = await AccessGroup.find({
                $and: [
                    { name: { $regex: filters.nameF, $options:"i" } },
                    { isActive: { $in: filters.statusF == null ? [true, false] : [filters.statusF] } }
                ]
            }).count();
            
            return res.status(200).json({ success: true, data: data, total: total });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    }
}

module.exports = AccessGroupController;