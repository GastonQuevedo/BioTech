const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    rut: {
        type: String,
        required: false,
        default: '',
        unique: true
    },
    position: {
        type: String,
        required: false,
        default: ''
    },
    state: {
        type: Boolean,
        default: false
    },
    roles: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role'
        }
    ],
    googleId: {
        type: String,
        required: false
    },
    access: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Access'
        }
    ]
})

module.exports = mongoose.model('User', userSchema)