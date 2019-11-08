const phraseRouter = require('express').Router()
const Phrase = require('../models/phrase')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

phraseRouter.get('/', async (request, response, next) => {
	try {
		const phrase = await Phrase.find({ identifier: 'status' })

		response.json(phrase)

	} catch (exception) {
		next(exception)
	}
})

phraseRouter.post('/', async (request, response, next) => {
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

		const phrase = new Phrase({
			identifier: 'status',
			phrase: body.phrase
		})

		const savedPhrase = await phrase.save()

		response.json(savedPhrase)
	} catch (exception) {
		next(exception)
	}
})

phraseRouter.put('/', async (request, response, next) => {
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

		const filter = {
			identifier: 'status'
		}

		const update = {
			phrase: body.phrase
		}

		const savedPhrase = await Phrase.findOneAndUpdate(filter, update, { new: true })

		response.json(savedPhrase)
	} catch (exception) {
		next(exception)
	}
})

module.exports = phraseRouter