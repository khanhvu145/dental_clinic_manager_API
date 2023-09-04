

const AppointmentBookingController = {
    create: async(req, res) => {
        try{

        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    }
}

module.exports = AppointmentBookingController;