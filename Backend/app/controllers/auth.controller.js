const config = require("../config/auth.config")
const User = require("../models/user.model")
const Role = require("../models/role.model")
const RefreshToken = require("../models/refreshToken.model")
var jwt = require("jsonwebtoken")
var bcrypt = require("bcryptjs")

async function signin(request, reply) {
	try {
		const userEmail = request.body.email
		const user = await User.findOne({ email: userEmail }).populate("roles", "-__v")
		if (!user) {
			return reply.status(404).send({ message: 'User Not found' })
		}
		let passwordIsValid = bcrypt.compareSync(
			request.body.password,
			user.password
		)
		if (!passwordIsValid) {
			return reply.status(401).send({
				accessToken: null,
				message: "Invalid Password!"
			})
		}
		let token = jwt.sign({ id: user.id }, config.secret, {
			expiresIn: config.jwtExpiration
		})
		let refreshToken = await RefreshToken.createToken(user)
		let authorities = []
		for (let i = 0; i < user.roles.length; i++) {
			authorities.push("ROLE_" + user.roles[i].name.toUpperCase())
		}
		reply.status(200).send({
			id: user._id,
			name: user.name,
			email: user.email,
			roles: authorities,
			accessToken: token,
			refreshToken: refreshToken,
		})
	} catch (error) {
		reply.status(500).send(error)
	}
}

async function refreshToken (req, reply) {
	const { refreshToken: requestToken } = req.body
	if (requestToken == null) {
		return reply.status(403).json({ message: "Refresh Token is required!" });
	}
	try {
		let refreshToken = await RefreshToken.findOne({ token: requestToken })
		if (!refreshToken) {
			res.status(403).json({ message: "Refresh token is not in database!" })
			return
		}
		if (RefreshToken.verifyExpiration(refreshToken)) {
			RefreshToken.findByIdAndRemove(refreshToken._id, { useFindAndModify: false }).exec()
			res.status(403).json({
				message: "Refresh token was expired. Please make a new signin request",
			})
			return
		}
		let newAccessToken = jwt.sign({ id: refreshToken.user._id }, config.secret, {
			expiresIn: config.jwtExpiration,
		})
		return reply.status(200).json({
			accessToken: newAccessToken,
			refreshToken: refreshToken.token,
		})
	} catch (err) {
		return reply.status(500).send({ message: err })
	}
}

module.exports = {
	signin,
	refreshToken
}