const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')
const Cpkey = require('../models/cpkey')

usersRouter.get('/', async (request, response) => {
	const users = await User.find({}).populate('oshimens')
	response.json(users.map(user => user.toJSON()))
})

usersRouter.post('/', async (request, response, next) => {
	try {
		const body = request.body

		if (body.password === undefined) {
			return response.status(400).json({ error: 'password missing' })
		}

		if (body.password.length < 3) {
			return response.status(400).json({ error: 'password must be at least 3 characters long' })
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
			oshimens: []
		})

		const savedUser = await user.save()
		await Cpkey.findOneAndDelete({ key: body.createkey })

		response.json(savedUser)
	} catch (exception) {
		next(exception)
	}
})

module.exports = usersRouter