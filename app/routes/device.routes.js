const deviceController = require('../controllers/device.controller')

async function deviceRoutes(fastify, options) {
    fastify.get('/', deviceController.getDevices)
    fastify.get('/:id', deviceController.getDeviceById)
    fastify.post('/', deviceController.createDevice)
    fastify.put('/:id', deviceController.updateDevice)
    fastify.delete('/:id', deviceController.deleteDevice)
}

module.exports = deviceRoutes