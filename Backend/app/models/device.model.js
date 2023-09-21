const mongoose = require('mongoose')

const deviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    ipDirection: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    state: {
        type: Boolean,
        default: false
    }
})

const device = mongoose.model('Device', deviceSchema)
module.exports = { device, deviceSchema }