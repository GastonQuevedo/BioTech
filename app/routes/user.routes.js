const userController = require('../controllers/user.controller')
const userSchema = require('../models/user.model')

async function userRoutes(fastify, options) {
    fastify.get('/', userController.getUsers)
    fastify.get('/:id', userController.getUserById)
    fastify.post('/', { schema: userSchema.createSchema }, userController.createUser)
    fastify.put('/:id', { schema: userSchema.updateSchema }, userController.updateUser)
    fastify.delete('/:id', userController.deleteUser)
    fastify.get('/search', userController.searchUsers)
    fastify.put('/:id/state', userController.updateUserState)
}

module.exports = userRoutes