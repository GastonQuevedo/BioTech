const User = require('../models/user.model')
const Role = require('../models/role.model')
var bcrypt = require("bcryptjs")

// Get a list of users
async function getUsers(request, reply) {
    try {
        const users = await User.find().populate('roles')
        reply.status(200).send(users)
    } catch (error) {
        reply.status(500).send(error)
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
        reply.status(500).send(error)
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
        if (request.body.roles) {
            const roles = await Role.find({ name: { $in: request.body.roles }})
            user.roles = roles.map(role => role._id)
        } else {
            const role = await Role.findOne({ name: "user" })
            user.roles = [role._id]
        }
        await user.save()
        reply.status(201).send(user)
    } catch (error) {
        reply.status(500).send(error)
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
        reply.status(500).send(error)
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
        reply.status(500).send(error)
    }
}

// Get a list of users that contain the name/email/rut searched
async function searchUsers(request, reply) {
    try {
        var nameRegex = {"$regex": new RegExp('^' + request.params.name.toLowerCase(),  'i')}
        const users = await User.find({$or: [
            { name: nameRegex },
            { email: nameRegex },
            { rut: nameRegex }
        ]})
        reply.status(200).send(users)
    } catch (error) {
        reply.status(500).send(error)
    }
}

// Change the state of an existing user
async function updateUserState(request, reply) {
    try {
        const userId = request.params.id
        const user = await User.findByIdAndUpdate(userId, [{$set:{state:{$eq:[false,"$state"]}}}])
    if (!user) {
        reply.status(404).send('User not found')
        return
    }
    const userToUpdate = await User.findById(userId)
    reply.status(200).send(userToUpdate)
    } catch (error) {
        reply.status(500).send(error)
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
