const User = require('../models/tw_User');
const models = require('../models/tw_Appointment_Booking');
const Appointment = models.AppointmentModel;
const tw_Customer = require('../models/tw_Customer');
const Customer = tw_Customer.CustomerModel;
const Examination = require('../models/tw_Examination');
const Payment = require('../models/tw_Payment');
const PaymentSlip = require('../models/tw_PaymentSlip');
const Receipts = require('../models/tw_Receipts');
const Service = require('../models/tw_Service');
const ServiceGroup = require('../models/tw_ServiceGroup');
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
    getRevenueExpenditureReport: async(req, res) => {
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
    getDebtReport: async(req, res) => {
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
                //Đã thu
                var paidAmount = await Payment.aggregate([
                    { $match: { 
                        $and: [
                            { createdAt: { $gte: dateFromF } },
                            { createdAt: { $lte: dateToF } }
                        ]
                    }},
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: "$paidAmount" }
                        }
                    }
                ]);
                //Còn nợ
                var remainAmount = await Payment.aggregate([
                    { $match: { 
                        $and: [
                            { createdAt: { $gte: dateFromF } },
                            { createdAt: { $lte: dateToF } }
                        ]
                    }},
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: "$remainAmount" }
                        }
                    }
                ]);
                //Giảm giá
                var discountAmount = await Examination.aggregate([
                    { $match: { 
                        $and: [
                            { completedAt: { $gte: dateFromF } },
                            { completedAt: { $lte: dateToF } },
                            { status: 'completed' },
                        ]
                    }},
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: "$totalDiscountAmount" }
                        }
                    }
                ]);

                return res.status(200).json({ 
                    success: true, 
                    data: [
                        {
                            label: 'Đã thu',
                            value: (paidAmount && paidAmount.length > 0) ? paidAmount[0].totalAmount : 0
                        },
                        {
                            label: 'Còn nợ',
                            value: (remainAmount && remainAmount.length > 0) ? remainAmount[0].totalAmount : 0
                        },
                        {
                            label: 'Giảm giá',
                            value: (discountAmount && discountAmount.length > 0) ? discountAmount[0].totalAmount : 0
                        },
                    ]
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
    getAppointmentReport: async(req, res) => {
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
                //Hoàn thành
                var completedData = await Appointment.aggregate([
                    { $match: { 
                        $and: [
                            { dateTimeFrom: { $gte: dateFromF } },
                            { dateTimeFrom: { $lte: dateToF } },
                            { status: 'completed' },
                        ]
                    }},
                    { $count: "count" }
                ]);
                //Không đến
                var notArrivedData = await Appointment.aggregate([
                    { $match: { 
                        $and: [
                            { dateTimeFrom: { $gte: dateFromF } },
                            { dateTimeFrom: { $lte: dateToF } },
                            { status: 'notarrived' },
                        ]
                    }},
                    { $count: "count" }
                ]);
                //Đã hủy
                var cancelledData = await Appointment.aggregate([
                    { $match: { 
                        $and: [
                            { dateTimeFrom: { $gte: dateFromF } },
                            { dateTimeFrom: { $lte: dateToF } },
                            { status: 'cancelled' },
                        ]
                    }},
                    { $count: "count" }
                ]);

                return res.status(200).json({ 
                    success: true, 
                    data: [
                        {
                            label: 'Hoàn thành',
                            value: (completedData && completedData.length > 0) ? completedData[0].count : 0
                        },
                        {
                            label: 'Không đến',
                            value: (notArrivedData && notArrivedData.length > 0) ? notArrivedData[0].count : 0
                        },
                        {
                            label: 'Đã hủy',
                            value: (cancelledData && cancelledData.length > 0) ? cancelledData[0].count : 0
                        },
                    ]
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
    getExaminationReport: async(req, res) => {
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
                            count: 0
                        });
                        from = moment(from).add(1, 'd');
                    }
                    else if(query.typeF == 'month'){
                        data.push({
                            label: moment(from).format('MM/YYYY').toString(),
                            count: 0
                        });
                        from = moment(from).add(1, 'M');
                    }
                    else if(query.typeF == 'year'){
                        data.push({
                            label: moment(from).format('YYYY').toString(),
                            count: 0
                        });
                        from = moment(from).add(1, 'y');
                    }
                } while (moment(moment(from).format('YYYY-MM-DD')).isSameOrBefore(moment(to).format('YYYY-MM-DD')));
                //#endregion

                //#region Lấy dữ liệu
                var examinationData = await Examination.aggregate([
                    { $match: { 
                        $and: [
                            { completedAt: { $gte: dateFromF } },
                            { completedAt: { $lte: dateToF } },
                            { status: 'completed' },
                        ]
                    }},
                    {
                        $group: {
                            _id: { $dateToString: { 
                                format: query.typeF == 'month' ? "%m/%Y" : query.typeF == 'year' ? '%Y' : '%d/%m/%Y', 
                                date: "$completedAt" 
                            }},
                            count: { $sum: 1 }
                        }
                    }
                ]);
                //#endregion

                data = data.map(item => {
                    var dataItem = examinationData.find(e => e._id == item.label);
                    return {
                        ...item,
                        count: dataItem ? dataItem.count : 0
                    }
                });

                return res.status(200).json({ 
                    success: true, 
                    data: data
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
    getServiceGroupReport: async(req, res) => {
        try{
            var query = req.body;
            var dateFromF = null;
            var dateToF = null;
            var data = [];
            var reportData = [];
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
                var serviceGroupData = await ServiceGroup.find({ isActive: true });
                //Nhóm dịch vụ theo phiếu khám
                var examinationData = await Examination.aggregate([
                    { $match: { 
                        $and: [
                            { completedAt: { $gte: dateFromF } },
                            { completedAt: { $lte: dateToF } },
                            { status: 'completed' },
                        ]
                    }}
                ]);

                if(examinationData && examinationData.length > 0){
                    examinationData.forEach((item) => {
                        data.push(...item.diagnosisTreatment);
                    });
                }

                //#region Lấy dữ liệu
                serviceGroupData.forEach((item) => {
                    var count = data.filter((e) => e.serviceGroupId.equals(item._id)).length;
                    reportData.push({
                        label: item.name,
                        count: count || 0
                    });
                });

                return res.status(200).json({ 
                    success: true, 
                    data: reportData
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
    getDentistReport: async(req, res) => {
        try{
            var query = req.body;
            var dateFromF = null;
            var dateToF = null;
            var reportData = [];
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
                var dentistData = await User.find({ isActive: true, isDentist: true });

                var examinationData = await Examination.aggregate([
                    { $match: { 
                        $and: [
                            { completedAt: { $gte: dateFromF } },
                            { completedAt: { $lte: dateToF } },
                            { status: 'completed' },
                        ]
                    }},
                    {
                        $group: {
                            _id: "$dentistId",
                            count: { $sum: 1 }
                        }
                    }
                ]);

                //#region Lấy dữ liệu
                dentistData.forEach((item) => {
                    var data = examinationData.find((e) => e._id.equals(item._id));
                    reportData.push({
                        label: item.name,
                        count: data ? (data.count || 0) : 0
                    });
                });

                return res.status(200).json({ 
                    success: true, 
                    data: reportData
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
    getServiceReport: async(req, res) => {
        try{
            var query = req.body;
            var dateFromF = null;
            var dateToF = null;
            var data = [];
            var reportData = [];
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
                var serviceData = await Service.find({ isActive: true, groupId: query.groupId });
                //Dịch vụ theo phiếu khám
                var examinationData = await Examination.aggregate([
                    { $match: { 
                        $and: [
                            { completedAt: { $gte: dateFromF } },
                            { completedAt: { $lte: dateToF } },
                            { status: 'completed' }
                        ]
                    }}
                ]);

                if(examinationData && examinationData.length > 0){
                    examinationData.forEach((item) => {
                        data.push(...item.diagnosisTreatment);
                    });
                }

                //#region Lấy dữ liệu
                serviceData.forEach((item) => {
                    var count = data.filter((e) => e.serviceId.equals(item._id) && e.serviceGroupId.equals(item.groupId)).length;
                    reportData.push({
                        label: item.name,
                        count: count || 0
                    });
                });

                return res.status(200).json({ 
                    success: true, 
                    data: reportData
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
    getAgeGroupReport: async(req, res) => {
        try{
            var query = req.body;
            var dateFromF = null;
            var dateToF = null;
            var data = [
                {
                    label: '1 - 12',
                    min: 1,
                    max: 12,
                    backgroundColor: 'rgba(3, 138, 255)',
                    count: 0
                },
                {
                    label: '13 - 24',
                    min: 13,
                    max: 24,
                    backgroundColor: 'rgba(251, 192, 147)',
                    count: 0
                },
                {
                    label: '25 - 36',
                    min: 25,
                    max: 36,
                    backgroundColor: 'rgba(3, 138, 255)',
                    count: 0
                },
                {
                    label: '37 - 48',
                    min: 37,
                    max: 48,
                    count: 0
                },
                {
                    label: '49 - 60',
                    min: 49,
                    max: 60,
                    count: 0
                },
                {
                    label: 'Trên 60',
                    min: 61,
                    max: 99999,
                    count: 0
                },
            ];
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
                var customerData = await Customer.aggregate([
                    { $match: { 
                        $and: [
                            { createdAt: { $gte: dateFromF } },
                            { createdAt: { $lte: dateToF } },
                            { isActive: true },
                        ]
                    }}
                ]);

                //#region Lấy dữ liệu
                data = data.map(item => {
                    var customers = customerData.filter((e) => {
                        var dateString = moment(e.birthday).format('YYYY-MM-DD');
                        var age = moment().diff(dateString, 'years');
                        return age >= item.min && age <= item.max;
                    });
                    return {
                        ...item,
                        count: customers ? customers.length : 0
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
    }
}

module.exports = ReportController;