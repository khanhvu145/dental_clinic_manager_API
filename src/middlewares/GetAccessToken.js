const User = require('../models/tw_User');
const AccessGroup = require('../models/tw_AccessGroup');
const jwt = require('jsonwebtoken');
const IsNullOrEmpty = require('../helpers/IsNullOrEmpty');

module.exports = function GetAccessToken(page, role) {
    return async function(req, res, next){
        //Get auth header token
        const bearerHeader = req.headers['authorization'];
        if(typeof bearerHeader !== 'undefined'){
            //Split at the space
            const bearer = bearerHeader.split(' ');
            //Get token from array
            const bearerToken = bearer[1];
            //Get the token
            const user = await jwt.verify(bearerToken, 'secretKey');
            //Check access user
            if(user) {
                const userInfo = await User.findById(user.data._id);
                if(userInfo != null) {
                    const accessesGroup = await AccessGroup.findById(userInfo.accessId);
                    var valid = false;
                    if(accessesGroup != null && !IsNullOrEmpty(page) && !IsNullOrEmpty(role)){
                        const accesses = accessesGroup.accesses || [];
                        const values = [`${page}.all`, `${page}.${role}`];
                        if(
                            !!((accesses.filter(value => values.includes(value))).length > 0)
                        ){
                            valid = true;
                        }
                    }
                    //
                    if(valid) {
                        req.username = userInfo.username;
                        next();
                    }
                    else{
                        return res.status(403).json({ success: false, error: 'Not have access' });
                    }
                }
                else{
                    return res.status(403).json({ success: false, error: 'Not have access' });
                }
            }
            else{
                return res.status(403).json({ success: false, error: 'Not have access' });
            }
        }
        else{
            return res.status(403).json({ success: false, error: 'Invalid token' });
        }
    }
}