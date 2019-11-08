const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')
const Cpkey = require('../models/cpkey')
const jwt = require('jsonwebtoken')

usersRouter.get('/', async (request, response, next) => {
	try {
		const decodedToken = jwt.verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		const user = await User.findById(decodedToken.id)

		if (!user || !user.admin) {
			return response.status(401).json({ error: 'access limited to admin only' })
		}

		const users = await User.find({}).populate('oshimens negotiations')
		response.json(users.map(user => user.toJSON()))

	} catch (exception) {
		next(exception)
	}
})


usersRouter.get('/byToken', async (request, response, next) => {
	try {
		const decodedToken = jwt.verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		const user = await User.findById(decodedToken.id).populate('oshimens negotiations')
		if (!user) {
			return response.status(400).json({ error: 'user not found' })
		}
		response.json(user.toJSON())
	} catch (exception) {
		next(exception)
	}
})

usersRouter.post('/', async (request, response, next) => {
	try {
		const body = request.body

		if (body.password === undefined) {
			return response.status(400).json({ error: 'password missing' })
		}

		if (body.password.length < 6) {
			return response.status(400).json({ error: 'password must be at least 6 characters long' })
		}

		const checkCP = await Cpkey.findOne({ key: body.createkey })
		if (!checkCP) {
			return response.status(400).json({ error: 'invalid creat key' })
		}

		const saltRounds = 10
		const passwordHash = await bcrypt.hash(body.password, saltRounds)

		const user = new User({
			username: body.username,
			displayname: body.displayname,
			passwordHash,
			oshimens: [],
			assest: 2000,
			admin: false,
			negotiation: []
		})

		const savedUser = await user.save()
		await Cpkey.findOneAndDelete({ key: body.createkey })

		response.json(savedUser)
	} catch (exception) {
		next(exception)
	}
})

module.exports = usersRouter