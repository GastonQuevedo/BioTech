const mongoose = require('mongoose')

const accessSchema = new mongoose.Schema({
    createdAt: {
        type: Date,
        required: true,
        default: Date.now()
    },
    entry:{
        type: Boolean,
        required: true
    }
})

module.exports = mongoose.model('Access', accessSchema)