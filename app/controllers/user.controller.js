const User = require('../models/user.model')
const Role = require('../models/role.model')
var bcrypt = require("bcryptjs")

// Get a list of users
async function getUsers(request, reply) {
    try {
        const users = await User.find().populate('roles')
        reply.status(200).send(users)
    } catch (error) {
        reply.status(500).send('Server error')
    }
}

// Get a single user by ID
async function getUserById(request, reply) {
    try {
        const userId = request.params.id
        const user = await User.findById(userId).populate('roles')
        if (!user) {
            reply.status(404).send('User not found')
            return
        }
        reply.status(200).send(user)
    } catch (error) {
        reply.status(500).send('Server error')
    }
}

// Create a new user
async function createUser(request, reply) {
    try {
        const { name, email, password, rut, position } = request.body
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            reply.status(400).send('Email already exists')
            return
        }
        const user = new User({
            name,
            email,
            password: bcrypt.hashSync(password, 8),
            rut,
            position,
        })
        await user.save() //try and catch. async function and await
        reply.status(201).send(user)
    } catch (error) {
        reply.status(500).send('Server error')
    }
}

// Update an existing user
async function updateUser(request, reply) {
    try {
        const updates = request.body
        const userId = request.params.id
        const user = await User.findByIdAndUpdate(userId, updates)
        if (!user) {
            reply.status(404).send('User not found')
            return
        }
        const userToUpdate = await User.findById(userId)
        reply.status(200).send(userToUpdate)
    } catch (error) {
        reply.status(500).send('Server error')
    }
}

// Delete an existing user
async function deleteUser(request, reply) {
    try {
        const userId = request.params.id
        const user = await User.findByIdAndRemove(userId)
        if (!user) {
            reply.status(404).send('User not found')
            return
        }
        reply.status(200).send('User deleted successfully')
    } catch (error) {
        reply.status(500).send('Server error')
    }
}

async function searchUsers(request, reply) {
    try {
        const { name } = request.query
        const users = await User.find({ name: { $regex: name, $options: 'i' } }).populate('roles')
        reply.send(users)
    } catch (error) {
        reply.status(500).send('Server error')
    }
}

async function updateUserState(request, reply) {
    try {
        const user = await User.findById(request.params.id)
    if (!user) {
        reply.status(404).send('User not found')
        return
    }
    const { state } = request.body
    user.state = state
    await user.save()
    reply.send(user)
    } catch (error) {
        reply.status(500).send('Server error')
    }
}
  

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    searchUsers,
    updateUserState,
}
