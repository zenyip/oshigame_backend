const noticesRouter = require('express').Router()
const Notice = require('../models/notice')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

noticesRouter.get('/', async (request, response, next) => {
	try {
		const notices = await Notice.find({})

		response.json(notices)

	} catch (exception) {
		next(exception)
	}
})

noticesRouter.post('/', async (request, response, next) => {
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

		const notice = new Notice({
			content: body.content
		})

		const savedNotice = await notice.save()

		response.json(savedNotice)
	} catch (exception) {
		next(exception)
	}
})

noticesRouter.put('/:id', async (request, response, next) => {
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

		const update = {
			content: body.content
		}

		const updatedNotice = await Notice.findByIdAndUpdate(request.params.id, update, { new: true })

		response.json(updatedNotice)
	} catch (exception) {
		next(exception)
	}
})

noticesRouter.delete('/:id', async (request, response, next) => {
	try {
		const decodedToken = jwt.verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		const user = await User.findById(decodedToken.id)

		if (!user || !user.admin) {
			return response.status(401).json({ error: 'access limited to admin only' })
		}

		const deletedNotice = await Notice.findByIdAndDelete(request.params.id)

		response.json(deletedNotice)

	} catch (exception) {
		next(exception)
	}
})

module.exports = noticesRouter