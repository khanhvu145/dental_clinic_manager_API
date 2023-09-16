const User = require('../models/tw_User');
const AccessGroup = require('../models/tw_AccessGroup');
const jwt = require('jsonwebtoken');
const IsNullOrEmpty = require('../helpers/IsNullOrEmpty');

module.exports = async function verifyToken(req, res, next) {
    //Get auth header token
    const bearerHeader = req.headers['authorization'];
    //Check if bearer is undefined
    if(typeof bearerHeader !== 'undefined'){
        //Split at the space
        const bearer = bearerHeader.split(' ');
        //Get token from array
        const bearerToken = bearer[1];
        //Get the token
        const user = await jwt.verify(bearerToken, 'secretKey');
        if(user){
            const userInfo = await User.findById(user.data._id);
            if(userInfo != null) {
                //Set the token
                req.token = bearerToken;
                //Next middleware
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
        return res.status(403).json({ success: false, error: 'Invalid token' });
    }
}