const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const tw_AppointmentConfig = new Schema({
    workingTime: { 
        type: Object,
        properties: { 
            apply: { 
                type: Boolean,
                required: true,
            },
            timeAM: { 
                type: Object,
                properties: { 
                    timeFrom: {
                        type: String,
                        required: true,
                    },
                    timeTo: {
                        type: String,
                        required: true,
                    }
                }
            },
            timePM: { 
                type: Object,
                properties: { 
                    timeFrom: {
                        type: String,
                        required: true,
                    },
                    timeTo: {
                        type: String,
                        required: true,
                    }
                }
            },
            dayOfWeek: {
                type: Array,
                required: true,
            }
        }
    },
    autoRemind: {
        type: Object,
        properties: {
            apply: { 
                type: Boolean,
                required: true,
            },
            repeat: { 
                type: Boolean,
                required: true,
            },
            duration: {
                type: Schema.Types.Number,
                required: true,
            },
            time: {
                type: Date,
                required: true,
            },
            type: {
                type: String,
                required: true,
            },
        }
    },
    autoCancel: {
        type: Object,
        properties: {
            apply: { 
                type: Boolean,
                required: true,
            },
            duration: {
                type: Schema.Types.Number,
                required: true,
            },
            type: {
                type: String,
                required: true,
            },
            notification: { 
                type: Boolean,
                required: true,
            },
            notificationType: {
                type: String,
                required: true,
            },
        }
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

tw_AppointmentConfig.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

module.exports = mongoose.model('tw_AppointmentConfig', tw_AppointmentConfig);