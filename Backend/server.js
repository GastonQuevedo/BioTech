const fastify = require('fastify')({ logger: true })
const fastifyEnv = require('@fastify/env')
const fastifyCors = require('@fastify/cors')
const mongoose = require('mongoose')
const dotenv = require("dotenv")
const Role = require('./app/models/role.model')
const userRoutes = require('./app/routes/user.routes')
const authRoutes = require('./app/routes/auth.routes')
const deviceRoutes = require('./app/routes/device.routes')
//const app = fastify()

// Load environment variables if needed
dotenv.config()

// Define the schema for environment variables
const envOptions = {
    confKey: 'config',
    schema: {
        type: 'object',
        required: ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'JWT_EXPIRATION', 'JWT_REFRESH_EXPIRATION'],
        properties: {
            PORT: {type: 'number' },
            MONGODB_URI: { type: 'string' },
            JWT_SECRET: { type: 'string' },
            JWT_EXPIRATION: { type: 'number' },
            JWT_REFRESH_EXPIRATION: { type: 'number' }
        }
    },
    dotenv: true
};
  
// Register the fastify-env plugin
fastify.register(fastifyEnv, envOptions)

// Configure fastify-mongodb
/*fastify.register(fastifyMongoDB, {
    forceClose: true,
    url: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mydb', // Set your MongoDB connection URI or use a default value
})*/

// Configure the db with mongoose
mongoose
.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Connected to MongoDB')
    initializeRoles()
})
.catch((err) => console.error(err));

// Configure fastify-cors
fastify.register(fastifyCors, {
    origin: "http://localhost:3000", // Set the allowed origin(s) or use '*' to allow all origins
})

// simple route
fastify.get("/", (req, reply) => {
    reply.send({ message: "Welcome to the backend." })
})
// routes
fastify.register(userRoutes, { prefix: '/api/users' })
fastify.register(deviceRoutes, { prefix: '/api/devices' })
fastify.register(authRoutes, { prefix: '/api/auth' })

// set port, listen for requests
//const PORT = process.env.PORT || 8030
fastify.listen({port: process.env.PORT}, (err) => {
    if (err) throw err
    console.log(`Server is running on port ${process.env.PORT}.`)
});

async function initializeRoles() {
    try {
        const roles = await Role.find();
        if (roles.length === 0) {
            await Role.insertMany([
                { name: 'user' },
                { name: 'admin' }
            ]);
            console.log('Roles initialized');
        }
    } catch (error) {
        console.error('Error initializing roles:', error);
    }
}