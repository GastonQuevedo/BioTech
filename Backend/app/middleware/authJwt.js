const jwt = require("jsonwebtoken")
const config = require("../config/auth.config.js")
const User = require("../models/user.model")
const Role = require("../models/role.model")

const { TokenExpiredError } = jwt
const catchError = (err, reply) => {
    if (err instanceof TokenExpiredError) {
        return reply.status(401).send({
            message: "Unauthorized! Access Token was expired!"
        })
    }
    return reply.sendStatus(401).send({
        message: "Unauthorized!"
    })
}
verifyToken = (req, reply, done) => {
    let token = req.headers["x-access-token"]
    if (!token) {
        return reply.status(403).send({
            message: "No token provided!"
        })
    }
    jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
            return reply.status(401).send({ message: "Unauthorized!" })
        }
        req.userId = decoded.id;
        done()
    })
}
isAdmin = (req, reply, done) => {
    User.findById(req.userId).exec((err, user) => {
        if (err) {
            reply.status(500).send({ message: err })
            return
        }
        Role.find(
            {
                _id: { $in: user.roles }
            },
            (err, roles) => {
                if (err) {
                    reply.status(500).send({ message: err })
                    return;
                }
                for (let i = 0; i < roles.length; i++) {
                    if (roles[i].name === "admin") {
                        done()
                        return
                    }
                }
                reply.status(403).send({ message: "Require Admin Role!" })
                return;
            }
        )
    })
}
const authJwt = {
    verifyToken,
    isAdmin
}
module.exports = authJwt