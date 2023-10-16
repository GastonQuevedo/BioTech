const fastify = require('fastify')({ logger: true })
const fastifyEnv = require('@fastify/env')
const fastifyCors = require('@fastify/cors')
const fastifyPassport = require('@fastify/passport')
//const fastifySecureSession = require('@fastify/secure-session')
const fastifyCookie = require("@fastify/cookie")
const fastifySession = require("@fastify/session")
const fastifyIO = require("fastify-socket.io")
const GoogleStrategy = require('passport-google-oauth2').Strategy
const mongoose = require('mongoose')
const dotenv = require("dotenv")
var bcrypt = require("bcryptjs")
const User = require('./app/models/user.model')
const Role = require('./app/models/role.model')
const Device = require('./app/models/device.model').device
const Room = require('./app/models/room.model')
const roomController = require('./app/controllers/room.controller')
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
        required: ['HOST', 'PORT', 'MONGODB_URI', 'JWT_SECRET', 'JWT_EXPIRATION', 'JWT_REFRESH_EXPIRATION', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'BACK_URL', 'FRONT_URL', 'FRONT_URL_CORS'],
        properties: {
            HOST: { type: 'string'},
            PORT: { type: 'number' },
            MONGODB_URI: { type: 'string' },
            JWT_SECRET: { type: 'string' },
            JWT_EXPIRATION: { type: 'number' },
            JWT_REFRESH_EXPIRATION: { type: 'number' },
            GOOGLE_CLIENT_ID: { type: 'string' },
            GOOGLE_CLIENT_SECRET: { type: 'string' },
            BACK_URL: { type: 'string' },
            FRONT_URL: { type: 'string' },
            FRONT_URL_CORS: { type: 'string' }
        }
    },
    dotenv: true
}
  
// Register the fastify-env plugin
fastify.register(fastifyEnv, envOptions)

// Register the fastify-socket.io plugin
fastify.register(fastifyIO, {
    cors: {
        origin: process.env.FRONT_URL_CORS.split(" "),
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
})

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
    initializeRooms()
})
.catch((err) => console.error(err));

// Configure fastify-cors
fastify.register(fastifyCors, {
    origin: process.env.FRONT_URL_CORS.split(" "), // Set the allowed origin(s) or use '*' to allow all origins
})

// Simple route
fastify.get("/", async function (req, reply) {
    if(req.user) {
        const user = await User.findOne({ email: req.user.email }).populate("roles", "-__v")
        reply.send({ message: `Welcome to the backend ${req.user.name} & ${req.user.email}. ${user.roles[0].name}` })
    } else
        reply.send({ message: `Welcome to the backend.` })
})
// Routes
fastify.register(userRoutes, { prefix: '/api/users' })
fastify.register(deviceRoutes, { prefix: '/api/devices' })
fastify.register(authRoutes.manual, { prefix: '/api/auth' })
fastify.register(authRoutes.google, { prefix: '/api/auth' })

// Set port, listen for requests
fastify.listen({host: process.env.HOST, port: process.env.PORT}, (err) => {
    if (err) throw err
    console.log(`Server is running on host ${process.env.HOST} and port ${process.env.PORT}.`)
})

// Signaling
let users = {} //connections = {}
/*const emailToSocketIdMap = new Map()
const socketidToEmailMap = new Map()*/
fastify.ready().then(() => {
    fastify.io.on("connection", (socket) => {
        console.log("Client connected with id: " + socket.id)

        socket.on("join", ({ email, room }) => {    // Receives a JSON object containing email and room
            const user = users[socket.id]
            if (user) {
                socket.to(user.room).emit("user-left", user.email)
                socket.leave(user.room)
                delete users[socket.id]
            }
            socket.join(room)
            users[socket.id] = { id: socket.id, email, room }
            socket.to(room).emit("user-joined", email)
            socket.emit("message", "Welcome to the chat room!")
        })
        socket.on("leave", () => {
            const user = users[socket.id]
            if (user) {
                socket.to(user.room).emit("user-left", user.email)
                socket.leave(user.room)
                delete users[socket.id]
            }
        })
        socket.on("send-message", (message) => {    // Receives a text message, not a JSON object
            const user = users[socket.id]
            if (user) {
                socket.broadcast.to(user.room).emit("message", `${user.email}: ${message}`)
            } else {
                socket.emit("message", "Please join a room to start chatting.")
            }
        })
        socket.on("disconnect", () => {
            const user = users[socket.id]
            if (user) {
                socket.to(user.room).emit("user-left", user.email)
                delete users[socket.id]
            }
        })
        // Emmit the initial list of rooms
        /*socket.emit("rooms", rooms)

        socket.on("ready", (peerId, peerType) => {
            // Make sure that the hostname is unique, if the hostname is already in connections, send an error and disconnect
            if (peerId in connections) {
                socket.emit("uniquenessError", {
                    message: `${peerId} is already connected to the signalling server. Please change your peer ID and try again.`,
                })
                socket.disconnect(true)
            } else {
                console.log(`Added ${peerId} to connections`)
                // Let new peer know about all exisiting peers
                socket.send({ from: "all", target: peerId, payload: { action: "open", connections: Object.values(connections), bePolite: false } }) // The new peer doesn't need to be polite.
                // Create new peer
                const newPeer = { socketId: socket.id, peerId, peerType }
                // Updates connections object
                connections[peerId] = newPeer
                // Let all other peers know about new peer
                socket.broadcast.emit("message", {
                    from: peerId,
                    target: "all",
                    payload: { action: "open", connections: [newPeer], bePolite: true }, // send connections object with an array containing the only new peer and make all exisiting peers polite.
                })
            }
        })

        socket.on("join", (room, email) => {
            if (socket.room) {
                socket.leave(socket.room)
                rooms[socket.room]--
                if (rooms[socket.room === 0]) {
                    delete rooms[socket.room]
                }
            }
            socket.join(room)
            socket.room = room
            socket.email = email
            if (!rooms[room]) {
                rooms[room] = {
                    admin: socket.id,
                    users: {}
                }
            }
            rooms[room].users[socket.id] = {
                email
            }
            // Update the room list for all clients
            fastify.io.emit("rooms", rooms)
            console.log(`Client ${socket.id} joined room ${room} with email ${email}.`)
            socket.emit("join", {room, email})
        })

        socket.on("leave", () => {
            if (socket.room) {
                socket.leave(socket.room)
                rooms[socket.room]--
                if (rooms[socket.room] === 0) {
                    delete rooms[socket.room]
                }
                fastify.io.emit("rooms", rooms)
                console.log(`Client ${socket.id} left room ${socket.room}`)
                socket.room = null
            }
        })

        socket.on("message", (data) => {
            const { message, room } = data
            console.log(`Client (${socket.id}) sent message: ${message} to room ${room}`)
            socket.broadcast.to(room).emit("message", {email: socket.id, message: message, room: room})
        })
        socket.on("offer", (offer) => {
            // Process the offer and generate an answer
            const answer = generateAnswer(offer)
            // Send the answer to the client
            socket.emit('answer', answer)
        })
        socket.on("disconnect", () => {
            const disconnectingPeer = Object.values(connections).find((peer) => peer.socketId === socket.id);
            if (disconnectingPeer) {
                console.log("Disconnected", socket.id, "with peerId", disconnectingPeer.peerId);
                // Make all peers close their peer channels
                socket.broadcast.emit("message", {
                    from: disconnectingPeer.peerId,
                    target: "all",
                    payload: { action: "close", message: "Peer has left the signaling server" },
                });
                // remove disconnecting peer from connections
                delete connections[disconnectingPeer.peerId];
            } else {
                console.log(socket.id, "has disconnected")
                socket.broadcast.emit("disconnectPeer", `Client ${socket.id} has disconnected`)
            }
        })

        socket.on("room:join", (data) => {
            const { email, room } = data;
            //Conexión bidireccional entre el email y el socket id
            emailToSocketIdMap.set(email, socket.id);
            socketidToEmailMap.set(socket.id, email);
            fastify.io.to(room).emit("user:joined", { email, id: socket.id });
            socket.join(room);
            fastify.io.to(socket.id).emit("room:join", data);
        })*/
    })
})

// Functions
async function initializeRoles() {
    try {
        const roles = await Role.find()
        if (roles.length === 0) {
            await Role.insertMany([
                { name: 'user' },
                { name: 'admin' }
            ]);
            console.log('Roles initialized')
        }
    } catch (error) {
        console.error('Error initializing roles:', error)
    }
}

async function initializeRooms() {
    try {
        const devices = await Device.find()
        const rooms = await Room.find()
        if (devices.length === 0) {
            console.log('There are no devices to initialize rooms')
        } else {
            if (rooms.length === 0) {
                for (let i = 0; i < devices.length; i++) {
                    roomController.createRoom(i+1, devices[i])
                }
                console.log('Rooms initialized')
            } else if (rooms.length < devices.length) {
                /*for (let i = 0; i < devices.length; i++) {
                    let aux = 0
                    for (let j = 0; j < rooms.length; j++) {
                        if (devices[i].ipDirection == rooms[j].device.ipDirection)
                            aux += 1
                    }
                    if (aux != rooms.length) {
                        roomController.createRoom(
                    }
                }*/
                console.log('The rest of the rooms have been initialized')
            } else {
                console.log('Rooms already initialized')
            }
        }
    } catch (error) {
        console.error('Error initializing rooms:', error)
    }
}