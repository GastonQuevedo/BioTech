const Device = require('../models/device.model')

// Get list of devices
async function getDevices (request, reply) {
    try {
        const devices = await Device.find()
        reply.status(200).send(devices)
    } catch (error) {
        reply.status(500).send(error)
    }
}

// Get a single device by ID
async function getDeviceById (request, reply) {
    try {
        const deviceId = request.params.id
        const device = await Device.findById(deviceId)
        if (!device) {
            reply.status(404).send('Device not found')
            return
        }
        reply.status(200).send(device)
    } catch (error) {
        reply.status(500).send(error)
    }
}

// Create a new device
async function createDevice(request, reply){
    try {
        const { name, model, ipDirection, location } = request.body
        const existingDevice = await Device.findOne({ ipDirection })
        if (existingDevice) {
            reply.status(400).send('Device already exists')
            return
        }
        const device = new Device({
            name,
            model,
            ipDirection,
            location,
        })
        await device.save()
        reply.status(201).send(device)
    } catch (error) {
        reply.status(500).send(error)
    }
}

// Update an existing device
async function updateDevice (request, reply) {
    try {
        const updates = request.body
        const deviceId = request.params.id
        const device = await Device.findByIdAndUpdate(deviceId, updates)
        if (!device) {
            reply.status(404).send('Device not found')
            return
        }
        const deviceToUpdate = await Device.findById(deviceId)
        reply.status(200).send(deviceToUpdate)
    } catch (error) {
        reply.status(500).send(error)
    }
}

// Delete an existing device
async function deleteDevice (request, reply) {
    try {
        const deviceId = request.params.id
        const device = await Device.findByIdAndRemove(deviceId)
        if (!device) {
            reply.status(404).send('Device not found')
            return
        }
        reply.status(200).send('Device deleted successfully')
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