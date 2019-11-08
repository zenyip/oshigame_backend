const resetRouter = require('express').Router()
const Member = require('../models/member')
const User = require('../models/user')
const Negotiation = require('../models/negotiation')
const jwt = require('jsonwebtoken')

resetRouter.post('/', async (request, response, next) => {
	try {
		const decodedToken = jwt.verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		const user = await User.findById(decodedToken.id)

		if (!user || !user.admin) {
			return response.status(401).json({ error: 'access limited to admin only' })
		}

		const memberUpdate = {
			agency: null,
			value: 480,
			negotiation: null
		}
		await Member.updateMany({}, memberUpdate, { new: true })

		const userUpdate = {
			oshimens: [],
			assest: 2000,
			negotiations: []
		}
		await User.updateMany({}, userUpdate, { new: true })

		await Negotiation.deleteMany({})

		response.status(200).json( { message: 'database reseted' } )
	} catch (exception) {
		next(exception)
	}
})

module.exports = resetRouter