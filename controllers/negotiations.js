const negotiationsRouter = require('express').Router()
const User = require('../models/user')
const Negotiation = require('../models/negotiation')
const Member = require('../models/member')
const jwt = require('jsonwebtoken')

negotiationsRouter.get('/', async (request, response, next) => {
	try {
		const decodedToken = jwt.verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		const user = await User.findById(decodedToken.id)

		if (!user || !user.admin) {
			return response.status(401).json({ error: 'access limited to admin only' })
		}

		const negotiations = await Negotiation.find({}).populate('member applicant')
		response.json(negotiations.map(negotiation => negotiation.toJSON()))

	} catch (exception) {
		next(exception)
	}
})


negotiationsRouter.get('/byUserToken', async (request, response, next) => {
	try {
		const decodedToken = jwt.verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		const user = await User.findById(decodedToken.id).populate('oshimens')
		if (!user) {
			return response.status(400).json({ error: 'user not found' })
		}

		const negotiations = await Negotiation.find({ applicant : user.id })
		response.json(negotiations.map(negotiation => negotiation.toJSON()))
	} catch (exception) {
		next(exception)
	}
})

negotiationsRouter.post('/', async (request, response, next) => {
	try {
		const body = request.body

		const decodedToken = jwt.verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		let user = await User.findById(decodedToken.id)

		if (user.oshimens.includes(body.memberId)) {
			return response.status(400).json({ error: 'the member is already in your agency' })
		}

		if (user.assest < body.bid) {
			return response.status(400).json({ error: 'you do not have enough assest' })
		}

		const member = await Member.findById(body.memberId)

		if (body.bid < member.value) {
			return response.status(400).json({ error: 'your bid is too low' })
		}

		const oldApplication = await Negotiation.findOne({ member: body.memberId })
		if (oldApplication) {
			if (body.bid < oldApplication.bid + 10) {
				return response.status(400).json({ error: 'new bid have to be at least 10 higher than the current bid' })
			}
			const oldApplicant = await User.findById(oldApplication.applicant)
			const updatedNegotiations = oldApplicant.negotiations.filter(n => !n.toString().includes(oldApplication.id))
			const update = {
				assest: oldApplicant.assest + oldApplication.bid,
				negotiations: updatedNegotiations
			}
			await User.findByIdAndUpdate(oldApplicant.id, update, { new: true })
		}
		user = await User.findById(decodedToken.id)
		const update = { assest: user.assest - body.bid }
		await User.findByIdAndUpdate(user.id, update, { new: true })
		let savedNegotiation

		if (oldApplication) {
			const filter = { member: member.id }
			const update = {
				bid: body.bid,
				applicant: user.id
			}
			savedNegotiation = await Negotiation.findOneAndUpdate(filter, update, { new: true })
		} else {
			const negotiation = new Negotiation({
				member: member.id,
				bid: body.bid,
				tradeType: body.tradeType,
				applicant: user.id
			})
			savedNegotiation = await negotiation.save()
			const memberUpdate = {
				negotiation: savedNegotiation.id
			}
			await Member.findByIdAndUpdate(member.id, memberUpdate, { new: true })
		}
		const applicantUpdate = {
			negotiations: user.negotiations.concat(savedNegotiation.id)
		}
		await User.findByIdAndUpdate(user.id, applicantUpdate, { new: true })
		response.json(savedNegotiation)
	} catch (exception) {
		next(exception)
	}
})

negotiationsRouter.post('/settle', async (request, response, next) => {
	try {
		const decodedToken = jwt.verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		const user = await User.findById(decodedToken.id)

		if (!user || !user.admin) {
			return response.status(401).json({ error: 'access limited to admin only' })
		}

		const negotiations = await Negotiation.find({})

		const settling = async () => {
			for (let i = 0; i < negotiations.length; i++) {
				const memberUpdate = {
					negotiation: null,
					agency: negotiations[i].applicant,
					value: negotiations[i].bid
				}
				await Member.findByIdAndUpdate(negotiations[i].member, memberUpdate, { new: true })
				const applicant = await User.findById(negotiations[i].applicant)
				const userUpdate = {
					negotiations: [],
					oshimens: applicant.oshimens.concat(negotiations[i].member)
				}
				await User.findByIdAndUpdate(negotiations[i].applicant, userUpdate, { new: true })
			}
		}

		await settling()

		await Negotiation.deleteMany({})

		response.status(200).json( { message: 'negotiations settled' } )
	} catch (exception) {
		next(exception)
	}
})

module.exports = negotiationsRouter