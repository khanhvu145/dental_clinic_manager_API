const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;
const User = require('../models/tw_User');

const tw_Notification = new Schema({
    targetId: {
        type: Schema.Types.ObjectId, 
        required: true 
    },
    userId: {
        type: Schema.Types.ObjectId, 
        required: true 
    },
    username: {
        type: String, 
        required: true 
    },
    title: {
        type: String,
        required: true 
    },
    content: {
        type: String,
        required: true 
    },
    status: {
        type: String,
        required: true ,
        default: 'new'
    },
    type: {
        type: String,
        required: true 
    },
    createdAt: {
        type: Date,
    },
    createdBy: {
        type: String,
    },
    updatedAt: {
        type: Date,
    },
    updatedBy: {
        type: String,
    }
});

tw_Notification.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

//Thêm mới thông báo
tw_Notification.statics.CreateNotification = async function(targetId, userId, title, content, type, currUser, io){
    try{
        /**Xử lý */
        const _this = this;
        const user = await User.findById(userId);
        if(user){
            const newNotification = await new _this({
                targetId: targetId,
                userId: userId,
                username: user.username,
                title: title,
                content: content,
                type: type,
                status: 'new',
                createdAt: Date.now(),
                createdBy: currUser
            }).save();
            if(newNotification){
                if(io){
                    //Realtime socket
                    // console.log(req.app.get('socketio'));
                    // const io = req.app.get('socketio');
                    io.sockets.in(`_room${user.username}`).emit('notification', newNotification);
                }
            }
            return { code: 1, error: '', data: newNotification };
        }
        else{
            console.log('Không có thông tin user');
            return { code: -1, error: 'Không có thông tin user', data: {} };
        }
    }
    catch(err){
        console.log(err);
        return { code: 0, error: err, data: {} };
    }
};

//Cập nhật trạng thái đã xem
tw_Notification.statics.UpdateSeenStatus = async function(id, currUser){
    try{
        /**Xử lý */
        const _this = this;
        await _this.updateOne(
            { _id: id }, 
            {
                $set: { 
                    status: 'seen',
                    updatedAt: Date.now(),
                    updatedBy: currUser
                }
            }
        );
        var data = await _this.findById(id);
        return { code: 1, error: '', data: data };
    }
    catch(err){
        console.log(err);
        return { code: 0, error: err, data: {} };
    }
}

//Cập nhật trạng thái đã xem
tw_Notification.statics.UpdateSeenStatusAll = async function(currUser){
    try{
        /**Xử lý */
        const _this = this;
        const updated = await _this.updateMany(
            {
                userId: mongoose.Types.ObjectId(currUser._id) ,
                status: 'new'
            }, 
            {
                $set: { 
                    status: 'seen',
                    updatedAt: Date.now(),
                    updatedBy: currUser.username
                }
            }
        );
        
        return { code: 1, error: '', data: updated };
    }
    catch(err){
        console.log(err);
        return { code: 0, error: err, data: {} };
    }
}

module.exports = mongoose.model('tw_Notification', tw_Notification);