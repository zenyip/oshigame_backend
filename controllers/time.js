const timeRouter = require('express').Router()

timeRouter.get('/', async (request, response, next) => {
	try {
		const serverTime = new Date(Date.now())
		response.json(serverTime)
	} catch (exception) {
		next(exception)
	}
})

module.exports = timeRouter