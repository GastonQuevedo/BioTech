const mongoose = require('mongoose')
const DeviceSchema = require("./device.model").DeviceSchema

const roomSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    counter:{
        type: Number,
        default: 0
    },
    device: DeviceSchema,
    access: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Access'
        }
    ]
})

module.exports = mongoose.model('Room', roomSchema)