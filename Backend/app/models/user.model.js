const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    rut: {
        type: String,
        required: true,
        unique: true,
    },
    position: {
        type: String,
        required: true,
    },
    state: {
        type: Boolean,
        default: false,
    },
    roles: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
        },
    ],
})

module.exports = mongoose.model('User', userSchema)