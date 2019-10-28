const cpkeysRouter = require('express').Router()
const Cpkey = require('../models/cpkey')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

cpkeysRouter.get('/', async (request, response, next) => {
	try {
		const decodedToken = jwt.verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		const user = await User.findById(decodedToken.id)

		if (!user || !user.admin) {
			return response.status(401).json({ error: 'access limited to admin only' })
		}

		const cpkeys = await Cpkey.find({})
		response.json(cpkeys.map(k => k.toJSON()))

	} catch (exception) {
		next(exception)
	}
})

cpkeysRouter.post('/', async (request, response, next) => {
	const body = request.body
	try {
		const decodedToken = jwt.verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		const user = await User.findById(decodedToken.id)

		if (!user || !user.admin) {
			return response.status(401).json({ error: 'access limited to admin only' })
		}

		if (!body.key || body.key.length <= 2) {
			return response.status(400).json({ error: 'keys have to be at least 3-digits long' })
		}

		const cpkey = new Cpkey({
			key: body.key,
		})

		const savedKey = await cpkey.save()

		response.json(savedKey)
	} catch (exception) {
		next(exception)
	}
})

module.exports = cpkeysRouter