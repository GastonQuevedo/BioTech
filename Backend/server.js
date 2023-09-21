const fastify = require('fastify')({ logger: true })
const fastifyEnv = require('@fastify/env')
const fastifyCors = require('@fastify/cors')
const fastifyPassport = require('@fastify/passport')
//const fastifySecureSession = require('@fastify/secure-session')
const fastifyCookie = require("@fastify/cookie")
const fastifySession = require("@fastify/session")
const GoogleStrategy = require('passport-google-oauth2').Strategy
const mongoose = require('mongoose')
const dotenv = require("dotenv")
var bcrypt = require("bcryptjs")
const User = require('./app/models/user.model')
const Role = require('./app/models/role.model')
const userRoutes = require('./app/routes/user.routes')
const authRoutes = require('./app/routes/auth.routes')
const deviceRoutes = require('./app/routes/device.routes')

// Load environment variables if needed
dotenv.config()

// Define the schema for environment variables
const envOptions = {
    confKey: 'config',
    schema: {
        type: 'object',
        required: ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'JWT_EXPIRATION', 'JWT_REFRESH_EXPIRATION', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'BACK_URL', 'FRONT_URL'],
        properties: {
            PORT: {type: 'number' },
            MONGODB_URI: { type: 'string' },
            JWT_SECRET: { type: 'string' },
            JWT_EXPIRATION: { type: 'number' },
            JWT_REFRESH_EXPIRATION: { type: 'number' },
            GOOGLE_CLIENT_ID: { type: 'string' },
            GOOGLE_CLIENT_SECRET: { type: 'string' },
            BACK_URL: { type: 'string' },
            FRONT_URL: { type: 'string' }
        }
    },
    dotenv: true
};
  
// Register the fastify-env plugin
fastify.register(fastifyEnv, envOptions)

// Register the fastify secure session plugin
/*fastify.register(fastifySecureSession, {
    key: fs.readFileSync(path.join(__dirname, '.secretKey')),
    cookie: {
        path: '/'
    }
})*/

// Register fastify cookie and session plugin
fastify.register(fastifyCookie)
fastify.register(fastifySession, {
    secret: process.env.JWT_SECRET, // secret must have length 32 or greater
    cookie: { secure: false },
    expires: 1800000
})

// Register the fastify passport plugin, initialize it and connect it to a secure session
fastify.register(fastifyPassport.initialize())
fastify.register(fastifyPassport.secureSession())

// Register the strategy to authenticate
fastifyPassport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACK_URL}/api/auth/google/callback`
}, async function verify(accessToken, refreshToken, profile, cb) {
    try {
        console.log(profile)
        const name = profile.displayName
        const email = profile.email
        const password = Math.random().toString(36).slice(-8)
        const existingUser = await User.findOne({ googleId: profile.id})
        if (existingUser) {
            console.log("user is: " + existingUser)
            cb(undefined, existingUser)
            return
        }
        const user = new User({
            name,
            email,
            password: bcrypt.hashSync(password, 8),
            googleId: profile.id
        })
        const role = await Role.findOne({ name: "user" })
        user.roles = [role._id]
        await user.save()
        console.log("new user saved: " + user)
        cb(undefined, user)
    } catch (error) {
        console.log("error: " + error)
    }
}))
fastifyPassport.registerUserSerializer(async(user, request) => user.id)
fastifyPassport.registerUserDeserializer(async(id, request) => {
    return await User.findById(id)
})

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
    origin: process.env.FRONT_URL, // Set the allowed origin(s) or use '*' to allow all origins
})

// simple route
fastify.get("/", async function (req, reply) {
    if(req.user) {
        const user = await User.findOne({ email: req.user.email }).populate("roles", "-__v")
        reply.send({ message: `Welcome to the backend ${req.user.name} & ${req.user.email}. ${user.roles[0].name}` })
    } else
        reply.send({ message: `Welcome to the backend.` })
})
// routes
fastify.register(userRoutes, { prefix: '/api/users' })
fastify.register(deviceRoutes, { prefix: '/api/devices' })
fastify.register(authRoutes.manual, { prefix: '/api/auth' })
fastify.register(authRoutes.google, { prefix: '/api/auth' })

// set port, listen for requests
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