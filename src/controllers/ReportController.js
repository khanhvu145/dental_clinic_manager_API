const User = require('../models/tw_User');
const models = require('../models/tw_Appointment_Booking');
const Appointment = models.AppointmentModel;
const tw_Customer = require('../models/tw_Customer');
const Customer = tw_Customer.CustomerModel;
const Examination = require('../models/tw_Examination');
const Payment = require('../models/tw_Payment');
const PaymentSlip = require('../models/tw_PaymentSlip');
const Receipts = require('../models/tw_Receipts');
const moment = require('moment');
const IsNullOrEmpty = require('../helpers/IsNullOrEmpty');

const ReportController = {
    getOverviewReport: async(req, res) => {
        try{
            var query = req.body;
            var dateFromF = null;
            var dateToF = null;
            //#region Xét thời gian theo loại
            if(query.typeF == 'day'){
                if(query.dateF == null || query.dateF == '' || query.dateF.length <= 0){
                    return res.status(200).json({ success: false, error: "Hãy nhập thời gian" });
                }
                //Xét thời gian
                dateFromF = new Date(new Date(moment(query.dateF[0]).format('YYYY/MM/DD')).setHours(0,0,0,0));
                dateToF = new Date(new Date(moment(query.dateF[1]).format('YYYY/MM/DD')).setHours(23,59,0,0));
            }
            else if(query.typeF == 'month'){
                if(query.monthF == null || query.monthF == '' || query.monthF.length <= 0){
                    return res.status(200).json({ success: false, error: "Hãy nhập thời gian" });
                }
                //Xét thời gian
                dateFromF = new Date(moment(query.monthF[0]).startOf('month').toDate());
                dateToF = new Date(moment(query.monthF[1]).endOf('month').toDate());

            }
            else if(query.typeF == 'year'){
                if(query.yearF == null || query.yearF == '' || query.yearF.length <= 0){
                    return res.status(200).json({ success: false, error: "Hãy nhập thời gian" });
                }
                dateFromF = new Date(moment(query.yearF[0]).startOf('year').toDate());
                dateToF = new Date(moment(query.yearF[1]).endOf('year').toDate());
            }
            else{
                return res.status(200).json({ success: false, error: "Loại không hợp lệ" });
            }
            //#endregion
            if(dateFromF && dateToF){
                //#region Lấy dữ liệu
                //Tổng doanh thu
                var revenue = await Receipts.aggregate([
                    { $match: { 
                        $and: [
                            { createdAt: { $gte: dateFromF } },
                            { createdAt: { $lte: dateToF } },
                            { status: 'paid' },
                        ]
                    }},
                    {
                        $group: {
                            _id: null,
                            total : { $sum: "$amount" }
                        }
                    }
                ]);
                //Tổng số cuộc hẹn
                var appointment = await Appointment.aggregate([
                    { $match: { 
                        $and: [
                            { createdAt: { $gte: dateFromF } },
                            { createdAt: { $lte: dateToF } },
                            // { status: { $ne: '' } },
                        ]
                    }},
                    { $count: "count" }
                ]);
                //Tổng khách hàng mới
                var customer = await Customer.aggregate([
                    { $match: { 
                        $and: [
                            { createdAt: { $gte: dateFromF } },
                            { createdAt: { $lte: dateToF } },
                            // { status: { $ne: '' } },
                        ]
                    }},
                    { $count: "count" }
                ]);
                //#endregion

                return res.status(200).json({ 
                    success: true, 
                    data: {
                        revenue: (revenue && revenue.length > 0) ? revenue[0].total : 0, 
                        appointment: (appointment && appointment.length > 0) ? appointment[0].count : 0,
                        customer: (customer && customer.length > 0) ? customer[0].count : 0,
                    }
                });
            }
            else{
                return res.status(200).json({ success: false, error: "Có lỗi xảy ra" });
            }
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getRevenueExpenditure: async(req, res) => {
        try{
            var query = req.body;
            var dateFromF = null;
            var dateToF = null;
            var data = [];
            //#region Xét thời gian theo loại
            if(query.typeF == 'day'){
                if(query.dateF == null || query.dateF == '' || query.dateF.length <= 0){
                    return res.status(200).json({ success: false, error: "Hãy nhập thời gian" });
                }
                //Xét thời gian
                dateFromF = new Date(new Date(moment(query.dateF[0]).format('YYYY/MM/DD')).setHours(0,0,0,0));
                dateToF = new Date(new Date(moment(query.dateF[1]).format('YYYY/MM/DD')).setHours(23,59,0,0));
            }
            else if(query.typeF == 'month'){
                if(query.monthF == null || query.monthF == '' || query.monthF.length <= 0){
                    return res.status(200).json({ success: false, error: "Hãy nhập thời gian" });
                }
                //Xét thời gian
                dateFromF = new Date(moment(query.monthF[0]).startOf('month').toDate());
                dateToF = new Date(moment(query.monthF[1]).endOf('month').toDate());

            }
            else if(query.typeF == 'year'){
                if(query.yearF == null || query.yearF == '' || query.yearF.length <= 0){
                    return res.status(200).json({ success: false, error: "Hãy nhập thời gian" });
                }
                dateFromF = new Date(moment(query.yearF[0]).startOf('year').toDate());
                dateToF = new Date(moment(query.yearF[1]).endOf('year').toDate());
            }
            else{
                return res.status(200).json({ success: false, error: "Loại không hợp lệ" });
            }
            //#endregion
        
            if(dateFromF && dateToF){
                //#region Xét label data
                var from = dateFromF;
                var to = dateToF;
                do {
                    if(query.typeF == 'day'){
                        data.push({
                            label: moment(from).format('DD/MM/YYYY').toString(),
                            revenue: 0,
                            expenditure: 0,
                        });
                        from = moment(from).add(1, 'd');
                    }
                    else if(query.typeF == 'month'){
                        data.push({
                            label: moment(from).format('MM/YYYY').toString(),
                            revenue: 0,
                            expenditure: 0,
                        });
                        from = moment(from).add(1, 'M');
                    }
                    else if(query.typeF == 'year'){
                        data.push({
                            label: moment(from).format('YYYY').toString(),
                            revenue: 0,
                            expenditure: 0,
                        });
                        from = moment(from).add(1, 'y');
                    }
                } while (moment(moment(from).format('YYYY-MM-DD')).isSameOrBefore(moment(to).format('YYYY-MM-DD')));
                //#endregion

                //#region Lấy dữ liệu
                //Doanh thu
                var revenue = await Receipts.aggregate([
                    { $match: { 
                        $and: [
                            { createdAt: { $gte: dateFromF } },
                            { createdAt: { $lte: dateToF } },
                            { status: 'paid' },
                        ]
                    }},
                    {
                        $group: {
                            _id: { $dateToString: { 
                                format: query.typeF == 'month' ? "%m/%Y" : query.typeF == 'year' ? '%Y' : '%d/%m/%Y', 
                                date: "$createdAt" 
                            }},
                            totalAmount: { $sum: "$amount" }
                        }
                    }
                ]);
                //Chi phí
                var expenditure = await PaymentSlip.aggregate([
                    { $match: { 
                        $and: [
                            { date: { $gte: dateFromF } },
                            { date: { $lte: dateToF } },
                            { status: 'completed' },
                        ]
                    }},
                    {
                        $group: {
                            _id: { $dateToString: { 
                                format: query.typeF == 'month' ? "%m/%Y" : query.typeF == 'year' ? '%Y' : '%d/%m/%Y', 
                                date: "$date" 
                            }},
                            totalAmount: { $sum: "$amount" }
                        }
                    }
                ]);

                data = data.map(item => {
                    var revenueItem = revenue.find(e => e._id == item.label);
                    var expenditureItem = expenditure.find(e => e._id == item.label);
                    return {
                        ...item,
                        revenue: revenueItem ? revenueItem.totalAmount : 0,
                        expenditure: expenditureItem ? expenditureItem.totalAmount : 0
                    }
                });

                return res.status(200).json({ 
                    success: true, 
                    data: data
                });
                //#endregion
            }
            else{
                return res.status(200).json({ success: false, error: "Có lỗi xảy ra" });
            }
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
}

module.exports = ReportController;