const { verifySignUp } = require("../middleware")
const authController = require("../controllers/auth.controller")

async function authRoutes(fastify, options, done) {
    /*fastify.register(function(req, reply) {
        reply.headers(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        )
        done()
    })*/
    fastify.post("/signin", authController.signin)
    fastify.post("/refreshtoken", authController.refreshToken)
}

module.exports = authRoutes