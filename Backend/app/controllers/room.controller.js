const Room = require('../models/room.model')

// Get list of rooms
async function getRooms (request, reply) {
    try {
        if (request.user) {
            const rooms = await Room.find()
            reply.status(200).send(rooms)
        } else {
            reply.status(401).send({ message: "Access denied due to invalid credentials." })
        }
    } catch (error) {
        reply.status(500).send(error)
    }
}

// Get a single room by ID
async function getRoomById (request, reply) {
    try {
        if (request.user) {
            const roomId = request.params.id
            const room = await Room.findById(roomId)
            if (!room) {
                reply.status(404).send({ message: "Room not found." })
                return
            }
            reply.status(200).send(room)
        } else {
            reply.status(401).send({ message: "Access denied due to invalid credentials." })
        }
    } catch (error) {
        reply.status(500).send(error)
    }
}

// Create a new room
async function createRoom(number, device){
    try {
        const name = "Room " + number
        const existingRoom = await Room.findOne({ name })
        if (existingRoom) {
            console.log("Room already exists.")
            return
        }
        const room = new Room({
            name,
            counter: 0,
            device
        })
        await room.save()
        console.log('Room: ', room)
    } catch (error) {
        console.error(error)
    }
}

// Update an existing room
async function updateRoom (request, reply) {
    try {
        const updates = request.body
        const roomId = request.params.id
        const room = await Room.findByIdAndUpdate(roomId, updates)
        if (!room) {
            reply.status(404).send({ message: "Room not found." })
            return
        }
        const roomToUpdate = await Room.findById(roomId)
        reply.status(200).send(roomToUpdate)
    } catch (error) {
        reply.status(500).send(error)
    }
}

// Delete an existing room
async function deleteRoom (request, reply) {
    try {
        const roomId = request.params.id
        const room = await Room.findByIdAndRemove(roomId)
        if (!room) {
            reply.status(404).send({ message: "Room not found." })
            return
        }
        reply.status(200).send({ message: "Room deleted successfully." })
    } catch (error) {
        reply.status(500).send(error)
    }
}

module.exports = {
    getRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
}