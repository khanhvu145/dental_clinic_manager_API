const User = require('../models/tw_User');
const moment = require('moment');

const ReportController = {
    getOverviewReport: async(req, res) => {
        try{
            var query = req.body;
            if(query.typeF == 'day'){
                
            }
            else if(query.typeF == 'month'){

            }
            else if(query.typeF == 'year'){
                
            }
            else{
                return res.status(200).json({ success: false, error: "Loại không hợp lệ" });
            }
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    }
}

module.exports = ReportController;