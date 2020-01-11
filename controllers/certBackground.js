const phraseRouter = require('express').Router()
const CertBackground = require('../models/certBackground')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

phraseRouter.get('/', async (request, response, next) => {
	try {
		const certBackground = await CertBackground.find({ identifier: 'currentImg' })
		const bgImgLink = certBackground[0].imgLink

		response.json(bgImgLink)

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

		const currentImgLink = new CertBackground({
			identifier: 'currentImg',
			imgLink: body.imgLink
		})

		const savedCertBackground = await currentImgLink.save()

		response.json(savedCertBackground)
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
			identifier: 'currentImg'
		}
		console.log(body)

		const update = {
			imgLink: body.newImgLink
		}

		const savedCertBackground = await CertBackground.findOneAndUpdate(filter, update, { new: true })

		response.json(savedCertBackground)
	} catch (exception) {
		next(exception)
	}
})

module.exports = phraseRouter