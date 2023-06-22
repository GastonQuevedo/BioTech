const User = require("../models/user.model")
const ROLES = ["user", "admin"]

checkDuplicateEmail = (req, reply, done) => {
    // Email
    User.findOne({
        where: {
            email: req.body.email
        }
    }).exec((err, user) => {
        if (err) {
            reply.status(500).send({ message: err })
            return
        }
        if (user) {
            reply.status(400).send({
                message: "Failed! Email is already in use!"
            })
            return
        }
        done()
    })
}

checkRolesExisted = (req, reply, done) => {
    if (req.body.roles) {
        for (let i = 0; i < req.body.roles.length; i++) {
            if (!ROLES.includes(req.body.roles[i])) {
                reply.status(400).send({
                    message: "Failed! Role does not exist = " + req.body.roles[i]
                })
                return
            }
        }
    }
    done()
}

const verifySignUp = {
    checkDuplicateEmail,
    checkRolesExisted
}

module.exports = verifySignUp