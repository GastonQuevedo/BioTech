const Device = require('../models/device.model').device
const User = require('../models/user.model')
const Room = require('../models/room.model')
const roomController = require('./room.controller')

/** if (request.user) {
    const myUser = await User.findOne({ email: request.user.email }).populate("roles", "-__v")
    if (myUser.roles[0].name == "admin") {
        HERE
    } else {
        reply.status(403).send({ message: "You do not have permission to access this resource." })
    }
} else {
    reply.status(401).send({ message: "Access denied due to invalid credentials." })
}**/

// Get list of devices
async function getDevices (request, reply) {
    try {
        if (request.user) {
            const myUser = await User.findOne({ email: request.user.email }).populate("roles", "-__v")
            if (myUser.roles[0].name == "admin") {
                const devices = await Device.find()
                reply.status(200).send(devices)
            } else {
                reply.status(403).send({ message: "You do not have permission to access this resource." })
            }
        } else {
            reply.status(401).send({ message: "Access denied due to invalid credentials." })
        }
    } catch (error) {
        reply.status(500).send(error)
    }
}

// Get a single device by ID
async function getDeviceById (request, reply) {
    try {
        if (request.user) {
            const myUser = await User.findOne({ email: request.user.email }).populate("roles", "-__v")
            if (myUser.roles[0].name == "admin") {
                const deviceId = request.params.id
                const device = await Device.findById(deviceId)
                if (!device) {
                    reply.status(404).send({ message: "Device not found." })
                    return
                }
                reply.status(200).send(device)
            } else {
                reply.status(403).send({ message: "You do not have permission to access this resource." })
            }
        } else {
            reply.status(401).send({ message: "Access denied due to invalid credentials." })
        }
    } catch (error) {
        reply.status(500).send(error)
    }
}

// Create a new device
async function createDevice(request, reply){
    try {
        if (request.user) {
            const myUser = await User.findOne({ email: request.user.email }).populate("roles", "-__v")
            if (myUser.roles[0].name == "admin") {
                const { name, model, ipDirection, location } = request.body
                const existingDevice = await Device.findOne({ ipDirection })
                if (existingDevice) {
                    reply.status(400).send({ message: "Device already exists." })
                    return
                }
                const device = new Device({
                    name,
                    model,
                    ipDirection,
                    location,
                })
                await device.save()
                const rooms = await Room.find()
                roomController.createRoom(rooms.length+1, device)
                reply.status(201).send(device)
            } else {
                reply.status(403).send({ message: "You do not have permission to access this resource." })
            }
        } else {
            reply.status(401).send({ message: "Access denied due to invalid credentials." })
        }
    } catch (error) {
        reply.status(500).send(error)
    }
}

// Update an existing device
async function updateDevice (request, reply) {
    try {
        if (request.user) {
            const myUser = await User.findOne({ email: request.user.email }).populate("roles", "-__v")
            if (myUser.roles[0].name == "admin") {
                const updates = request.body
                const deviceId = request.params.id
                const device = await Device.findByIdAndUpdate(deviceId, updates)
                if (!device) {
                    reply.status(404).send({ message: "Device not found." })
                    return
                }
                const deviceToUpdate = await Device.findById(deviceId)
                reply.status(200).send(deviceToUpdate)
            } else {
                reply.status(403).send({ message: "You do not have permission to access this resource." })
            }
        } else {
            reply.status(401).send({ message: "Access denied due to invalid credentials." })
        }
    } catch (error) {
        reply.status(500).send(error)
    }
}

// Delete an existing device
async function deleteDevice (request, reply) {
    try {
        if (request.user) {
            const myUser = await User.findOne({ email: request.user.email }).populate("roles", "-__v")
            if (myUser.roles[0].name == "admin") {
                const deviceId = request.params.id
                const device = await Device.findByIdAndRemove(deviceId)
                const room = await Room.findOneAndDelete({ device: device })
                if (!device || !room) {
                    reply.status(404).send({ message: "Device/Room not found." })
                    return
                }
                reply.status(200).send({ message: "Device and Room deleted successfully." })
            } else {
                reply.status(403).send({ message: "You do not have permission to access this resource." })
            }
        } else {
            reply.status(401).send({ message: "Access denied due to invalid credentials." })
        }
    } catch (error) {
        reply.status(500).send(error)
    }
}

module.exports = {
    getDevices,
    getDeviceById,
    createDevice,
    updateDevice,
    deleteDevice,
}