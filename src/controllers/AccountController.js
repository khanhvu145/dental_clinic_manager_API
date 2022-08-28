const User = require('../models/tw_User');
const AccessGroup = require('../models/tw_AccessGroup');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);

const AccountController = {
    login: async(req, res) => {
        try {
            //Kiểm tra đầu vào
            if(req.body.username == '' || req.body.password == ''){
                return res.status(200).json({ success: false, error: 'Hãy điền đầy đủ thông tin'});
            }

            const user = await User.findOne({ username: req.body.username });
            //Kiểm tra trạng thái hoạt động của tài khoản
            if(!user.isActive){
                return res.status(200).json({ success: false, error: 'Tài khoản đã ngưng hoạt động', data: '' });
            }

            var data = {
                _id: user._id,
                username: user.username,
                name: user.name, 
                physicalId: user.physicalId,
                dateOfIssue: user.dateOfIssue,
                placeOfIssue: user.placeOfIssue,
                email: user.email,
                phone: user.phone,
                birthday: user.birthday,
                gender: user.gender,
                "address.building": user.address.building,
                "address.wardId": parseInt(user.address.wardId, 10),
                "address.districtId": parseInt(user.address.districtId, 10),
                "address.provinceId": parseInt(user.address.provinceId, 10),
                img: user.img,
                imageFile: null,
                accessId: user.accessId,
                isActive: user.isActive,
            };
            var token = jwt.sign({data}, 'secretKey');

            if(user && bcrypt.compareSync(req.body.password, user.password)){
                return res.status(200).json({ success: true, message: 'Đăng nhập thành công', data: { token: token } });
            }
            else{
                return res.status(200).json({ success: false, error: 'Tài khoản hoặc mật khẩu không đúng', data: '' });
            }
        }catch(err){
            return res.status(500).json({ success: false, error: err });
        }
    },
    info: async (req, res) => {
        try{
            var data = await jwt.verify(req.token, 'secretKey');
            const accessesGroup = await AccessGroup.findById(data.data.accessId);
            var accesses = accessesGroup.accesses;
            data.data.accesses = (accesses.length > 0) ? accesses : [];

            return res.status(200).json({ success: true, data: data });
        }catch(err){
            return res.status(500).json({success: false, error: err});
        }
    }
}

module.exports = AccountController;