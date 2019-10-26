const cpkeysRouter = require('express').Router()
const Cpkey = require('../models/cpkey')

cpkeysRouter.get('/', async (request, response) => {
	const cpkeys = await Cpkey.find({})
	response.json(cpkeys.map(k => k.toJSON()))
})

cpkeysRouter.post('/', async (request, response, next) => {
	try {
		const body = request.body

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