const fastifyPassport = require('@fastify/passport')
const { verifySignUp } = require("../middleware")
const authController = require("../controllers/auth.controller")

async function manual(fastify, options, done) {
    fastify.post("/signin", authController.signin)
    fastify.post("/refreshtoken", authController.refreshToken)
}

async function google(fastify, options, done) {
    fastify.get("/google/callback", // "google/callback"
        {preValidation: fastifyPassport.authenticate('google',{scope:['profile', 'email']})},
        authController.callback
    )
    fastify.get("/login", fastifyPassport.authenticate('google', {scope: ['profile', 'email']}))
    fastify.get("/logout", authController.logout)
}

module.exports = {
    manual,
    google
}