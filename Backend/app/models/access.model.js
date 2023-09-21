const mongoose = require('mongoose')

const accessSchema = new mongoose.Schema({
    createdAt: {
        type: Date,
        required: true
    },
    entry:{
        type: Boolean,
        required: true
    }
})

module.exports = mongoose.model('Access', accessSchema)