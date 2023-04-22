const GeneralConfig = require('../models/tw_GeneralConfig');

const GeneralConfigController = {
    update: async(req, res) => {
        try{
            var formData = req.body;
            var type = formData[0].type;
            //Xử lý
            for(const item of formData){
                if(item._id != null){
                    await GeneralConfig.updateOne(
                        { _id: item._id }, 
                        {
                            $set: { 
                                type: item.type ? item.type : '', 
                                value: item.value ? item.value : '',
                                color: item.color ? item.color : '',
                                isActive: item.isActive,
                                updatedAt: Date.now(),
                                updatedBy: item.createdBy ? item.createdBy : ''
                            }
                        }
                    );
                }
                else{
                    var newItem = await new GeneralConfig({
                        type: item.type ? item.type : '', 
                        value: item.value ? item.value : '',
                        color: item.color ? item.color : '',
                        isActive: item.isActive,
                        createdAt: Date.now(),
                        createdBy: item.createdBy ? item.createdBy : ''
                    });
                    await newItem.save();
                }
            }

            var data = await GeneralConfig.find({ type: type }).sort({ isActive: -1 });

            return res.status(200).json({ success: true, message: 'Lưu thành công', data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getByQuery: async(req, res) => {
        try{
            var formData = req.body;
            var data = await GeneralConfig.find({
                $and: [
                    { type: { $regex: formData.type, $options:"i" } },
                    { isActive: { $in: formData.isActive == null ? [true, false] : formData.isActive } }
                ]
            }).sort({ isActive: -1 });
            var total = await GeneralConfig.find({
                $and: [
                    { type: { $regex: formData.type, $options:"i" } },
                    { isActive: { $in: [true, false] } }
                ]
            }).count();

            //Xử lý
            var dataObj = data.reduce((e, curr) => {
                e[curr.type] = e[curr.type] || [];
                e[curr.type].push(curr);
                return e;
            }, Object.create(null));

            return res.status(200).json({ success: true, data: dataObj, total: total });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    }
}

module.exports = GeneralConfigController;

